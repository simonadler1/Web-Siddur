import { JewishCalendar } from 'kosher-zmanim'

/**
 * Mussaf occasion — when is Mussaf recited and which liturgy applies.
 *
 * Mussaf is recited on:
 *   - Shabbat
 *   - Rosh Chodesh
 *   - The three Pilgrimage festivals (Pesach, Shavuot, Sukkot)
 *   - Rosh Hashanah & Yom Kippur
 *   - Shemini Atzeret / Simchat Torah
 *   - Chol Hamoed Pesach / Sukkot
 *
 * Returns a tag identifying which Mussaf to render, or null if no Mussaf today.
 * The `roshChodeshShabbat` combination is reported separately so the prayer
 * can include both insertions; in the source this branches the Kedusha text.
 */
export type MussafKind =
  | 'shabbat'
  | 'roshChodesh'
  | 'roshChodeshShabbat'
  | 'pesach'
  | 'shavuot'
  | 'sukkot'
  | 'shminiAtzeret'
  | 'roshHashanah'
  | 'yomKippur'

export function mussafKind(jc: JewishCalendar): MussafKind | null {
  const isShabbat = jc.getDayOfWeek() === 7
  const isRoshChodesh = jc.isRoshChodesh()
  const yt = jc.getYomTovIndex()

  // Yom Kippur takes precedence even over Shabbat (it has its own Mussaf with Avodah).
  if (yt === JewishCalendar.YOM_KIPPUR) return 'yomKippur'
  if (yt === JewishCalendar.ROSH_HASHANA) return 'roshHashanah'

  if (
    yt === JewishCalendar.PESACH ||
    yt === JewishCalendar.CHOL_HAMOED_PESACH
  ) {
    return 'pesach'
  }

  if (yt === JewishCalendar.SHAVUOS) return 'shavuot'

  if (
    yt === JewishCalendar.SUCCOS ||
    yt === JewishCalendar.CHOL_HAMOED_SUCCOS ||
    yt === JewishCalendar.HOSHANA_RABBA
  ) {
    return 'sukkot'
  }

  if (
    yt === JewishCalendar.SHEMINI_ATZERES ||
    yt === JewishCalendar.SIMCHAS_TORAH
  ) {
    return 'shminiAtzeret'
  }

  if (isRoshChodesh && isShabbat) return 'roshChodeshShabbat'
  if (isRoshChodesh) return 'roshChodesh'
  if (isShabbat) return 'shabbat'

  return null
}
