import { JewishCalendar } from 'kosher-zmanim'

/**
 * Birkat Hamazon (Grace After Meals) has several conditional insertions.
 * This module captures the gating conditions.
 */

/** "Al Hanissim" insertion in the second blessing — Chanukah days and Purim. */
export function shouldInsertAlHanissim(jc: JewishCalendar): 'chanukah' | 'purim' | null {
  if (jc.isChanukah()) return 'chanukah'
  if (jc.isPurim()) return 'purim'
  return null
}

/**
 * "Ya'aleh V'Yavo" / Retzeh insertion in the third blessing — Rosh Chodesh,
 * all Pesach days, all Sukkot days.
 */
export function shouldInsertYaalehVyavo(
  jc: JewishCalendar,
): 'roshChodesh' | 'pesach' | 'succos' | null {
  if (jc.isRoshChodesh()) return 'roshChodesh'
  const yt = jc.getYomTovIndex()
  if (yt === JewishCalendar.PESACH || yt === JewishCalendar.CHOL_HAMOED_PESACH) {
    return 'pesach'
  }
  if (
    yt === JewishCalendar.SUCCOS ||
    yt === JewishCalendar.CHOL_HAMOED_SUCCOS ||
    yt === JewishCalendar.HOSHANA_RABBA ||
    yt === JewishCalendar.SHEMINI_ATZERES ||
    yt === JewishCalendar.SIMCHAS_TORAH
  ) {
    return 'succos'
  }
  return null
}

/** Shabbat = include the "Retzeh" insertion in the third blessing. */
export function isShabbat(jc: JewishCalendar): boolean {
  return jc.getDayOfWeek() === 7
}

/** "No-tachanun" days affect the opening psalms (Shir Hama'alot vs. Al Naharot). */
export function isNoTachanunMeal(jc: JewishCalendar): boolean {
  // Reuse a subset of the Tahanun rules — the practical effect on Mazon is
  // the same set of "joyful days" where Shir Hama'alot is recited instead of
  // Al Naharot Bavel.
  if (jc.getDayOfWeek() === 7) return true
  if (jc.isYomTov()) return true
  if (jc.isCholHamoedPesach() || jc.isCholHamoedSuccos()) return true
  if (jc.isRoshChodesh()) return true
  if (jc.isChanukah()) return true
  if (jc.isPurim()) return true
  return false
}
