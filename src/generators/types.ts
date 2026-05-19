import { JewishCalendar } from 'kosher-zmanim'
import type { SiddurSettings } from '../lib/settings'

export type ExpandState = 'expanded' | 'collapsed' | 'none'

export interface TfilaRow {
  /** Stable ID used by React keys and the menu */
  id: string
  /** Section heading (UI label key or literal text). Empty = no heading. */
  title?: string
  /** Whether `title` is an `R.string` UI label key (true) or literal text (false). */
  titleIsKey?: boolean
  /** Prayer body (HTML with niqqud). */
  body: string
  /** Whether `body` is a key into prayers.json (true) or literal HTML (false). */
  bodyIsKey?: boolean
  /** Whether this row should appear in the side-menu jump list. */
  inMenu?: boolean
  /** Initial expand/collapse state. */
  expand?: ExpandState
}

export interface GeneratorContext {
  date: Date
  settings: SiddurSettings
  /** Pre-built JewishCalendar (so generators don't reconstruct it each time). */
  jc: JewishCalendar
}

export interface Generator {
  id: string
  /** UI label key for the prayer's overall title. */
  titleKey: string
  generate(ctx: GeneratorContext): TfilaRow[]
}
