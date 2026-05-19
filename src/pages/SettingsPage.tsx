import { type Nusach, useSettings } from '../lib/settings'
import { t } from '../lib/ui'

const NUSACH_OPTIONS: Array<{ value: Nusach; label: string }> = [
  { value: 'ashkenaz', label: 'Ashkenaz' },
  { value: 'sfarad', label: 'Sefard / Nusach Sefarad' },
  { value: 'edot', label: 'Edot HaMizrach' },
  { value: 'chabad', label: 'Chabad' },
]

const UI_LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'עברית' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
]

export function SettingsPage() {
  const { settings, update } = useSettings()
  const isRtl = settings.uiLocale === 'he' || settings.uiLocale === 'iw'

  return (
    <div
      className="max-w-md mx-auto py-4"
      data-testid="settings-page"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <h1 className="text-2xl font-semibold mb-6">{t('settings')}</h1>

      <Row label={t('nusach') || 'Nusach'}>
        <select
          value={settings.nusach}
          onChange={(e) => update({ nusach: e.target.value as Nusach })}
          className="border rounded px-3 py-2 w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
          style={{ colorScheme: 'light dark' }}
          data-testid="nusach-select"
        >
          {NUSACH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Row>

      <Row label="UI language">
        <select
          value={settings.uiLocale}
          onChange={(e) => update({ uiLocale: e.target.value })}
          className="border rounded px-3 py-2 w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
          style={{ colorScheme: 'light dark' }}
          data-testid="locale-select"
        >
          {UI_LOCALES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Row>

      <Toggle
        label="In Israel"
        hint="Affects holiday-day-2 prayers and Hebrew calendar"
        checked={settings.inIsrael}
        onChange={(v) => update({ inIsrael: v })}
        testId="in-israel"
      />
      <Toggle
        label="With minyan"
        hint="Include sections recited only with a public quorum"
        checked={settings.minyan === 'tzibur'}
        onChange={(v) => update({ minyan: v ? 'tzibur' : 'yahid' })}
        testId="minyan"
      />
      <Toggle
        label="Winter (Geshem)"
        hint="Recite winter rainfall blessing in Amida"
        checked={settings.isWinter}
        onChange={(v) => update({ isWinter: v })}
        testId="winter"
      />
      <Toggle
        label="Women's prayers"
        hint="Female-specific text variants"
        checked={settings.isWoman}
        onChange={(v) => update({ isWoman: v })}
        testId="woman"
      />
      <Toggle
        label="24-hour time"
        checked={settings.use24h}
        onChange={(v) => update({ use24h: v })}
        testId="use24h"
      />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <div className="text-sm font-medium mb-1">{label}</div>
      {children}
    </label>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  testId,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  testId: string
}) {
  return (
    <label className="flex items-start gap-3 mb-1 py-2 cursor-pointer min-h-11">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-6 h-6 accent-blue-600 cursor-pointer"
        style={{ colorScheme: 'light dark' }}
        data-testid={`setting-${testId}`}
      />
      <div>
        <div className="font-medium text-sm">{label}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
    </label>
  )
}
