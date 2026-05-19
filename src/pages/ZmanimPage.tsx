import { useMemo, useState } from 'react'
import { computeZmanim, formatTime, ZMANIM_KEYS, type ZmanimKey } from '../lib/zmanim'
import { loadLocation } from '../lib/location'

const LABELS: Record<ZmanimKey, { en: string; he: string }> = {
  alos72: { en: 'Dawn (alot ha-shachar, 72 min)', he: 'עלות השחר' },
  misheyakir: { en: 'Misheyakir (10.2°)', he: 'משיכיר' },
  sunrise: { en: 'Sunrise (hanetz)', he: 'הנץ החמה' },
  sofZmanShmaMGA: { en: 'Latest Shema (Magen Avraham)', he: 'סוף זמן ק"ש (מ"א)' },
  sofZmanShmaGRA: { en: 'Latest Shema (Gr"a)', he: 'סוף זמן ק"ש (גר"א)' },
  sofZmanTfilaGRA: { en: 'Latest Shacharit (Gr"a)', he: 'סוף זמן תפילה (גר"א)' },
  chatzos: { en: 'Midday (chatzot)', he: 'חצות היום' },
  minchaGedola: { en: 'Earliest Mincha (gedola)', he: 'מנחה גדולה' },
  minchaKetana: { en: 'Preferred Mincha (ketana)', he: 'מנחה קטנה' },
  plagHamincha: { en: 'Plag haMincha', he: 'פלג המנחה' },
  sunset: { en: 'Sunset (shkia)', he: 'שקיעת החמה' },
  tzais: { en: 'Nightfall (tzeit)', he: 'צאת הכוכבים' },
  tzais72: { en: 'Nightfall (Rabbeinu Tam, 72 min)', he: 'צאת הכוכבים (ר"ת)' },
}

export function ZmanimPage() {
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const location = useMemo(() => loadLocation(), [])
  const date = useMemo(() => new Date(dateStr + 'T12:00:00'), [dateStr])
  const snap = useMemo(() => computeZmanim(location, date), [location, date])

  return (
    <div className="max-w-2xl mx-auto py-4" data-testid="zmanim-page">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Zmanim</h1>
        <div className="flex gap-3 items-center text-sm">
          <label>
            Date:{' '}
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="border rounded px-2 py-1 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
              style={{ colorScheme: 'light dark' }}
              data-testid="zmanim-date-input"
            />
          </label>
          <span className="text-gray-500" data-testid="zmanim-location">
            {location.name}
          </span>
        </div>
      </header>

      <section className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded">
        <div className="hebrew text-xl" data-testid="hebrew-date">
          {snap.hebrewDate}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="hebrew-date-en">
          {snap.hebrewDateEn}
        </div>
        {snap.parsha && (
          <div className="mt-2 hebrew" data-testid="parsha">
            פרשת {snap.parsha}
          </div>
        )}
        {snap.yomTov && (
          <div className="mt-2 hebrew text-amber-700" data-testid="yom-tov">
            {snap.yomTov}
          </div>
        )}
        {snap.omerDay > 0 && (
          <div className="mt-2 text-sm" data-testid="omer-day">
            Omer day: <strong>{snap.omerDay}</strong>
          </div>
        )}
      </section>

      <table className="w-full text-sm border-separate border-spacing-x-2" data-testid="zmanim-table">
        <tbody>
          {ZMANIM_KEYS.map((k) => (
            <tr key={k} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{LABELS[k].en}</td>
              <td className="py-2 hebrew whitespace-nowrap">{LABELS[k].he}</td>
              {/* `unicode-bidi: isolate` keeps the LTR time numerals from
                  merging visually with the trailing Hebrew RTL run. */}
              <td
                className="py-2 text-right font-mono whitespace-nowrap pl-3"
                style={{ unicodeBidi: 'isolate' }}
                data-testid={`zman-${k}`}
              >
                {formatTime(snap.times[k], location.timezone)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
