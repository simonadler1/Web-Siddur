import type { Generator, GeneratorContext, TfilaRow } from './types'
import { makeCompositionGenerator } from './composition'
import compositions from '../data/compositions.json'
import { minchaTahanunGenerator } from './tahanun'
import { isTachanunSkippedAtMincha } from './tahanunRules'
import { amidaGenerator } from './amida'
import { kaddishRow } from './kaddish'
import { nusachVariant, p } from './util'

type Comp = (typeof compositions)[keyof typeof compositions]

// The auto-extracted Mincha composition covers Ashrei/Korbanot/Uva LeZion.
// The actual Amida is the shared hand-ported `amidaGenerator`.
const minchaCore = makeCompositionGenerator('mincha-core', 'mincha', compositions.mincha as Comp)

function prefixed(prefix: string, rows: TfilaRow[]): TfilaRow[] {
  return rows.map((r) => ({
    ...r,
    id: `${prefix}-${r.id}`,
    body: r.body.replace(/%\d+\$s/g, ''),
  }))
}

export const minchaGenerator: Generator = {
  id: 'mincha',
  titleKey: 'mincha',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const rows: TfilaRow[] = []
    const { nusach } = ctx.settings

    // 1. Opening: Ashrei + Korbanot
    rows.push({
      id: 'mincha-ashrei',
      title: 'ashreiTitle',
      titleIsKey: true,
      body: nusachVariant('ashrei', nusach) || p('ashrei'),
    })

    // 2. Core Mincha composition (Korbanot, Uva Lezion, etc.)
    rows.push(...prefixed('core', minchaCore.generate(ctx)))

    // 3. Hatzi Kaddish before the Amida.
    const hatziBeforeAmida = kaddishRow('hazi', ctx, 'before-amida')
    if (hatziBeforeAmida) rows.push(hatziBeforeAmida)

    // 4. The Amida (shared with Shacharit/Mussaf/Arvit)
    rows.push(...prefixed('amida', amidaGenerator.generate(ctx)))

    // 5. Tachanun unless it's a no-Tachanun day (Mincha also skips Erev Shabbat / Erev Yom Tov)
    if (!isTachanunSkippedAtMincha(ctx.jc)) {
      rows.push(...prefixed('tahanun', minchaTahanunGenerator.generate(ctx)))
    }

    // 6. Full Kaddish (Titkabal) closes the Amida block.
    const titkabal = kaddishRow('titkabal', ctx, 'closing')
    if (titkabal) rows.push(titkabal)

    // 7. Closing: Aleinu + Mourner's Kaddish
    rows.push({
      id: 'mincha-aleinu',
      title: 'aleinuTitle',
      titleIsKey: true,
      body: nusachVariant('aleinu', nusach) || p('aleinuAshkenaz'),
    })
    const mourners = kaddishRow('yehe', ctx, 'mourners')
    if (mourners) rows.push(mourners)

    return rows
  },
}
