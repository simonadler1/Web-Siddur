import type { Generator, GeneratorContext, TfilaRow } from './types'
import { p } from './util'
import type { Nusach } from '../lib/settings'
import compositions from '../data/compositions.json'

interface CompositionRow {
  title?: string
  body: string
  /** Source-conditional nusach: the Java wrapped this row in `if (nusach == X)`. */
  nusach?: Nusach
}

interface Composition {
  generatorClass: string
  rows: CompositionRow[]
}

const SUFFIX_TO_NUSACH: Array<{ suffix: string; nusach: Nusach }> = [
  { suffix: 'Sefarad', nusach: 'sfarad' },
  { suffix: 'Sfarad', nusach: 'sfarad' },
  { suffix: 'Chabad', nusach: 'chabad' },
  { suffix: 'Ashkenaz', nusach: 'ashkenaz' },
]

/**
 * Composable tags that can be stripped to find a key's root identity.
 * Order matters — we peel from the outside in: Woman first (gender), then
 * the nusach suffix, then optional seasonal/conditional tags. We stop after
 * one full pass so we don't strip into the actual root word.
 */
const STRIPPABLE_SUFFIXES = ['Woman', 'Aseret', 'Summer', 'Winter', 'NoTahanun']

function classifyKey(key: string): { base: string; nusach: Nusach | null; tags: string[] } {
  let work = key
  const tags: string[] = []

  // Repeatedly peel off recognised suffixes until none match. Cap iterations
  // to avoid pathological loops on, e.g., "SefaradSefarad".
  for (let i = 0; i < 4; i++) {
    let changed = false
    for (const tag of STRIPPABLE_SUFFIXES) {
      if (work.endsWith(tag) && work.length > tag.length) {
        tags.push(tag.toLowerCase())
        work = work.slice(0, -tag.length)
        changed = true
        break
      }
    }
    if (!changed) break
  }

  for (const { suffix, nusach } of SUFFIX_TO_NUSACH) {
    if (work.endsWith(suffix) && work.length > suffix.length) {
      return { base: work.slice(0, -suffix.length), nusach, tags }
    }
  }
  return { base: work, nusach: null, tags }
}

/**
 * Group consecutive raw rows that share a base name. Each group becomes one
 * logical TfilaRow; at render time we pick the body variant matching the
 * active nusach (and woman/season flags when set).
 */
interface BodyVariant {
  nusach: Nusach | null
  tags: string[]
  key: string
}
interface Group {
  title?: string
  base: string
  bodies: BodyVariant[]
}

/**
 * Keys that the source uses purely as `String.format` arguments — instructions,
 * conditional micro-fragments, etc. They should never become a rendered row by
 * themselves, but the source extractor over-collects them. Filtering them out
 * keeps consecutive nusach variants together so they collapse into one group.
 */
const ARG_SUFFIX_RE = /(Instruction|BeforeChabad|AfterChabad|Whisper|Klum|GoodCustomMorning|TitleArgs|StartFlag|EndFlag|ChabadInstruction|AshkenazInstruction|SefaradInstruction)$/i
const EXPLICIT_ARG_KEYS = new Set([
  'klum',
  'whisper',
  'shazRepeat',
  'standBefore',
  'chazanSays',
  'kahalSays',
  'threeTimes',
  'goodCustomMorning',
  'modeInstruction',
  'netilaInstruction',
  'zizitKissShma',
  'shmaZizit',
  'shmaZizitEnd',
  'zizitShmaEnd',
  'kissTfilin',
  'tfilinYad',
  'tfilinRosh',
  'tfila_haderech_return',
  'hashemEmet',
  'hashemEmetAri',
  'emet',
])

function isArgKey(key: string): boolean {
  if (EXPLICIT_ARG_KEYS.has(key)) return true
  if (ARG_SUFFIX_RE.test(key)) return true
  return false
}

function groupRows(rows: CompositionRow[]): Group[] {
  const groups: Group[] = []
  for (const row of rows) {
    if (isArgKey(row.body)) continue // Skip interpolation-argument keys outright.
    const cls = classifyKey(row.body)
    // The source-conditional nusach (if any) overrides what the suffix would say.
    // Example: `patah` has no suffix, but the Java emits it only inside
    // `if (nusach == EDOT)` — so its effective nusach is 'edot'.
    const nusach = row.nusach ?? cls.nusach
    const base = cls.base
    const last = groups[groups.length - 1]
    if (last && last.base === base) {
      last.bodies.push({ nusach, tags: cls.tags, key: row.body })
      if (!last.title && row.title) last.title = row.title
    } else {
      groups.push({ title: row.title, base, bodies: [{ nusach, tags: cls.tags, key: row.body }] })
    }
  }
  return groups
}

function pickBody(group: Group, nusach: Nusach, isWoman: boolean): string {
  // 1. Exact nusach + matching gender preference
  const exactGender = group.bodies.find(
    (b) => b.nusach === nusach && b.tags.includes('woman') === isWoman,
  )
  if (exactGender && p(exactGender.key)) return p(exactGender.key)

  // 2. Exact nusach, gender mismatch tolerated
  const exact = group.bodies.find((b) => b.nusach === nusach)
  if (exact && p(exact.key)) return p(exact.key)

  // 3. Bare/edot variant — but ONLY when the source code didn't list other
  //    nusachim explicitly. If it did (e.g. EDOT + CHABAD only) and ours isn't
  //    one of them, this row was intended only for those nusachim → render
  //    nothing for us.
  const bare = group.bodies.find((b) => b.nusach === null)
  const hasSpecificForOthers = group.bodies.some(
    (b) => b.nusach !== null && b.nusach !== nusach,
  )
  if (bare && p(bare.key)) {
    if (nusach === 'edot' || !hasSpecificForOthers) return p(bare.key)
    // Otherwise the bare key was intended as a fallback for nusachim NOT
    // listed in the group; skip.
    return ''
  }

  // 4. No bare variant at all — this group is for specific nusachim only and
  //    ours isn't one of them. Don't render.
  return ''
}

const allCompositions = compositions as Record<string, Composition>

/** Build a Generator from a precomputed composition. */
export function makeCompositionGenerator(
  id: string,
  titleKey: string,
  composition: Composition,
): Generator {
  const groups = groupRows(composition.rows)
  return {
    id,
    titleKey,
    generate(ctx: GeneratorContext): TfilaRow[] {
      const rows: TfilaRow[] = []
      let i = 0
      for (const group of groups) {
        const body = pickBody(group, ctx.settings.nusach, ctx.settings.isWoman)
        if (!body) continue
        // Replace %1$s with the appropriate divine-name spelling; strip any
        // remaining %N$s placeholders (they're conditional inserts the source
        // generator would have filled in, and we don't have a reliable handle
        // on the right text without the per-prayer logic).
        const divineName = ctx.settings.nusach === 'edot' ? 'יְהוָֹה' : 'יי'
        const cleaned = body.replace(/%1\$s/g, divineName).replace(/%\d+\$s/g, '')
        rows.push({
          id: `${group.base}-${i++}`,
          title: group.title,
          titleIsKey: !!group.title,
          body: cleaned,
        })
      }
      return rows
    },
  }
}

export function buildAllCompositionGenerators(
  titleKeyOverrides: Record<string, string> = {},
): Generator[] {
  const out: Generator[] = []
  for (const [id, comp] of Object.entries(allCompositions)) {
    const titleKey = titleKeyOverrides[id] ?? id
    out.push(makeCompositionGenerator(id, titleKey, comp))
  }
  return out
}
