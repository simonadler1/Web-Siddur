import type { Generator, GeneratorContext, TfilaRow } from './types'
import { makeCompositionGenerator } from './composition'
import compositions from '../data/compositions.json'
import { amidaGenerator } from './amida'
import { kaddishRow } from './kaddish'
import { nusachVariant, p } from './util'

type Comp = (typeof compositions)[keyof typeof compositions]

// Arvit's auto-extracted composition covers Maariv blessings (V'hu Rachum,
// Maariv Aravim, Ahavat Olam, Shema, V'emuna, Hashkivenu, Baruch Hashem
// L'Olam). The Amida is the shared hand-ported one.
const arvitCore = makeCompositionGenerator('arvit-core', 'arvit', compositions.arvit as Comp)

function prefixed(prefix: string, rows: TfilaRow[]): TfilaRow[] {
  return rows.map((r) => ({
    ...r,
    id: `${prefix}-${r.id}`,
    body: r.body.replace(/%\d+\$s/g, ''),
  }))
}

export const arvitGenerator: Generator = {
  id: 'arvit',
  titleKey: 'arvit',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const rows: TfilaRow[] = []
    const { nusach } = ctx.settings

    rows.push(...prefixed('core', arvitCore.generate(ctx)))

    // Hatzi Kaddish before the Amida (after the Shma + its blessings).
    const hatziBeforeAmida = kaddishRow('hazi', ctx, 'before-amida')
    if (hatziBeforeAmida) rows.push(hatziBeforeAmida)

    rows.push(...prefixed('amida', amidaGenerator.generate(ctx)))

    // Full Kaddish closes the Amida block.
    const titkabal = kaddishRow('titkabal', ctx, 'closing')
    if (titkabal) rows.push(titkabal)

    rows.push({
      id: 'arvit-aleinu',
      title: 'aleinuTitle',
      titleIsKey: true,
      body: nusachVariant('aleinu', nusach) || p('aleinuAshkenaz'),
    })

    // Mourner's Kaddish after Aleinu.
    const mourners = kaddishRow('yehe', ctx, 'mourners')
    if (mourners) rows.push(mourners)

    return rows
  },
}
