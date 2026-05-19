import type { Nusach } from '../lib/settings'
import prayers from '../data/prayers.json'

const prayerMap = prayers as Record<string, string>

/**
 * Look up a prayer string by key. Returns the empty string if missing,
 * since unmatched keys often indicate an optional nusach-specific row.
 */
export function p(key: string): string {
  return prayerMap[key] ?? ''
}

/**
 * Pick a nusach-specific variant of a prayer string.
 * Convention from the Android source: base key + suffix per nusach.
 *
 *   nusachVariant('Avot', 'sfarad')   → prayers.AvotSefarad
 *   nusachVariant('Avot', 'chabad')   → prayers.AvotChabad
 *   nusachVariant('Avot', 'edot')     → prayers.Avot (no edot suffix in source)
 *   nusachVariant('Avot', 'ashkenaz') → prayers.AvotAshkenaz  || prayers.Avot
 *
 * Falls back to the base key if a variant doesn't exist.
 */
export function nusachVariant(baseKey: string, nusach: Nusach): string {
  const candidates: string[] = []
  switch (nusach) {
    case 'sfarad':
      candidates.push(baseKey + 'Sefarad', baseKey + 'Sfarad')
      break
    case 'chabad':
      candidates.push(baseKey + 'Chabad')
      break
    case 'ashkenaz':
      candidates.push(baseKey + 'Ashkenaz')
      break
    case 'edot':
      // The Android source uses the base (unsuffixed) form for Edot HaMizrach.
      break
  }
  for (const k of candidates) {
    if (prayerMap[k]) return prayerMap[k]
  }
  return prayerMap[baseKey] ?? ''
}

/**
 * Format the day-of-omer expression: "היום ארבעים יום שהם חמשה שבועות וחמשה ימים לעומר"
 * For now we use simple Hebrew number rendering; for the full kabbalistic table see `omer.ts`.
 */
const HEBREW_NUMBERS_FEM = [
  '', 'אֶחָד', 'שְׁנֵי', 'שְׁלשָׁה', 'אַרְבָּעָה', 'חֲמִשָּׁה', 'שִׁשָּׁה', 'שִׁבְעָה', 'שְׁמוֹנָה', 'תִּשְׁעָה',
] as const

const HEBREW_TENS = ['', 'עָשָׂר', 'עֶשְׂרִים', 'שְׁלשִׁים', 'אַרְבָּעִים'] as const

export function hebrewOrdinalDay(day: number): string {
  // Days 1–10 use simple words, 11–19 use "<ones> + asar", 20–49 use "<tens> + ones".
  if (day <= 0) return ''
  if (day <= 10) return HEBREW_NUMBERS_FEM[day]
  if (day < 20) return HEBREW_NUMBERS_FEM[day - 10] + ' עָשָׂר'
  const tens = Math.floor(day / 10)
  const ones = day % 10
  if (ones === 0) return HEBREW_TENS[tens]
  return HEBREW_NUMBERS_FEM[ones] + ' וְ' + HEBREW_TENS[tens]
}
