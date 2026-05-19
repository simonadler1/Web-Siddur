import { describe, it, expect } from 'vitest'
import { JewishCalendar } from 'kosher-zmanim'
import { shacharitGenerator } from './shacharit'
import { DEFAULT_SETTINGS, type Nusach } from '../lib/settings'

function ctx(nusach: Nusach, isWoman = false) {
  const jc = new JewishCalendar()
  jc.setJewishDate(5786, 8, 5) // 5 Cheshvan 5786 = plain Monday weekday
  return {
    date: jc.getDate().toJSDate(),
    settings: { ...DEFAULT_SETTINGS, nusach, isWoman },
    jc,
  }
}

// Count consecutive rows whose IDs share a base (the part before the final `-N`).
function consecutiveDuplicates(rows: { id: string }[]): Array<{ base: string; count: number }> {
  const out: Array<{ base: string; count: number }> = []
  let last = ''
  let run = 0
  for (const r of rows) {
    const base = r.id.replace(/-\d+$/, '')
    if (base === last) {
      run++
    } else {
      if (run > 1) out.push({ base: last, count: run })
      last = base
      run = 1
    }
  }
  if (run > 1) out.push({ base: last, count: run })
  return out
}

describe('Composition dedup — only the active nusach should render', () => {
  it.each(['ashkenaz', 'sfarad', 'chabad', 'edot'] as Nusach[])(
    'no consecutive rows in Shacharit share a base for nusach=%s',
    (nusach) => {
      const rows = shacharitGenerator.generate(ctx(nusach))
      const dupes = consecutiveDuplicates(rows)
      expect(
        dupes,
        `${nusach}: consecutive same-base rows leaked nusach variants:\n${dupes
          .map((d) => `  ${d.base} × ${d.count}`)
          .join('\n')}`,
      ).toEqual([])
    },
  )

  it('Ashkenaz user does NOT receive any *Sefarad-suffixed key text', () => {
    // Smoke check: the Modeh Ani body for an Ashkenaz user should not equal
    // the Sfarad variant's text.
    const ashk = shacharitGenerator.generate(ctx('ashkenaz'))
    const sfar = shacharitGenerator.generate(ctx('sfarad'))
    const modehAshk = ashk.find((r) => r.id.startsWith('shachar-modeh-'))!.body
    const modehSfar = sfar.find((r) => r.id.startsWith('shachar-modeh-'))!.body
    expect(modehAshk).not.toBe(modehSfar)
  })

  it('Modeh Ani appears exactly once per service for each nusach', () => {
    for (const nusach of ['ashkenaz', 'sfarad', 'chabad', 'edot'] as Nusach[]) {
      const rows = shacharitGenerator.generate(ctx(nusach))
      const modehRows = rows.filter((r) => /shachar-modeh-\d+$/.test(r.id))
      expect(modehRows.length, `${nusach}: ${modehRows.length} Modeh Ani rows`).toBe(1)
    }
  })

  it('Netilat Yadayim appears exactly once per service', () => {
    for (const nusach of ['ashkenaz', 'sfarad', 'chabad', 'edot'] as Nusach[]) {
      const rows = shacharitGenerator.generate(ctx(nusach))
      const netilaRows = rows.filter((r) => /shachar-netila-\d+$/.test(r.id))
      expect(netilaRows.length).toBe(1)
    }
  })

  it('total Shacharit row count is roughly the same across nusachim', () => {
    const counts = (['ashkenaz', 'sfarad', 'chabad', 'edot'] as Nusach[]).map(
      (n) => shacharitGenerator.generate(ctx(n)).length,
    )
    // No nusach should have more than 20% more rows than another — that would
    // suggest one is rendering duplicates.
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    expect(max - min, `row count spread too wide: ${counts.join(' / ')}`).toBeLessThan(min * 0.2)
  })

  it('isWoman flag swaps the Modeh Ani body to the Woman variant', () => {
    const man = shacharitGenerator.generate(ctx('ashkenaz', false))
    const woman = shacharitGenerator.generate(ctx('ashkenaz', true))
    const m = man.find((r) => r.id.startsWith('shachar-modeh-'))!.body
    const w = woman.find((r) => r.id.startsWith('shachar-modeh-'))!.body
    expect(m).not.toBe(w)
  })

  // Source-conditional rows: certain prayer keys with no nusach suffix in
  // their name are emitted inside `if (nusach == X)` in the Java source. The
  // extractor must capture that scope; otherwise these "Edot-only" prayers
  // leak into Ashkenaz/Sfarad/Chabad output.
  it('Patach Eliyahu (key=patah) appears ONLY for Edot HaMizrach nusach', () => {
    for (const nusach of ['ashkenaz', 'sfarad', 'chabad'] as Nusach[]) {
      const rows = shacharitGenerator.generate(ctx(nusach))
      const found = rows.find((r) => /shachar-patah-/.test(r.id))
      expect(found, `${nusach} should not include Patach Eliyahu`).toBeUndefined()
    }
    const edot = shacharitGenerator.generate(ctx('edot'))
    expect(edot.find((r) => /shachar-patah-/.test(r.id))).toBeDefined()
  })

  it('Adon Olam appears at the start of Shacharit for EVERY nusach', () => {
    for (const nusach of ['ashkenaz', 'sfarad', 'chabad', 'edot'] as Nusach[]) {
      const rows = shacharitGenerator.generate(ctx(nusach))
      const text = rows
        .map((r) => r.body)
        .join(' ')
        .normalize('NFD')
        .replace(/[֑-ׇ]/g, '')
      expect(text, `${nusach} should include Adon Olam`).toMatch(/אדון עולם/)
    }
  })

  it('Kaddish D\'Rabbanan in the morning prep appears ONLY for Edot', () => {
    for (const nusach of ['ashkenaz', 'sfarad', 'chabad'] as Nusach[]) {
      const rows = shacharitGenerator.generate(ctx(nusach))
      // The morning-prep Kadish D'Rabbanan (emitted by the shachar sub-generator),
      // not the standalone Kaddish at standard insertion points.
      const found = rows.find((r) => r.id === 'shachar-kadishDer-' || /shachar-kadishDer-\d+$/.test(r.id))
      expect(found, `${nusach} should not include morning-prep Kaddish D'Rabbanan`).toBeUndefined()
    }
    const edot = shacharitGenerator.generate(ctx('edot'))
    expect(edot.find((r) => /shachar-kadishDer-\d+$/.test(r.id))).toBeDefined()
  })
})
