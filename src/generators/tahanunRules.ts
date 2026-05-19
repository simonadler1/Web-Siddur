import { JewishCalendar } from 'kosher-zmanim'

/**
 * Halachic gate: when is Tachanun *not* recited?
 *
 * Standard universal exemptions (all nusachim):
 *   - Shabbat (day 7)
 *   - Yom Tov, including Chol Hamoed Pesach/Sukkot
 *   - Rosh Chodesh
 *   - Hanukkah (all 8 days)
 *   - Purim (14 + 15 Adar)
 *   - Tu B'Shvat (15 Shvat)
 *   - Tu B'Av (15 Av)
 *   - Lag BaOmer (18 Iyar)
 *   - 15 Iyar (Pesach Sheni)
 *   - All of Nisan
 *   - From 1 Sivan through 12 Sivan (until end of Issru Chag of Shavuot)
 *   - From 10 Tishrei (Yom Kippur) through Rosh Chodesh Cheshvan
 *   - From 9 Av through 15 Av
 *   - Yom HaAtzmaut + Yom Yerushalayim (in Israel)
 *
 * Note: most communities also skip Tachanun at Mincha on Erev Shabbat / Erev
 * Yom Tov, but Shacharit Tachanun on those days is recited in most communities.
 * For Mincha use `isTachanunSkippedAtMincha`.
 */
export function isTachanunSkipped(jc: JewishCalendar): boolean {
  if (jc.getDayOfWeek() === 7) return true // Shabbat
  if (jc.isYomTov()) return true
  if (jc.isCholHamoedPesach() || jc.isCholHamoedSuccos()) return true
  if (jc.isRoshChodesh()) return true
  if (jc.isChanukah()) return true
  if (jc.isPurim()) return true

  const yt = jc.getYomTovIndex()
  if (yt === JewishCalendar.TU_BESHVAT) return true
  if (yt === JewishCalendar.TU_BEAV) return true
  if (yt === JewishCalendar.LAG_BAOMER) return true
  if (yt === JewishCalendar.PESACH_SHENI) return true
  if (yt === JewishCalendar.YOM_HAATZMAUT) return true
  if (yt === JewishCalendar.YOM_YERUSHALAYIM) return true

  const month = jc.getJewishMonth() // 1 = Nisan, 2 = Iyar, ...
  const day = jc.getJewishDayOfMonth()

  if (month === JewishCalendar.NISSAN) return true
  if (month === JewishCalendar.SIVAN && day <= 12) return true
  // From 10 Tishrei (Yom Kippur) through end of Tishrei — covers post-YK through Sukkot+Simchat Torah+Issru Chag.
  if (month === JewishCalendar.TISHREI && day >= 10) return true
  // 9 Av through 15 Av
  if (month === JewishCalendar.AV && day >= 9 && day <= 15) return true

  return false
}

/**
 * Mincha variant: in addition to all universal exemptions, Tachanun is also
 * skipped at Mincha on Erev Shabbat (Friday) and Erev Yom Tov. Shacharit on
 * those days still recites Tachanun in most communities.
 */
export function isTachanunSkippedAtMincha(jc: JewishCalendar): boolean {
  if (isTachanunSkipped(jc)) return true
  if (jc.getDayOfWeek() === 6) return true // Erev Shabbat
  if (jc.isErevYomTov()) return true
  return false
}

/**
 * Avinu Malkenu is recited on public fast days and during the Ten Days of Repentance.
 * It is NOT recited on Shabbat or Erev Shabbat or Erev Yom Kippur in some customs;
 * we omit those nuances and follow the common rule.
 */
export function shouldSayAvinuMalkenu(jc: JewishCalendar): boolean {
  // Skip on Shabbat regardless
  if (jc.getDayOfWeek() === 7) return false
  if (jc.isTaanis() && !jc.isYomTov()) return true
  if (jc.isAseresYemeiTeshuva()) return true
  return false
}

/**
 * Monday/Thursday extended Tachanun (long supplications recited only on those days
 * outside of weeks containing a Yom Tov or other exemption).
 */
export function isLongTachanun(jc: JewishCalendar): boolean {
  if (isTachanunSkipped(jc)) return false
  const dow = jc.getDayOfWeek()
  return dow === 2 || dow === 5 // Monday or Thursday
}
