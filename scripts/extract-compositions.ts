#!/usr/bin/env tsx
/**
 * Mechanically extract each `*Generator.java` into a "composition" — an ordered
 * list of `R.string.*` keys referenced by that generator. Used as a baseline
 * scaffold for the data-driven generator. Hand-tuned overrides take precedence.
 *
 * Output: src/data/compositions.json
 *   {
 *     "halel":   { "title": "halel_title", "keys": [{ key: "halel", ... }] },
 *     ...
 *   }
 *
 * The extraction is conservative: it walks the source line by line and emits a
 * key whenever it sees `R.string.X` used in a context that looks like a row
 * `.k(...)` (body) or `.n(...)`/`.m(...)` (title) call. Branches are flattened
 * (all variants appear sequentially), so the output is a superset — the runtime
 * filters down by nusach.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = join(__dirname, '..', '..', 'extracted', 'jadx_out', 'sources', 'com', 'karriapps', 'smartsiddur', 'generators')
const OUT = join(__dirname, '..', 'src', 'data', 'compositions.json')

interface CompositionRow {
  title?: string
  body: string
  /** Source-conditional nusach: row was inside `if (nusach == X)` in the Java. */
  nusach?: 'ashkenaz' | 'sfarad' | 'chabad' | 'edot'
}

type SrcNusach = 'ashkenaz' | 'sfarad' | 'chabad' | 'edot'

interface Composition {
  generatorClass: string
  rows: CompositionRow[]
}

function parseGenerator(filePath: string): Composition {
  const src = readFileSync(filePath, 'utf8')
  const lines = src.split('\n')
  const rows: CompositionRow[] = []

  // We also track the *source-conditional nusach scope*: when the Java has
  //   if (SSApp.m().w() == hVar) { ... R.string.patah ... }
  // and `hVar` aliases `SSApp.h.EDOT`, every R.string emission inside that block
  // is intended only for the Edot nusach — even though the key `patah` carries
  // no `Edot` suffix. We track this via:
  //   1. A map of local Java variables → nusach (resolved from `SSApp.h X = SSApp.h.Y`).
  //   2. A stack of (open-brace-depth, nusach-scope) entries pushed when an
  //      `if (SSApp.m().w() == HVar)` opens a block and popped when its braces close.
  // The innermost non-null scope wins.

  const NUSACH_ENUM_TO_KEY: Record<string, SrcNusach> = {
    EDOT: 'edot',
    SFARAD: 'sfarad',
    ASHKENAZ: 'ashkenaz',
    CHABAD: 'chabad',
  }
  const aliasToNusach = new Map<string, SrcNusach>()
  // Local variables that hold the current `SSApp.m().w()` value. Conditions
  // like `hVarW == hVar` count as nusach checks once we know hVarW aliases w().
  const wAliases = new Set<string>()
  // Stack: each entry has the brace depth at which the scope was pushed and
  // the set of nusachim the scope restricts to (or null for "no nusach gate").
  // When the running depth falls back to that level, pop. The current scope
  // is the intersection of every enclosing non-null nusach set.
  const scopeStack: Array<{ depth: number; nusachs: SrcNusach[] | null }> = []
  let depth = 0
  let pendingTitle: string | undefined

  const currentScope = (): SrcNusach[] | undefined => {
    let acc: Set<SrcNusach> | null = null
    for (const f of scopeStack) {
      if (!f.nusachs) continue
      if (!acc) acc = new Set(f.nusachs)
      else acc = new Set([...acc].filter((n) => f.nusachs!.includes(n)))
    }
    return acc ? [...acc] : undefined
  }

  // Returns the nusach that an `if` condition exclusively gates on, or null
  // if the condition is mixed/unrecognised. Recognises every common shape:
  //   if (SSApp.m().w() == X)                if (X == SSApp.m().w())
  //   if (SSApp.m().w().equals(X))           if (X.equals(SSApp.m().w()))
  //   if (HVARW == X)                        if (X == HVARW)         (HVARW caches w())
  //   if (HVARW.equals(X))                   if (X.equals(HVARW))
  // where X is either `SSApp.h.EDOT` etc. or a local alias mapped via aliasToNusach.
  const isWExpr = (e: string) => e === 'SSApp.m().w()' || wAliases.has(e)
  const resolveNusachOperand = (raw: string): SrcNusach | null => {
    const e = raw.trim()
    const lit = e.match(/^SSApp\.h\.(\w+)$/)
    if (lit) return NUSACH_ENUM_TO_KEY[lit[1]] ?? null
    return aliasToNusach.get(e) ?? null
  }
  // Recognise a single nusach equality clause: returns the matched nusach
  // (string) when the clause is exactly `w() == X` / `X == w()` /
  // `w().equals(X)` / `X.equals(w())`, otherwise null.
  const recogniseClause = (c: string): SrcNusach | null => {
    const eq = c.match(/^\s*([\w.()]+)\s*==\s*([\w.()]+)\s*$/)
    if (eq) {
      const [, l, r] = eq
      if (isWExpr(l)) return resolveNusachOperand(r)
      if (isWExpr(r)) return resolveNusachOperand(l)
    }
    const eqMethod = c.match(/^\s*([\w.()]+)\.equals\(([\w.()]+)\)\s*$/)
    if (eqMethod) {
      const [, l, r] = eqMethod
      if (isWExpr(l)) return resolveNusachOperand(r)
      if (isWExpr(r)) return resolveNusachOperand(l)
    }
    return null
  }

  /**
   * Returns the *set* of nusachim that an `if` condition exclusively gates
   * on. A bare equality returns a singleton; `A || B` (any depth) returns the
   * union if every clause is a recognised nusach equality. Returns null when
   * the condition includes anything we can't classify (mixed boolean logic,
   * non-nusach checks, etc.).
   */
  const recogniseNusachIf = (cond: string): SrcNusach[] | null => {
    if (/&&/.test(cond)) return null // AND mixes orthogonal checks; bail.
    const clauses = cond.split('||').map((c) => c.trim())
    const result = new Set<SrcNusach>()
    for (const c of clauses) {
      const m = recogniseClause(c)
      if (!m) return null
      result.add(m)
    }
    return result.size > 0 ? [...result] : null
  }

  for (const line of lines) {
    // Track local variable aliases: `SSApp.h hVar = SSApp.h.EDOT;`
    const aliasDecl = line.match(/SSApp\.h\s+(\w+)\s*=\s*SSApp\.h\.(\w+)/)
    if (aliasDecl) {
      const n = NUSACH_ENUM_TO_KEY[aliasDecl[2]]
      if (n) aliasToNusach.set(aliasDecl[1], n)
    }
    // Track caches of the current nusach value: `SSApp.h hVarW = SSApp.m().w();`
    const wCache = line.match(/SSApp\.h\s+(\w+)\s*=\s*SSApp\.m\(\)\.w\(\)/)
    if (wCache) wAliases.add(wCache[1])

    // Detect `if (cond) {` openings that exclusively gate on nusach. The
    // condition can contain nested parens (e.g. `SSApp.m().w()`), so we extract
    // it by balancing parens rather than matching a simple regex.
    let pendingScope: SrcNusach[] | null | undefined = undefined
    const ifIdx = line.search(/\bif\s*\(/)
    if (ifIdx >= 0) {
      const openParen = line.indexOf('(', ifIdx)
      let pdepth = 1
      let close = -1
      for (let k = openParen + 1; k < line.length; k++) {
        if (line[k] === '(') pdepth++
        else if (line[k] === ')') {
          pdepth--
          if (pdepth === 0) {
            close = k
            break
          }
        }
      }
      if (close > 0 && /^\s*\{/.test(line.slice(close + 1))) {
        const cond = line.slice(openParen + 1, close)
        pendingScope = recogniseNusachIf(cond)
      }
    }

    // Brace bookkeeping for the line. We compute the depth changes piecewise so
    // we can push the new scope at the right moment.
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '{') {
        depth++
        // If this `{` immediately follows an `if (...)` we recognised, push.
        if (pendingScope !== undefined) {
          scopeStack.push({ depth, nusachs: pendingScope })
          pendingScope = undefined
        }
      } else if (ch === '}') {
        while (scopeStack.length > 0 && scopeStack[scopeStack.length - 1].depth >= depth) {
          scopeStack.pop()
        }
        depth--
      }
    }

    // Match title setters
    const titleMatches = [
      /\.n\(SSApp\.m\(\)\.r\(R\.string\.(\w+)\)\)/,
      /\.n\(SSApp\.m\(\)\.getString\(R\.string\.(\w+)\)\)/,
      /\.m\(R\.string\.(\w+)\)/,
    ]
    for (const re of titleMatches) {
      const m = line.match(re)
      if (m) pendingTitle = m[1]
    }

    // Match body setters. Each `.k(...)` line emits ONE logical prayer row,
    // but the expression inside may reference multiple R.string keys:
    //   ternary:  ? R.string.A : R.string.B     → both A and B are nusach alternates
    //   concat:   R.string.A + R.string.B       → A is the body, B is appended text
    //   format:   String.format(R.string.A, R.string.B, ...) → A is the body, rest are args
    // Heuristic: take all R.string refs separated by ?: from the *first* group of
    // them up to the first `+` or `,` (i.e. before the line transitions to args).
    if (line.includes('.k(') || line.includes('.i(R.string') || line.includes('.l(R.string')) {
      // Slice from the first R.string reference up to the first `+` or `,` or `)` at depth 0.
      const kCall = line.match(/\.[kil]\(([^]*)/)
      const inside = kCall ? kCall[1] : line
      // Find the leading "template" expression: everything before the first comma
      // or plus that isn't inside parens.
      let depth = 0
      let cutAt = inside.length
      for (let i = 0; i < inside.length; i++) {
        const ch = inside[i]
        if (ch === '(') depth++
        else if (ch === ')') {
          if (depth === 0) {
            cutAt = i
            break
          }
          depth--
        } else if (depth === 0 && (ch === ',' || ch === '+')) {
          cutAt = i
          break
        }
      }
      const headExpr = inside.slice(0, cutAt)
      const all: string[] = []
      const bodyRe = /R\.string\.(\w+)/g
      let m: RegExpExecArray | null
      while ((m = bodyRe.exec(headExpr))) all.push(m[1])
      const bodies = all.filter((k) => !/^_?[Tt]itle$|Title$|_title$/.test(k))
      const scoped = currentScope()
      for (const body of bodies) {
        if (scoped && scoped.length > 0) {
          // Source scoped this row to a specific nusach set. Emit one row per
          // member so each user's pickBody sees a row explicitly for their nusach.
          for (const n of scoped) {
            rows.push({ title: pendingTitle, body, nusach: n })
          }
        } else {
          rows.push({ title: pendingTitle, body })
        }
        pendingTitle = undefined
      }
    }
  }

  return {
    generatorClass: filePath.split('/').pop()!.replace(/\.java$/, ''),
    rows,
  }
}

function walkDir(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkDir(full))
    else if (entry.name.endsWith('Generator.java')) out.push(full)
  }
  return out
}

const files = walkDir(SRC_DIR)
const out: Record<string, Composition> = {}
for (const f of files) {
  const comp = parseGenerator(f)
  // Skip the abstract base classes
  if (comp.generatorClass === 'AbsShacharitGenerator' || comp.generatorClass === 'TfilaGenerator') continue
  const id = comp.generatorClass.replace(/Generator$/, '').replace(/^./, (c) => c.toLowerCase())
  out[id] = comp
}

// The Amida lives in the obfuscated `g7/a.java` package — it's the heart of every
// service (Shacharit/Mincha/Arvit/Mussaf) but isn't named `*Generator.java`, so
// the directory walker above won't pick it up. Add it manually.
const amidaPath = join(SRC_DIR, '..', '..', '..', '..', 'g7', 'a.java')
try {
  const amida = parseGenerator(amidaPath)
  amida.generatorClass = 'AmidaGenerator'
  out.amida = amida
} catch (e) {
  console.warn('Could not extract Amida from g7/a.java:', (e as Error).message)
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')

const summary: Array<[string, number]> = Object.entries(out)
  .map(([id, c]) => [id, c.rows.length] as [string, number])
  .sort((a, b) => b[1] - a[1])
for (const [id, count] of summary) console.log(`${id.padEnd(28)} ${count}`)
console.log(`\nTotal: ${Object.keys(out).length} generators, ${summary.reduce((a, b) => a + b[1], 0)} rows`)
