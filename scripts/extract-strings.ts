#!/usr/bin/env tsx
/**
 * Extract strings.xml → JSON.
 *
 * The Android app's `values/strings.xml` mixes two kinds of content:
 *   - Hebrew prayer bodies (CamelCase keys, value contains Hebrew chars)
 *   - English UI labels (everything else)
 *
 * `values-<lang>/strings.xml` files override UI labels for each locale.
 *
 * Output:
 *   src/data/prayers.json      — { key: html } — Hebrew prayer text (default locale only)
 *   src/data/ui/<locale>.json  — { key: label } — UI labels per locale
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const RES_DIR = join(REPO_ROOT, 'extracted', 'apktool_out', 'res')
const OUT_DIR = join(__dirname, '..', 'src', 'data')

// Android `values-<x>` dirs we DON'T want — config qualifiers, not languages.
const SKIP_QUALIFIERS = /^(land|port|night|watch|television|car|ldltr|ldrtl|round|notround|sw\d|w\d|h\d|v\d|small|normal|large|xlarge|nokeys|hdpi|mdpi|ldpi|xhdpi|xxhdpi|xxxhdpi|tvdpi|anydpi|short|long|finger|notouch|stylus|qwerty|nokeys|12key|navhidden|navexposed|dpad|trackball|wheel|en-rXC)$/

const HEBREW_RE = /[֐-׿]/

function decodeAndroidString(raw: unknown): string {
  if (raw == null) return ''
  let s = String(raw)
  // Android wraps strings with leading/trailing whitespace in double quotes.
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1)
  }
  // Unescape Android backslash sequences.
  s = s.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  return s
}

function parseStrings(xmlPath: string): Record<string, string> {
  const xml = readFileSync(xmlPath, 'utf8')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: false,
    parseTagValue: false,
    trimValues: false,
    // The XML stores HTML escaped (`&lt;`); fast-xml-parser will decode entities by default,
    // which is exactly what we want (we'll get back actual `<br>`, `<font>`, etc.).
    htmlEntities: true,
  })
  const doc = parser.parse(xml)
  const resources = doc.resources
  if (!resources) return {}
  const list = Array.isArray(resources.string) ? resources.string : resources.string ? [resources.string] : []
  const out: Record<string, string> = {}
  for (const entry of list) {
    const name = entry['@_name']
    if (!name) continue
    // Skip translatable=false metadata entries that hold no real text.
    const value = entry['#text'] !== undefined ? entry['#text'] : typeof entry === 'string' ? entry : ''
    out[name] = decodeAndroidString(value)
  }
  return out
}

function localeFromDir(dir: string): string {
  // values-iw → iw, values-pt-rBR → pt-BR, values-b+sr+Latn → sr-Latn
  const raw = dir.replace(/^values-/, '')
  if (raw.startsWith('b+')) {
    return raw.slice(2).replace(/\+/g, '-')
  }
  return raw.replace(/-r/, '-')
}

function isLocaleDir(name: string): boolean {
  if (!name.startsWith('values-')) return false
  const qualifier = name.slice('values-'.length)
  if (SKIP_QUALIFIERS.test(qualifier)) return false
  return true
}

function main() {
  mkdirSync(join(OUT_DIR, 'ui'), { recursive: true })

  // 1) Default locale → split into prayers (Hebrew) + UI labels (English)
  const defaultStrings = parseStrings(join(RES_DIR, 'values', 'strings.xml'))
  const prayers: Record<string, string> = {}
  const uiEn: Record<string, string> = {}
  for (const [key, value] of Object.entries(defaultStrings)) {
    if (HEBREW_RE.test(value)) {
      prayers[key] = value
    } else {
      uiEn[key] = value
    }
  }

  writeFileSync(join(OUT_DIR, 'prayers.json'), JSON.stringify(prayers, null, 0) + '\n')
  writeFileSync(join(OUT_DIR, 'ui', 'en.json'), JSON.stringify(uiEn, null, 2) + '\n')

  // 2) Other locales → UI labels only (override or add to English defaults)
  const localeDirs = readdirSync(RES_DIR).filter(isLocaleDir)
  const localeStats: Array<{ locale: string; strings: number }> = []
  for (const dir of localeDirs) {
    const xmlPath = join(RES_DIR, dir, 'strings.xml')
    let strings: Record<string, string>
    try {
      strings = parseStrings(xmlPath)
    } catch {
      continue
    }
    if (Object.keys(strings).length === 0) continue
    // For non-English locales we keep every label (whether or not its English default contained Hebrew —
    // some locales may translate prayer-related titles).
    const locale = localeFromDir(dir)
    writeFileSync(join(OUT_DIR, 'ui', `${locale}.json`), JSON.stringify(strings, null, 2) + '\n')
    localeStats.push({ locale, strings: Object.keys(strings).length })
  }

  // 3) Copy prayer composition JSONs (slihot, sukot) verbatim.
  for (const name of ['slihot', 'sukot']) {
    const src = join(REPO_ROOT, 'extracted', 'apktool_out', 'assets', `${name}.json`)
    const dst = join(OUT_DIR, `${name}.json`)
    writeFileSync(dst, readFileSync(src))
  }

  const summary = {
    prayers: Object.keys(prayers).length,
    uiEnLabels: Object.keys(uiEn).length,
    locales: localeStats.sort((a, b) => a.locale.localeCompare(b.locale)),
  }
  writeFileSync(join(OUT_DIR, 'extract-summary.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(`Extracted ${summary.prayers} prayer strings`)
  console.log(`Extracted ${summary.uiEnLabels} English UI labels`)
  console.log(`Extracted ${localeStats.length} additional locales`)
}

main()
