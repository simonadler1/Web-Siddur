import {
  GeoLocation,
  ComplexZmanimCalendar,
  JewishCalendar,
  HebrewDateFormatter,
  Luxon,
} from 'kosher-zmanim'
import type { SiddurLocation } from './location'

type DateTimeLike = ReturnType<typeof Luxon.DateTime.now>

export interface ZmanimSnapshot {
  date: Date
  location: SiddurLocation
  hebrewDate: string
  hebrewDateEn: string
  parsha: string
  parshaEn: string
  dayOfWeek: number // 1 = Sunday, 7 = Saturday
  omerDay: number // 0 = not omer period
  yomTov: string
  yomTovEn: string
  times: Record<ZmanimKey, Date | null>
}

export const ZMANIM_KEYS = [
  'alos72',
  'misheyakir',
  'sunrise',
  'sofZmanShmaMGA',
  'sofZmanShmaGRA',
  'sofZmanTfilaGRA',
  'chatzos',
  'minchaGedola',
  'minchaKetana',
  'plagHamincha',
  'sunset',
  'tzais',
  'tzais72',
] as const

export type ZmanimKey = (typeof ZMANIM_KEYS)[number]

function build(loc: SiddurLocation, date: Date): ComplexZmanimCalendar {
  const gl = new GeoLocation(loc.name, loc.latitude, loc.longitude, loc.elevation, loc.timezone)
  const zc = new ComplexZmanimCalendar(gl)
  zc.setDate(Luxon.DateTime.fromJSDate(date, { zone: loc.timezone }))
  return zc
}

function toJSDate(dt: DateTimeLike | null | undefined): Date | null {
  if (!dt) return null
  return dt.toJSDate()
}

export function computeZmanim(loc: SiddurLocation, date: Date): ZmanimSnapshot {
  const zc = build(loc, date)
  const jc = new JewishCalendar(date)
  jc.setInIsrael(loc.countryCode === 'IL' || loc.timezone === 'Asia/Jerusalem')

  const fmtHe = new HebrewDateFormatter()
  fmtHe.setHebrewFormat(true)
  const fmtEn = new HebrewDateFormatter()
  fmtEn.setHebrewFormat(false)

  const times: Record<ZmanimKey, Date | null> = {
    alos72: toJSDate(zc.getAlos72()),
    misheyakir: toJSDate(zc.getMisheyakir10Point2Degrees()),
    sunrise: toJSDate(zc.getSunrise()),
    sofZmanShmaMGA: toJSDate(zc.getSofZmanShmaMGA()),
    sofZmanShmaGRA: toJSDate(zc.getSofZmanShmaGRA()),
    sofZmanTfilaGRA: toJSDate(zc.getSofZmanTfilaGRA()),
    chatzos: toJSDate(zc.getChatzos()),
    minchaGedola: toJSDate(zc.getMinchaGedola()),
    // The runtime supports no-arg forms but the .d.ts is wrong — cast away.
    minchaKetana: toJSDate((zc as unknown as { getMinchaKetana(): DateTimeLike | null }).getMinchaKetana()),
    plagHamincha: toJSDate((zc as unknown as { getPlagHamincha(): DateTimeLike | null }).getPlagHamincha()),
    sunset: toJSDate(zc.getSunset()),
    tzais: toJSDate(zc.getTzais()),
    tzais72: toJSDate(zc.getTzais72()),
  }

  return {
    date,
    location: loc,
    hebrewDate: fmtHe.format(jc),
    hebrewDateEn: fmtEn.format(jc),
    parsha: fmtHe.formatParsha(jc),
    parshaEn: fmtEn.formatParsha(jc),
    dayOfWeek: jc.getDayOfWeek(),
    omerDay: jc.getDayOfOmer() ?? 0,
    yomTov: fmtHe.formatYomTov(jc),
    yomTovEn: fmtEn.formatYomTov(jc),
    times,
  }
}

export function formatTime(d: Date | null, timezone: string, use24h: boolean = true): string {
  if (!d) return '—'
  const luxon = Luxon.DateTime.fromJSDate(d).setZone(timezone)
  return use24h ? luxon.toFormat('HH:mm') : luxon.toFormat('h:mm a')
}
