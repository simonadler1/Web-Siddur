import {
  ComplexZmanimCalendar,
  GeoLocation,
  JewishCalendar,
  Luxon,
} from 'kosher-zmanim'
import type { SiddurLocation } from './location'

const BUFFER_MINUTES = 15

export interface RelevantPrayersResult {
  /** Prayer IDs to surface for the current Jewish day(s), in display order. */
  ids: string[]
  /**
   * True when `now` falls within ±15 minutes of sunset — the union of both
   * Jewish days' prayer sets is returned.
   */
  isTransition: boolean
  /** Sunset at `location` on the civil date of `now`, or null if unavailable. */
  sunset: Date | null
}

const DAILY = ['shacharit', 'mincha', 'arvit', 'mazon', 'alMita'] as const
const ALWAYS_AVAILABLE = [
  'blessings',
  'asherYatzar',
  'haderech',
  'threefold',
  'hala',
  'maaser',
] as const

/** Display order — daily core → day-conditional → blessings/anytime. */
const ORDER = [
  'shacharit',
  'mincha',
  'arvit',
  'mussaf',
  'halel',
  'torahReading',
  'omer',
  'hanuka',
  'ushpizin',
  'havdala',
  'slihot',
  'kinot',
  'lag',
  'levana',
  'ilanot',
  'nedarim',
  'mazon',
  'alMita',
  'asherYatzar',
  'haderech',
  'blessings',
  'threefold',
  'hala',
  'maaser',
]

function computeSunset(location: SiddurLocation, date: Date): Date | null {
  const gl = new GeoLocation(
    location.name,
    location.latitude,
    location.longitude,
    location.elevation,
    location.timezone,
  )
  const zc = new ComplexZmanimCalendar(gl)
  zc.setDate(Luxon.DateTime.fromJSDate(date, { zone: location.timezone }))
  const dt = zc.getSunset()
  return dt ? dt.toJSDate() : null
}

function prayersForJewishDate(jc: JewishCalendar): Set<string> {
  const ids = new Set<string>()
  for (const id of DAILY) ids.add(id)
  for (const id of ALWAYS_AVAILABLE) ids.add(id)

  const dow = jc.getDayOfWeek()
  const isShabbat = dow === 7
  const isRoshChodesh = jc.isRoshChodesh()
  const yt = jc.getYomTovIndex()
  const isYomTov = jc.isYomTov()
  const isCholHamoed = jc.isCholHamoedPesach() || jc.isCholHamoedSuccos()
  const isChanukah = jc.isChanukah()
  const month = jc.getJewishMonth()
  const day = jc.getJewishDayOfMonth()
  const omerDay = jc.getDayOfOmer()

  if (isShabbat || isRoshChodesh || isYomTov || isCholHamoed) ids.add('mussaf')

  const halelDay =
    isRoshChodesh ||
    isChanukah ||
    yt === JewishCalendar.PESACH ||
    yt === JewishCalendar.CHOL_HAMOED_PESACH ||
    yt === JewishCalendar.SHAVUOS ||
    yt === JewishCalendar.SUCCOS ||
    yt === JewishCalendar.CHOL_HAMOED_SUCCOS ||
    yt === JewishCalendar.HOSHANA_RABBA ||
    yt === JewishCalendar.SHEMINI_ATZERES ||
    yt === JewishCalendar.SIMCHAS_TORAH ||
    yt === JewishCalendar.YOM_HAATZMAUT ||
    yt === JewishCalendar.YOM_YERUSHALAYIM
  if (halelDay) ids.add('halel')

  if (omerDay > 0) ids.add('omer')
  if (isChanukah) ids.add('hanuka')

  // Havdala — recited on motzaei Shabbat / motzaei YT. Surface it on the day
  // *of* Shabbat/YT so it's available during the evening transition window.
  if (isShabbat || isYomTov) ids.add('havdala')

  if (yt === JewishCalendar.TISHA_BEAV) ids.add('kinot')

  // Slihot — Elul through Yom Kippur (Sephardi practice; Ashkenazi starts later
  // but this surfaces it as an option, not a mandate).
  if (
    month === JewishCalendar.ELUL ||
    (month === JewishCalendar.TISHREI && day <= 10)
  ) {
    ids.add('slihot')
  }

  if (
    yt === JewishCalendar.SUCCOS ||
    yt === JewishCalendar.CHOL_HAMOED_SUCCOS ||
    yt === JewishCalendar.HOSHANA_RABBA
  ) {
    ids.add('ushpizin')
  }

  if (month === JewishCalendar.NISSAN) ids.add('ilanot')
  if (omerDay === 33) ids.add('lag')

  // Hatarat nedarim — erev Rosh Hashanah (29 Elul).
  if (month === JewishCalendar.ELUL && day === 29) ids.add('nedarim')

  // Torah reading days.
  if (
    dow === 2 ||
    dow === 5 ||
    isShabbat ||
    isRoshChodesh ||
    isYomTov ||
    isCholHamoed ||
    jc.isTaanis()
  ) {
    ids.add('torahReading')
  }

  // Kiddush Levana — practical window inside each lunar month (approx).
  if (day >= 4 && day <= 15) ids.add('levana')

  return ids
}

export function relevantPrayers(
  location: SiddurLocation,
  inIsrael: boolean,
  now: Date = new Date(),
): RelevantPrayersResult {
  const sunset = computeSunset(location, now)

  const dates: Date[] = [now]
  let isTransition = false

  if (sunset) {
    const bufferMs = BUFFER_MINUTES * 60 * 1000
    const diff = now.getTime() - sunset.getTime()
    if (Math.abs(diff) <= bufferMs) {
      isTransition = true
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      dates.push(tomorrow)
    } else if (diff > 0) {
      // After sunset (outside the buffer) — next Jewish day has started.
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      dates[0] = tomorrow
    }
  }

  const merged = new Set<string>()
  for (const d of dates) {
    const jc = new JewishCalendar(d)
    jc.setInIsrael(inIsrael)
    for (const id of prayersForJewishDate(jc)) merged.add(id)
  }

  const orderIndex = new Map(ORDER.map((id, i) => [id, i]))
  const ids = [...merged].sort(
    (a, b) => (orderIndex.get(a) ?? 999) - (orderIndex.get(b) ?? 999),
  )

  return { ids, isTransition, sunset }
}
