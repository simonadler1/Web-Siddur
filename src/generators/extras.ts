import type { Generator, GeneratorContext, TfilaRow } from './types'
import { nusachVariant, p } from './util'
import sukotData from '../data/sukot.json'
import slihotData from '../data/slihot.json'

type SukotCategory = Record<string, { id: string; text: string; title?: string }>
type SukotNusach = Record<string, SukotCategory | unknown>
const sukot = sukotData as Record<string, SukotNusach>

interface SlihotItem {
  id: string
  title?: string
  text: string
  addToMenu?: boolean
}
const slihot = slihotData as Record<string, Record<string, SlihotItem[]>>

/**
 * Hand-tuned ports for generators whose Java source uses patterns the
 * composition extractor doesn't recognise (variable assignment then `.k(var)`,
 * builder-style `TfilaRow.e().i(...)`, etc.).
 */

export const asherYatzarGenerator: Generator = {
  id: 'asherYatzar',
  titleKey: 'asher_yatzar',
  generate(ctx: GeneratorContext): TfilaRow[] {
    return [
      {
        id: 'asherYatzar',
        title: 'asher_yatzar',
        titleIsKey: true,
        body: nusachVariant('asherYatzar', ctx.settings.nusach) || p('asherYatzarSfarad') || p('asherYatzar'),
      },
    ]
  },
}

export const haderechGenerator: Generator = {
  id: 'haderech',
  titleKey: 'haderechTitle',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const baseTpl =
      ctx.settings.nusach === 'chabad' ? p('tfilatHaderechChabad') : p('tfilatHaderech')
    const formatted = baseTpl
      .replace(/%1\$s/g, p('threeTimes'))
      .replace(/%2\$s/g, p('tfila_haderech_return'))
    return [
      {
        id: 'haderech',
        title: 'haderech',
        titleIsKey: true,
        body: formatted,
      },
    ]
  },
}

export const halaGenerator: Generator = {
  id: 'hala',
  titleKey: 'halaTitle',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const intro = (p('halaIntro') || '').replace('%1$s', p('halaIntroText'))
    const bless = (p('halaBlessing') || '').replace(
      '%1$s',
      ctx.settings.nusach === 'edot' ? p('halaEdot') : p('halaSfarad'),
    )
    return [
      { id: 'hala-intro', body: intro },
      { id: 'hala-bless', title: 'halaTitle', titleIsKey: true, body: bless },
    ]
  },
}

export const ushpizinGenerator: Generator = {
  id: 'ushpizin',
  titleKey: 'ushpizinTitle',
  generate(ctx: GeneratorContext): TfilaRow[] {
    // sukot.json holds the Ushpizin invocations and surrounding tefillot under
    //   sukot.json[<nusach>].<category>.<dateKey | item>
    // where category is e.g. "leshem", "beforeUshpiz", "ushpiz".
    const nusachKey = ctx.settings.nusach === 'sfarad' || ctx.settings.nusach === 'chabad' ? 'edot' : ctx.settings.nusach
    const block = sukot[nusachKey] || sukot['edot']
    const rows: TfilaRow[] = []
    let i = 0
    for (const [category, value] of Object.entries(block || {})) {
      // Some categories are a single item, others are date-keyed maps.
      if (value && typeof value === 'object' && 'text' in (value as object)) {
        const v = value as { id: string; text: string; title?: string }
        rows.push({ id: `ushpiz-${category}-${i++}`, title: v.title, body: v.text })
      } else if (value && typeof value === 'object') {
        for (const item of Object.values(value as SukotCategory)) {
          if (item?.text) {
            rows.push({ id: `ushpiz-${item.id || category}-${i++}`, title: item.title, body: item.text })
          }
        }
      }
    }
    return rows
  },
}

export const slihotAshkenazGenerator: Generator = {
  id: 'slihotAshkenaz',
  titleKey: 'slihot',
  generate(ctx: GeneratorContext): TfilaRow[] {
    // slihot.json is organized as: slihot[<nusach>][<section-number>] = items[]
    // The original generator picked the section by parsha index (s0()); since we don't
    // have a perfect parsha→section mapping, fall back to the first available section.
    const nusachKey = ctx.settings.nusach === 'ashkenaz' ? 'ashkenaz' : 'sfarad'
    const block = slihot[nusachKey] || slihot['sfarad']
    const sections = Object.keys(block || {}).sort((a, b) => Number(a) - Number(b))
    const items: SlihotItem[] = block?.[sections[0]] ?? []
    return items
      .map((item, idx) => ({
        id: `slihot-${item.id}-${idx}`,
        title: item.title,
        titleIsKey: !!item.title,
        body: p(item.text) || item.text, // some items reference a string key, others embed text
      }))
      .filter((r) => r.body)
  },
}

export const threefoldGenerator: Generator = {
  id: 'threefold',
  titleKey: 'meen_shalosh',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const main = nusachVariant('meenShalosh', ctx.settings.nusach) || p('meenShalosh')
    return [
      {
        id: 'meenShalosh',
        title: 'meen_shalosh',
        titleIsKey: true,
        body: main,
      },
    ]
  },
}
