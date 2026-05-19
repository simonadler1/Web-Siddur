import type { Generator, GeneratorContext, TfilaRow } from './types'
import { nusachVariant, p } from './util'
import {
  avotAseretKey,
  b2AseretKey,
  b19AseretKey,
  geshemSeason,
  isAseretYemeiTeshuva,
} from './amidaRules'

/**
 * The Amida (Shemoneh Esrei) — 19 blessings of the daily silent prayer.
 *
 * Ported from `g7/a.java` in the decompiled APK. Keys `b2`..`b19` correspond
 * to the 2nd..19th blessings respectively; `Avot` is the 1st. Seasonal
 * insertions (Tal/Geshem, Aseret-Yemei-Teshuva) are wired in via
 * `amidaRules.ts`. Tal/Geshem follows `settings.isWinter` rather than
 * recomputing the Israel/diaspora date windows from scratch.
 */

interface AmidaBlessing {
  id: string
  title: string
  base: string
}

const BLESSINGS: AmidaBlessing[] = [
  { id: 'avot', title: 'avotTitle', base: 'Avot' },
  { id: 'gevurot', title: 'b2Title', base: 'b2' },
  { id: 'kedusha-hashem', title: 'b3Title', base: 'b3' },
  { id: 'daat', title: 'b4Title', base: 'b4' },
  { id: 'tshuva', title: 'b5Title', base: 'b5' },
  { id: 'slicha', title: 'b6Title', base: 'b6' },
  { id: 'geula', title: 'b7Title', base: 'b7' },
  { id: 'rfua', title: 'b8Title', base: 'b8' },
  { id: 'birkat-shanim', title: 'b9Title', base: 'b9' },
  { id: 'kibutz', title: 'b10Title', base: 'b10' },
  { id: 'mishpat', title: 'b11Title', base: 'b11' },
  { id: 'minim', title: 'b12Title', base: 'b12' },
  { id: 'tzadikim', title: 'b13Title', base: 'b13' },
  { id: 'yerushalayim', title: 'b14Title', base: 'b14' },
  { id: 'david', title: 'b15Title', base: 'b15' },
  { id: 'tfila', title: 'b16Title', base: 'b16' },
  { id: 'avoda', title: 'b17Title', base: 'b17' },
  { id: 'hodaa', title: 'b18Title', base: 'b18' },
  { id: 'shalom', title: 'b19Title', base: 'b19' },
]

function fill(text: string, one: string, two: string = ''): string {
  return text.replace(/%1\$s/g, one).replace(/%2\$s/g, two)
}

export const amidaGenerator: Generator = {
  id: 'amida',
  titleKey: 'amidaTitle',
  generate(ctx: GeneratorContext): TfilaRow[] {
    const rows: TfilaRow[] = []
    const { nusach, isWinter } = ctx.settings
    const aseret = isAseretYemeiTeshuva(ctx.jc)
    const season = geshemSeason(isWinter)

    // Opening line: "Adonai, open my lips…"
    const sfatay = nusachVariant('sfatay', nusach) || p('sfatay')
    if (sfatay) {
      rows.push({
        id: 'amida-sfatay',
        title: 'amidaTitle',
        titleIsKey: true,
        body: sfatay,
      })
    }

    for (const b of BLESSINGS) {
      let text: string
      if (b.base === 'b9') {
        // b9 has full-text Winter/Summer variants (Bareh aleinu vs Barchenu).
        const seasonal = season === 'winter' ? 'b9Winter' : 'b9Summer'
        text = nusachVariant(seasonal, nusach) || p(seasonal)
      } else {
        text = nusachVariant(b.base, nusach) || p(b.base)
      }
      if (!text) continue

      switch (b.base) {
        case 'Avot': {
          // %1$s = "Zochrenu LeChaim…" during Aseret, empty otherwise.
          const ins = aseret ? p(avotAseretKey(nusach)) : ''
          text = fill(text, ins)
          break
        }
        case 'b2': {
          // %1$s = Tal or Geshem; %2$s = "Mi khamokha…" during Aseret.
          const seasonal = season === 'winter' ? p('b2Winter') : p('b2Summer')
          const aser = aseret ? p(b2AseretKey(nusach)) : ''
          text = fill(text, seasonal, aser)
          break
        }
        case 'b3': {
          // %1$s = HaMelech HaKadosh (Aseret) or HaEl HaKadosh.
          text = fill(text, aseret ? p('b3Aseret') : p('b3Sof'))
          break
        }
        case 'b9': {
          // %1$s, %2$s = optional color tags around the transition phrase.
          text = fill(text, '', '')
          break
        }
        case 'b11': {
          // %1$s = HaMelech HaMishpat (Aseret) or Melech Ohev Tzedaka.
          text = fill(text, aseret ? p('b11aseret') : p('b11Sof'))
          break
        }
        case 'b19': {
          // %1$s = "B'Sefer Chaim…" during Aseret, empty otherwise.
          const ins = aseret ? p(b19AseretKey(nusach)) : ''
          text = fill(text, ins)
          break
        }
        default:
          break
      }

      // Final safety net: any blessing we didn't explicitly fill (e.g. b4's
      // Havdala insertion) should not surface a literal placeholder.
      const cleaned = text.replace(/%\d+\$s/g, '')

      rows.push({
        id: `amida-${b.id}`,
        title: b.title,
        titleIsKey: true,
        body: cleaned,
      })
    }

    // Closing meditation (Elohai Netzor) — common to all nusachim.
    const netzor = nusachVariant('netzor', nusach) || p('netzor')
    if (netzor) {
      rows.push({
        id: 'amida-netzor',
        title: 'netzorTitle',
        titleIsKey: true,
        body: netzor,
      })
    }

    return rows
  },
}
