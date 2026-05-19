import type { Generator, GeneratorContext, TfilaRow } from './types'
import { p, nusachVariant } from './util'
import { mussafKind } from './mussafRules'

const nusachSuffix = (n: string) =>
  n === 'sfarad' ? 'Sefarad' : n === 'ashkenaz' ? 'Ashkenaz' : n === 'chabad' ? 'Chabad' : ''

function pick(base: string, nusach: string): string {
  return p(base + nusachSuffix(nusach)) || p(base)
}

/**
 * Mussaf service. The original Java generator reflects on R.string field names
 * by composing "<base>" + dynamic Hebrew-date suffix (e.g., `mussaf1_15` for
 * Pesach day 1). Most of those suffixed keys aren't present in our extracted
 * prayer corpus, so we fall back to the per-occasion generic Mussaf and tag
 * the specific date in the row title for clarity.
 */
export const mussafGenerator: Generator = {
  id: 'mussaf',
  titleKey: 'mussaf',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const kind = mussafKind(ctx.jc)
    const { nusach } = ctx.settings
    const rows: TfilaRow[] = []

    // No Mussaf today → show only the empty-state row, not the pre-Mussaf Ashrei.
    if (!kind) {
      rows.push({
        id: 'mussaf-none',
        body: '<i>No Mussaf service today — Mussaf is only recited on Shabbat, Rosh Chodesh, and the festivals.</i>',
      })
      return rows
    }

    // Pre-Mussaf: Ashrei is recited first.
    rows.push({
      id: 'mussaf-ashrei',
      title: 'ashreiTitle',
      titleIsKey: true,
      body: nusachVariant('ashrei', nusach) || p('ashrei'),
    })

    // Kedusha — different versions for weekday/festival/RC Mussaf
    const kedushaKey =
      kind === 'roshChodesh' || kind === 'roshChodeshShabbat'
        ? 'kdushaRoshHodesh'
        : kind === 'shabbat'
          ? 'kdushaMusaf'
          : 'kdushaMoed'
    rows.push({
      id: 'mussaf-kedusha',
      title: 'kdushaMusaf',
      titleIsKey: true,
      body: pick(kedushaKey, nusach),
    })

    // Main Mussaf prayer (Amida-style)
    const mainKey =
      kind === 'roshChodesh' || kind === 'roshChodeshShabbat'
        ? 'roshHodeshMusaf'
        : kind === 'shabbat'
          ? 'mussafMoed' // No dedicated Shabbat Mussaf key in corpus; fall through to general festival.
          : 'mussafMoed' // Generic festival Mussaf — covers Pesach/Shavuot/general regalim.
    rows.push({
      id: `mussaf-${kind}-main`,
      title: 'mussaf',
      titleIsKey: true,
      body: pick(mainKey, nusach),
    })

    // Day-specific Sukkot Mussaf additions
    if (kind === 'sukkot') {
      // Try to pick the day-of-Sukkot specific text.
      const sukkotDay = ctx.jc.getJewishDayOfMonth() - 14 // 15 Tishrei = day 1
      const sukkotKeys: Record<number, string> = {
        1: 'sukotYomSheniMusaf',
        2: 'sukotYomShlishiMusaf',
        3: 'sukotYomReviMusaf',
        4: 'sukotYomHamishiMusaf',
        5: 'sukotYomShishiMusaf',
        6: 'sukotYomShviMusaf',
        7: 'sukotYomShminiMusaf',
      }
      const sukkotKey = sukkotKeys[sukkotDay]
      if (sukkotKey && p(sukkotKey)) {
        rows.push({
          id: 'mussaf-sukkot-day',
          body: p(sukkotKey),
        })
      }
    }

    return rows
  },
}
