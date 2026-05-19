import type { Generator, GeneratorContext, TfilaRow } from './types'
import { p } from './util'
import omerTables from '../data/omer.json'

const tables = omerTables as {
  edot: string[]
  sfarad: string[]
  ashkenaz: string[]
  sefiraSof: string[]
}

function dayText(day: number, nusach: string): string {
  if (day < 1 || day > 49) return ''
  switch (nusach) {
    case 'edot':
      return tables.edot[day - 1]
    case 'sfarad':
      return tables.sfarad[day - 1]
    case 'chabad':
    case 'ashkenaz':
    default:
      return tables.ashkenaz[day - 1]
  }
}

function sefiraSof(day: number, nusach: string): string {
  if (day < 1 || day > 49) return ''
  switch (nusach) {
    case 'edot':
      return (p('sefiraSof') || '').replace('%1$s', p('whisper'))
    case 'ashkenaz':
      return p('sefiraSofAshkenaz')
    case 'sfarad':
    case 'chabad':
    default:
      return (p('sefiraSofSefarad') || '').replace('%1$s', tables.sefiraSof[day - 1] || '')
  }
}

function openingBlessing(nusach: string): string {
  switch (nusach) {
    case 'edot':
      return p('sefira')
    case 'sfarad':
    case 'chabad':
      return p('sefiraSefarad')
    case 'ashkenaz':
    default:
      return p('sefiraAshkenaz')
  }
}

export const omerGenerator: Generator = {
  id: 'omer',
  titleKey: 'omer_title',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const rows: TfilaRow[] = []
    const day = ctx.jc.getDayOfOmer() ?? 0

    rows.push({
      id: 'opening',
      title: 'omer_title',
      titleIsKey: true,
      body: openingBlessing(ctx.settings.nusach),
    })

    if (day < 1 || day > 49) {
      rows.push({
        id: 'not-omer-period',
        body: '',
      })
      return rows
    }

    const dayString = dayText(day, ctx.settings.nusach)
    const formatted = `<b><font color="#009688">${dayString}</font></b>`
    rows.push({
      id: 'sefiratHaomer',
      body: formatted,
    })

    const sof = sefiraSof(day, ctx.settings.nusach)
    if (sof) rows.push({ id: 'sefiraSof', body: sof })

    if (ctx.settings.nusach === 'edot') {
      rows.push({
        id: 'menora',
        title: 'menora',
        titleIsKey: true,
        body: 'klum',
        bodyIsKey: true,
        expand: 'collapsed',
      })
    }

    return rows
  },
}
