import type { Generator, GeneratorContext, TfilaRow } from './types'
import { makeCompositionGenerator } from './composition'
import compositions from '../data/compositions.json'
import { tahanunGenerator } from './tahanun'
import { shacharitSofGenerator } from './shacharitSof'
import { mussafGenerator } from './mussaf'
import { mussafKind } from './mussafRules'
import { amidaGenerator } from './amida'
import { kaddishRow } from './kaddish'
import { isTachanunSkipped } from './tahanunRules'

/**
 * Full Shacharit service — composed of the sub-generators that the Android
 * source uses:
 *   1. Opening     — Modeh Ani, hand-washing, Birkot HaShachar, Korbanot
 *   2. Zimra       — Pesukei DeZimra (Baruch She'amar → Yishtabach)
 *   3. Shma        — Yotzer Or → Shema → Emet V'Yatziv
 *   4. Shachar     — Amida (the 18/19 blessings)
 *   5. Tahanun     — Supplications (gates itself on no-Tachanun days)
 *   6. Mussaf      — Only on Shabbat / Rosh Chodesh / festivals
 *   7. Sof         — Ashrei → Uva LeZion → Aleinu → Shir Shel Yom
 *
 * Each sub-generator's rows are prefixed with its name to keep React keys
 * unique across the merged list.
 */

type Comp = (typeof compositions)[keyof typeof compositions]

// The Shacharit liturgical order is: Shachar (morning prep) → Opening
// (Korbanot) → Zimra (Pesukei DeZimra) → Shma → Amida → Tahanun → Mussaf → Sof.
// This mirrors the order in which `ShacharitGenerator.java` instantiates its
// sub-generators (lines 105–125).
const shachar = makeCompositionGenerator('shachar', 'shacharit', compositions.shacharitShachar as Comp)
const opening = makeCompositionGenerator('opening', 'shacharit', compositions.shacharitOpening as Comp)
const zimra = makeCompositionGenerator('zimra', 'pesukeiDeZimra', compositions.shacharitZimra as Comp)
const shma = makeCompositionGenerator('shma', 'shemaTitle', compositions.shacharitShma as Comp)

function prefixed(prefix: string, rows: TfilaRow[]): TfilaRow[] {
  return rows.map((r) => ({
    ...r,
    id: `${prefix}-${r.id}`,
    // Final scrub: no sub-generator should leak unreplaced printf placeholders
    // into the composite Shacharit output, even if its own implementation forgot.
    body: r.body.replace(/%\d+\$s/g, ''),
  }))
}

export const shacharitGenerator: Generator = {
  id: 'shacharit',
  titleKey: 'shacharit',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const rows: TfilaRow[] = []

    rows.push(...prefixed('shachar', shachar.generate(ctx)))
    rows.push(...prefixed('opening', opening.generate(ctx)))
    rows.push(...prefixed('zimra', zimra.generate(ctx)))

    // Hatzi Kaddish after Pesukei DeZimra, before Barchu/Shma.
    const hatziBeforeShma = kaddishRow('hazi', ctx, 'after-zimra')
    if (hatziBeforeShma) rows.push(hatziBeforeShma)

    rows.push(...prefixed('shma', shma.generate(ctx)))
    rows.push(...prefixed('amida', amidaGenerator.generate(ctx)))

    // Tachanun self-gates on no-Tachanun days; we always call it.
    rows.push(...prefixed('tahanun', tahanunGenerator.generate(ctx)))

    // Hatzi Kaddish after Tachanun (or directly after Amida on no-Tachanun days),
    // before the closing Ashrei.
    const hatziAfterTahanun = kaddishRow('hazi', ctx, isTachanunSkipped(ctx.jc) ? 'after-amida' : 'after-tahanun')
    if (hatziAfterTahanun) rows.push(hatziAfterTahanun)

    // Mussaf only when applicable (avoid the empty-state row from leaking in).
    if (mussafKind(ctx.jc)) {
      rows.push(...prefixed('mussaf', mussafGenerator.generate(ctx)))
    }

    rows.push(...prefixed('sof', shacharitSofGenerator.generate(ctx)))

    // Full Kaddish (Titkabal) closes the service, followed by the Mourner's Kaddish.
    const titkabal = kaddishRow('titkabal', ctx, 'closing')
    if (titkabal) rows.push(titkabal)
    const mourners = kaddishRow('yehe', ctx, 'mourners')
    if (mourners) rows.push(mourners)

    return rows
  },
}
