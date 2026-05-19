import type { Generator, GeneratorContext, TfilaRow } from './types'
import { nusachVariant, p } from './util'
import { shirShelYomKey, shouldSayLedavid, specialMizmorKey, omerDayHere } from './shacharitSofRules'
import omerTables from '../data/omer.json'

const tables = omerTables as { ashkenaz: string[]; sfarad: string[]; edot: string[] }

/**
 * Closing portion of Shacharit (Ashrei → Uva LeZion → Aleinu → Shir Shel Yom
 * → Ledavid → Omer count → closing piyutim). Each row's appearance is gated
 * on calendar conditions captured in `shacharitSofRules`.
 */
export const shacharitSofGenerator: Generator = {
  id: 'shacharitSof',
  titleKey: 'shacharit',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const rows: TfilaRow[] = []
    const { nusach } = ctx.settings

    // 1. Ashrei (always)
    rows.push({
      id: 'sof-ashrei',
      title: 'ashreiTitle',
      titleIsKey: true,
      body: nusachVariant('ashrei', nusach) || p('ashrei'),
    })

    // 2. Uva LeZion (always, with nusach-specific text). The %1$s placeholder
    //    is replaced with the "whisper" instruction.
    const uvaKey = `uvaLezion${nusach === 'ashkenaz' ? 'Ashkenaz' : nusach === 'sfarad' ? 'Sefarad' : nusach === 'chabad' ? 'Chabad' : ''}`
    const uvaText = (p(uvaKey) || p('uvaLezion')).replace(/%1\$s/g, p('whisper') || '')
    if (uvaText) {
      rows.push({
        id: 'sof-uva-lezion',
        title: 'uvaTitle',
        titleIsKey: true,
        body: uvaText,
      })
    }

    // 3. Aleinu (always)
    rows.push({
      id: 'sof-aleinu',
      title: 'aleinuTitle',
      titleIsKey: true,
      body: nusachVariant('aleinu', nusach) || p('aleinuAshkenaz'),
    })

    // 4. Shir Shel Yom (Sun–Fri only — Shabbat handled by Mussaf)
    const ssyKey = shirShelYomKey(ctx.jc)
    if (ssyKey) {
      const variant =
        (nusach === 'sfarad' && ssyKey === 'shirShel1' && p('shirShel1Sefarad')) ||
        (nusach !== 'edot' && ssyKey === 'shirShel6' && p('shirShel6Ashkenaz')) ||
        (nusach === 'sfarad' && ssyKey === 'shirShel4' && p('shirShel4Sefarad'))
      const text = (variant || p(ssyKey) || '').replace(
        /%1\$s/g,
        nusach === 'edot' ? p('hashirSh') : p('sheboHayu'),
      )
      if (text) {
        rows.push({
          id: 'sof-shir-shel-yom',
          title: 'shirShelTitle',
          titleIsKey: true,
          body: text,
        })
      }
    }

    // 5. Special Mizmor (Hanukkah, fast days, post-Yom Kippur). Edot-only in source.
    const mizmorKey = specialMizmorKey(ctx.jc)
    if (mizmorKey && nusach === 'edot') {
      const body = p(mizmorKey)
      if (body) {
        rows.push({
          id: 'sof-special-mizmor',
          title: 'specialMizmorTitle',
          titleIsKey: true,
          body,
        })
      }
    }

    // 6. LeDavid Hashem Ori (Psalm 27) — Elul through Hoshana Rabbah
    if (shouldSayLedavid(ctx.jc)) {
      const body = nusachVariant('ledavid', nusach) || p('ledavid')
      if (body) {
        rows.push({
          id: 'sof-ledavid',
          title: 'ledavidTitle',
          titleIsKey: true,
          body,
        })
      }
    }

    // 7. Omer count — during the 49-day period only
    const omer = omerDayHere(ctx.jc)
    if (omer >= 1 && omer <= 49) {
      const table = nusach === 'edot' ? tables.edot : nusach === 'sfarad' ? tables.sfarad : tables.ashkenaz
      const dayText = table[omer - 1]
      if (dayText) {
        rows.push({
          id: 'sof-omer',
          title: 'omer_title',
          titleIsKey: true,
          body: `<b><font color="#009688">${dayText}</font></b>`,
        })
      }
    }

    // 8. Hoshienu (non-Ashkenaz only)
    if (nusach !== 'ashkenaz') {
      const body = nusachVariant('hoshienu', nusach) || p('hoshienu')
      if (body) {
        rows.push({
          id: 'sof-hoshienu',
          title: 'hoshienuTitle',
          titleIsKey: true,
          body,
        })
      }
    }

    return rows
  },
}
