import { JewishCalendar } from 'kosher-zmanim'

/**
 * Which "Shir Shel Yom" (Psalm of the Day) is recited.
 * Sunday → 24, Monday → 48, Tuesday → 82, Wednesday → 94, Thursday → 81,
 * Friday → 93, Saturday → 92 (which is recited in Mussaf for Shabbat —
 * the weekday Shacharit Sof generator only handles days 1–6).
 *
 * The bundled prayer text uses keys `shirShel1` .. `shirShel6` (in the source,
 * the Saturday Shir is in the Mussaf generator).
 */
export function shirShelYomKey(jc: JewishCalendar): string | null {
  const dow = jc.getDayOfWeek()
  if (dow === 7) return null
  return `shirShel${dow}`
}

/**
 * "LeDavid Hashem Ori" (Psalm 27) is recited from the second day of Rosh
 * Chodesh Elul through Hoshana Rabbah (21 Tishrei) twice a day in Ashkenaz
 * and Sefardi customs. We approximate as "Elul to end-of-Tishrei except
 * Yom Kippur" which is the standard rule.
 */
export function shouldSayLedavid(jc: JewishCalendar): boolean {
  const month = jc.getJewishMonth()
  const day = jc.getJewishDayOfMonth()
  if (month === JewishCalendar.ELUL) return true
  if (month === JewishCalendar.TISHREI && day <= 21) return true
  return false
}

/**
 * Which "Special Mizmor" (additional psalm) is added in Ashkenaz Sof. The
 * source picks distinct passages for: Hanukkah, 17 Tammuz, Tzom Gedalyah,
 * 10 Tevet, Purim/Esther fast, and post-Yom Kippur.
 *
 * Returns a key (e.g. "mizmorHanukat") or null when none applies.
 */
export function specialMizmorKey(jc: JewishCalendar): string | null {
  if (jc.isChanukah()) return 'mizmorHanukat'
  const yt = jc.getYomTovIndex()
  if (yt === JewishCalendar.SEVENTEEN_OF_TAMMUZ) return 'yazTamuz'
  if (yt === JewishCalendar.FAST_OF_GEDALYAH || yt === JewishCalendar.TENTH_OF_TEVES) {
    return 'gdaliaAndAsaraTevet'
  }
  if (yt === JewishCalendar.FAST_OF_ESTHER || jc.isPurim()) return 'purinAndEster'
  // "After Yom Kippur" — 11 Tishrei
  if (jc.getJewishMonth() === JewishCalendar.TISHREI && jc.getJewishDayOfMonth() === 11) {
    return 'afterYomKipur'
  }
  return null
}

/** Day of the Omer count (1..49). Returns 0 outside the 49-day period. */
export function omerDayHere(jc: JewishCalendar): number {
  const d = jc.getDayOfOmer()
  return d == null || d < 0 ? 0 : d
}
