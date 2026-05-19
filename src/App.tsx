import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ZmanimPage } from './pages/ZmanimPage'
import { PrayerPage } from './pages/PrayerPage'
import { LocationsPage } from './pages/LocationsPage'
import { CompassPage } from './pages/CompassPage'
import { SettingsPage } from './pages/SettingsPage'
import { HomePage } from './pages/HomePage'
import { PrayerIndexPage } from './pages/PrayerIndexPage'
import { SettingsContext, useSettingsState } from './lib/settings'
import { setUiLocale } from './lib/ui'
import { AppHeader } from './components/AppHeader'

const RTL_LOCALES = new Set(['he', 'iw', 'ar', 'fa', 'ur'])

export default function App() {
  const ctx = useSettingsState()
  const locale = ctx.settings.uiLocale
  // Set the module-level locale BEFORE children render so plain `t()` calls
  // return the right strings on the first render after a change.
  setUiLocale(locale)
  useEffect(() => {
    document.documentElement.lang = locale === 'iw' ? 'he' : locale
    document.documentElement.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'
  }, [locale])

  return (
    <SettingsContext.Provider value={ctx}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <AppHeader />
          <main className="flex-1 p-4 max-w-3xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/zmanim" element={<ZmanimPage />} />
              <Route path="/prayers" element={<PrayerIndexPage />} />
              <Route path="/prayer/:id" element={<PrayerPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/compass" element={<CompassPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SettingsContext.Provider>
  )
}
