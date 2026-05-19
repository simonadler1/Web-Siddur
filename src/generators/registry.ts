import type { Generator, GeneratorContext } from './types'
import { JewishCalendar } from 'kosher-zmanim'
import { omerGenerator } from './omer'
import { shacharitGenerator } from './shacharit'
import { minchaGenerator } from './mincha'
import { arvitGenerator } from './arvit'
import {
  asherYatzarGenerator,
  haderechGenerator,
  halaGenerator,
  ushpizinGenerator,
  slihotAshkenazGenerator,
  threefoldGenerator,
} from './extras'
import { tahanunGenerator } from './tahanun'
import { shacharitSofGenerator } from './shacharitSof'
import { mazonGenerator } from './mazon'
import { mussafGenerator } from './mussaf'
import { buildAllCompositionGenerators } from './composition'
import type { SiddurSettings } from '../lib/settings'
import type { SiddurLocation } from '../lib/location'

const TITLE_KEYS: Record<string, string> = {
  shacharit: 'shacharit',
  mincha: 'mincha',
  arvit: 'arvit',
  omer: 'omer_title',
  mussaf: 'mussaf',
  mazon: 'mazon',
  halel: 'halel',
  shacharitOpening: 'shacharit',
  shacharitShma: 'shemaTitle',
  shacharitShachar: 'shacharit',
  shacharitTahanun: 'tahanunTitle',
  shacharitSof: 'shacharit',
  shacharitZimra: 'pesukeiDeZimra',
  hatsot: 'hatsotTitle',
  havdala: 'havdalaTitle',
  hala: 'halaTitle',
  hanuka: 'menora',
  lag: 'lagTitle',
  levana: 'levana_kidush',
  blessings: 'blessings',
  asherYatzar: 'asherYatzarTitle',
  alMita: 'alMita',
  haderech: 'haderechTitle',
  ilanot: 'ilanotTitle',
  maaser: 'maaserTitle',
  mila: 'milaTitle',
  nedarim: 'nedarimTitle',
  shevaBrachot: 'shevaBrachotTitle',
  slihot: 'slihot',
  slihotAshkenaz: 'slihot',
  threefold: 'meen_shalosh',
  torahReading: 'torahReadingTitle',
  ushpizin: 'ushpizinTitle',
  kinot: 'kinotTitle',
}

const registry = new Map<string, Generator>()

// 1) Auto-built composition generators for every Generator.java found.
for (const g of buildAllCompositionGenerators(TITLE_KEYS)) {
  registry.set(g.id, g)
}

// 2) Hand-tuned generators override the auto-built ones.
for (const g of [
  omerGenerator,
  shacharitGenerator,
  minchaGenerator,
  arvitGenerator,
  asherYatzarGenerator,
  haderechGenerator,
  halaGenerator,
  ushpizinGenerator,
  slihotAshkenazGenerator,
  threefoldGenerator,
  tahanunGenerator,
  shacharitSofGenerator,
  mazonGenerator,
  mussafGenerator,
]) {
  registry.set(g.id, g)
}

export function getGenerator(id: string): Generator | undefined {
  return registry.get(id)
}

export function listGenerators(): Generator[] {
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function makeContext(
  date: Date,
  settings: SiddurSettings,
  location: SiddurLocation,
): GeneratorContext {
  const jc = new JewishCalendar(date)
  jc.setInIsrael(settings.inIsrael || location.countryCode === 'IL')
  return { date, settings, jc }
}
