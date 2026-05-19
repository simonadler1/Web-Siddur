import type { Generator, GeneratorContext, TfilaRow } from './types'
import { nusachVariant, p } from './util'
import {
  isTachanunSkipped,
  isTachanunSkippedAtMincha,
  shouldSayAvinuMalkenu,
  isLongTachanun,
} from './tahanunRules'

/**
 * Build the Tachanun rows for either Shacharit or Mincha. The Mincha variant
 * differs from Shacharit in two ways per common custom:
 *   - it is skipped on Erev Shabbat / Erev Yom Tov (via `isTachanunSkippedAtMincha`)
 *   - the Mon/Thu long-Tachanun supplications (Anshei Emuna / Tamahnu / Al Tas)
 *     are NOT recited — they are a Shacharit-only addition.
 */
function buildTahanunRows(ctx: GeneratorContext, atMincha: boolean): TfilaRow[] {
  const rows: TfilaRow[] = []
  const skipped = atMincha ? isTachanunSkippedAtMincha(ctx.jc) : isTachanunSkipped(ctx.jc)
  const sayAvinu = shouldSayAvinuMalkenu(ctx.jc)
  const long = !atMincha && isLongTachanun(ctx.jc)
  const nusach = ctx.settings.nusach

  if (sayAvinu) {
    const body =
      nusachVariant('avinuTaanit', nusach) ||
      nusachVariant('avinu', nusach) ||
      p('avinu')
    if (body) {
      rows.push({
        id: 'avinu-malkenu',
        title: 'avinuTitle',
        titleIsKey: true,
        body,
      })
    }
  }

  if (!skipped) {
    const body =
      nusachVariant('tahanun', nusach) ||
      p(nusach === 'chabad' ? 'tahanunChabad' : 'tahanun') ||
      p('tahanunAshkenaz')
    if (body) {
      rows.push({
        id: 'tahanun-main',
        title: 'tahanunTitle',
        titleIsKey: true,
        body,
      })
    }

    if (long) {
      for (const key of ['ansheiEmuna', 'tamahnu', 'alTaas']) {
        const text = nusachVariant(key, nusach) || p(key)
        if (text) {
          rows.push({
            id: `tahanun-long-${key}`,
            title: `${key}Title`,
            titleIsKey: true,
            body: text,
          })
        }
      }
    }

    const tahanun25 =
      nusachVariant('tahanun25', nusach) || p('tahanun25Ashkenaz') || p('tahanun25')
    if (tahanun25) {
      rows.push({
        id: 'tahanun-25',
        title: 'tahanun25Title',
        titleIsKey: true,
        body: tahanun25,
      })
    }
  } else {
    const sof =
      nusachVariant('tahanunSof', nusach) ||
      p(nusach === 'chabad' ? 'tahanunSofChabad' : 'tahanunSofAshkenaz')
    if (sof) {
      rows.push({
        id: 'tahanun-sof',
        body: sof,
      })
    }
  }

  return rows
}

/**
 * The "Tahanun" segment of Shacharit. Always returns *some* rows because the
 * surrounding closing prayers (Aleinu, Shir Shel Yom, etc.) come after; on
 * no-tahanun days we just skip the supplication itself.
 */
export const tahanunGenerator: Generator = {
  id: 'shacharitTahanun',
  titleKey: 'tahanunTitle',
  generate(ctx: GeneratorContext): TfilaRow[] {
    return buildTahanunRows(ctx, false)
  },
}

/**
 * The Mincha variant of Tachanun. Same liturgy, but skips Mon/Thu long-Tachanun
 * supplications and additionally skips on Erev Shabbat / Erev Yom Tov.
 */
export const minchaTahanunGenerator: Generator = {
  id: 'minchaTahanun',
  titleKey: 'tahanunTitle',
  generate(ctx: GeneratorContext): TfilaRow[] {
    return buildTahanunRows(ctx, true)
  },
}
