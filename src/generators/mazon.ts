import type { Generator, GeneratorContext, TfilaRow } from './types'
import { nusachVariant, p } from './util'
import {
  shouldInsertAlHanissim,
  shouldInsertYaalehVyavo,
  isShabbat,
  isNoTachanunMeal,
} from './mazonRules'

const nusachSuffix = (n: string) =>
  n === 'sfarad' ? 'Sefarad' : n === 'ashkenaz' ? 'Ashkenaz' : n === 'chabad' ? 'Chabad' : ''

function pick(base: string, nusach: string): string {
  return p(base + nusachSuffix(nusach)) || p(base)
}

/**
 * Birkat Hamazon — four-blessing grace, with conditional insertions:
 *   - Al Hanissim (Chanukah, Purim) in the second blessing
 *   - Ya'aleh V'Yavo (Rosh Chodesh, Pesach, Sukkot) in the third
 *   - Retzeh (Shabbat) in the third
 *   - Yita Hanuka (Hanukkah-specific closing line)
 */
export const mazonGenerator: Generator = {
  id: 'mazon',
  titleKey: 'mazon',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const rows: TfilaRow[] = []
    const { nusach } = ctx.settings
    const joyful = isNoTachanunMeal(ctx.jc)
    const alHanissim = shouldInsertAlHanissim(ctx.jc)
    const yaaleh = shouldInsertYaalehVyavo(ctx.jc)

    // 1. Opening psalm — Shir Hama'alot on joyful days, Al Naharot Bavel otherwise.
    rows.push({
      id: 'mazon-opening',
      title: 'psukimBeforMazon',
      titleIsKey: true,
      body:
        joyful
          ? pick('avarechaNoTahanun', nusach) || pick('avarecha', nusach)
          : pick('avarecha', nusach),
      expand: 'collapsed',
    })

    // 2. Zimun (when 3+ adults are present — gated by settings.minyan != yahid).
    if (ctx.settings.minyan === 'tzibur') {
      rows.push({
        id: 'mazon-zimun',
        title: 'zimun_title',
        titleIsKey: true,
        body: pick('zimun', nusach),
        expand: 'collapsed',
      })
    }

    // 3. First blessing (Hazan — "Who feeds")
    rows.push({
      id: 'mazon-bHazan',
      title: 'bHazan_title',
      titleIsKey: true,
      body: pick('bHazan', nusach),
    })

    // 4. Second blessing (Birkat HaAretz — "For the Land") with Al Hanissim insertion
    let bNodeBase = pick('bNode', nusach)
    let alHanissimText = ''
    if (alHanissim === 'chanukah') alHanissimText = pick('bNodeHanuka', nusach)
    else if (alHanissim === 'purim') alHanissimText = pick('bNodePurim', nusach)
    bNodeBase = bNodeBase.replace(/%1\$s/g, alHanissimText || p('klum') || '')
    rows.push({
      id: 'mazon-bNode',
      title: 'bNode_title',
      titleIsKey: true,
      body: bNodeBase,
    })

    // 5. Third blessing (Birkat Yerushalayim — "Rebuild Jerusalem") with Ya'aleh V'Yavo / Retzeh
    let bRahemBase = pick('bRahem', nusach)
    const insertions: string[] = []
    if (yaaleh === 'roshChodesh') insertions.push(pick('bRahemRoshHodesh', nusach))
    else if (yaaleh === 'pesach') insertions.push(pick('bRahmenPassover', nusach))
    else if (yaaleh === 'succos') insertions.push(pick('bRahemSukot', nusach))
    if (isShabbat(ctx.jc)) {
      const retzeh = pick('retze', nusach) || pick('bRahemShabat', nusach)
      if (retzeh) insertions.unshift(retzeh)
    }
    bRahemBase = bRahemBase.replace(/%1\$s/g, insertions.join(' ') || p('klum') || '')
    rows.push({
      id: 'mazon-bRahem',
      title: 'bRahem_title',
      titleIsKey: true,
      body: bRahemBase,
    })

    // 6. Fourth blessing (HaTov VeHaMetiv — "Who is good and does good")
    rows.push({
      id: 'mazon-bHatov',
      title: 'bHatov_title',
      titleIsKey: true,
      body: pick('bHatov', nusach),
    })

    // 7. Harachaman ("May the Merciful One…") with day-specific additions
    let rahaman = pick('rahaman', nusach)
    let rahamanIns = ''
    if (yaaleh === 'roshChodesh') {
      rahamanIns = pick('yitaRoshHodesh', nusach) || pick('sofRoshHodesh', nusach)
    } else if (yaaleh === 'pesach') {
      rahamanIns = pick('yitaPassover', nusach)
    } else if (yaaleh === 'succos') {
      rahamanIns = pick('yitaSukot', nusach) || pick('sofSukot', nusach)
    }
    rahaman = rahaman.replace(/%1\$s/g, rahamanIns || p('klum') || '')
    rows.push({
      id: 'mazon-rahaman',
      title: 'rahaman_title',
      titleIsKey: true,
      body: rahaman,
    })

    // 8. Extra Hanukkah / Purim closing line
    if (alHanissim) {
      rows.push({
        id: 'mazon-yita-hanuka',
        body: p('yitaHanuka'),
      })
    }

    return rows
  },
}
