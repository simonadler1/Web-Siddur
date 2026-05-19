import enLabels from '../data/ui/en.json'
import iwLabels from '../data/ui/iw.json'

const localeMap: Record<string, Record<string, string>> = {
  en: enLabels,
  he: iwLabels,
  iw: iwLabels,
}

let activeLocale = 'en'

export function setUiLocale(locale: string) {
  activeLocale = locale
}

export function getUiLocale(): string {
  return activeLocale
}

export function t(key: string): string {
  const primary = localeMap[activeLocale]?.[key]
  if (primary !== undefined) return primary
  const fallback = enLabels[key as keyof typeof enLabels]
  if (fallback !== undefined) return fallback
  return humanize(key)
}

/**
 * Last-resort fallback for unknown label keys: strip a trailing "Title"/"_title"
 * suffix and humanize camelCase / snake_case so the UI shows "Modeh Ani"
 * instead of the raw "modehTitle" if a translation is missing.
 */
function humanize(key: string): string {
  let s = key.replace(/_?[Tt]itle$/, '')
  s = s.replace(/_/g, ' ')
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2')
  return s
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** sprintf-style for %1$s, %2$s, ... placeholders (matches Android's String.format). */
export function format(template: string, ...args: Array<string | number>): string {
  return template.replace(/%(\d+)\$s/g, (_, n) => String(args[Number(n) - 1] ?? ''))
}
