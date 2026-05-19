import { createContext, useContext, useEffect, useState } from 'react'

export type Nusach = 'ashkenaz' | 'sfarad' | 'edot' | 'chabad'

export interface SiddurSettings {
  nusach: Nusach
  /** Israel (true) or diaspora (false) for holiday-date logic */
  inIsrael: boolean
  /** 'yahid' (private) | 'tzibur' (with minyan) */
  minyan: 'yahid' | 'tzibur'
  /** Tal v'Geshem state — winter (true) recites geshem, summer recites tal */
  isWinter: boolean
  /** Female-specific prayer adjustments */
  isWoman: boolean
  /** Use 24h time format */
  use24h: boolean
  /** UI locale code (en, he, de, …) */
  uiLocale: string
}

export const DEFAULT_SETTINGS: SiddurSettings = {
  nusach: 'ashkenaz',
  inIsrael: false,
  minyan: 'tzibur',
  isWinter: false,
  isWoman: false,
  use24h: true,
  uiLocale: 'en',
}

const STORAGE_KEY = 'siddur:settings'

export function loadSettings(): SiddurSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<SiddurSettings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: SiddurSettings): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export const SettingsContext = createContext<{
  settings: SiddurSettings
  update: (patch: Partial<SiddurSettings>) => void
}>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}

export function useSettingsState() {
  const [settings, setSettings] = useState<SiddurSettings>(() => loadSettings())
  useEffect(() => saveSettings(settings), [settings])
  return {
    settings,
    update: (patch: Partial<SiddurSettings>) => setSettings((s) => ({ ...s, ...patch })),
  }
}
