import { JewishCalendar } from 'kosher-zmanim'
import type { Nusach } from '../lib/settings'

/**
 * Seasonal/holiday gating for the Amida. Insertions covered:
 *   - Aseret Yemei Teshuva (1–10 Tishrei): Zochrenu / Mi Khamokha / HaMelech
 *     HaKadosh / HaMelech HaMishpat / B'Sefer Chaim.
 *   - Tal/Geshem in Birkat HaGevurot (b2) and Birkat HaShanim (b9):
 *     winter says Mashiv haRuach + Bareh aleinu, summer says Morid HaTal +
 *     Barchenu. Boundary handling (transition periods, Israel vs diaspora
 *     Dec-4/5 switch) is intentionally simplified to `settings.isWinter`.
 */

/** True during the Ten Days of Repentance (1 Tishrei through 10 Tishrei). */
export function isAseretYemeiTeshuva(jc: JewishCalendar): boolean {
  return jc.isAseresYemeiTeshuva()
}

/** Which Tal/Geshem form to recite in b2 and b9. */
export function geshemSeason(isWinter: boolean): 'winter' | 'summer' {
  return isWinter ? 'winter' : 'summer'
}

/** Nusach-specific key for the `Zochrenu` (1st blessing) Aseret insertion. */
export function avotAseretKey(nusach: Nusach): string {
  return nusach === 'edot' ? 'AvotAseret' : 'AvotAseretSefarad'
}

/** Nusach-specific key for the `Mi Khamokha` (2nd blessing) Aseret insertion. */
export function b2AseretKey(nusach: Nusach): string {
  if (nusach === 'edot') return 'b2Aseret'
  if (nusach === 'ashkenaz') return 'b2AseretAshkenaz'
  return 'b2AseretSefarad'
}

/** Nusach-specific key for the `B'Sefer Chaim` (19th blessing) Aseret insertion. */
export function b19AseretKey(nusach: Nusach): string {
  if (nusach === 'edot') return 'b19Aseret'
  if (nusach === 'chabad') return 'b19AseretChabad'
  if (nusach === 'ashkenaz') return 'b19AseretAshkenaz'
  return 'b19AseretSefarad'
}
