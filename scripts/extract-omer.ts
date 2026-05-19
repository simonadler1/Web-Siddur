#!/usr/bin/env tsx
/**
 * Extract the four Omer-day Hebrew text tables from the decompiled `t7/o.java`
 * and write them as four 49-entry arrays (index 0 = day 1).
 *
 * Fields in source:
 *   f18374 → Edot ha-Mizrach
 *   f18375 → Sefarad
 *   f18376 → Ashkenaz
 *   f18377 → Kabbalistic sefirah (used in the Sefardi closing)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', '..', 'extracted', 'jadx_out', 'sources', 't7', 'o.java')

const java = readFileSync(SRC, 'utf8')

// Parse two forms:
//   "treeMapN.put(dValueOfN, \"...\");"
//   "this.fNNNN.put(Double.valueOf(X.YZd), \"...\");"
//
// The early `treeMapN` form references the field via the local alias. We need to map alias→field
// by reading the assignment line just above each put.
type Entry = { field: string; key: number; value: string }

const entries: Entry[] = []
const aliasMap = new Map<string, string>() // local treeMap var → field name
const valueMap = new Map<string, number>() // local dValueOf var → numeric key

const lines = java.split('\n')
for (const raw of lines) {
  const line = raw.trim()

  let m = line.match(/^TreeMap\s+(treeMap\w*)\s*=\s*this\.(f\d+[a-z]?)/)
  if (m) {
    aliasMap.set(m[1], m[2])
    continue
  }
  m = line.match(/^Double\s+(dValueOf\w*)\s*=\s*Double\.valueOf\(([\d.]+)d?\)/)
  if (m) {
    valueMap.set(m[1], Number(m[2]))
    continue
  }
  // treeMapN.put(dValueOfN, "...")
  m = line.match(/^(treeMap\w*)\.put\((dValueOf\w*),\s*"([^"]*)"\)/)
  if (m) {
    const field = aliasMap.get(m[1])
    const key = valueMap.get(m[2])
    if (field && key !== undefined) entries.push({ field, key, value: m[3] })
    continue
  }
  // this.fNNNN.put(Double.valueOf(X.YZd), "...")
  m = line.match(/^this\.(f\d+[a-z]?)\.put\(Double\.valueOf\(([\d.]+)d?\),\s*"([^"]*)"\)/)
  if (m) {
    entries.push({ field: m[1], key: Number(m[2]), value: m[3] })
    continue
  }
  // this.fNNNN.put(dValueOfX, "...")  — field referenced inline, key via earlier alias
  m = line.match(/^this\.(f\d+[a-z]?)\.put\((dValueOf\w*),\s*"([^"]*)"\)/)
  if (m) {
    const key = valueMap.get(m[2])
    if (key !== undefined) entries.push({ field: m[1], key, value: m[3] })
    continue
  }
}

// Map field id → semantic name from a single inspection of the OmerGenerator usage.
const fieldName: Record<string, string> = {
  f18374a: 'edot',
  f18375b: 'sfarad',
  f18376c: 'ashkenaz',
  f18377d: 'sefiraSof',
}

// Convert keys (e.g., 1.16 = Nisan 16 = day 1, 3.05 = Sivan 5 = day 49) to day-of-omer 1..49.
// Day = ((month - 1) * 30) - 15 + dayOfMonth, where Nisan = month 1.
// More precisely: Nisan 16..30 → days 1..15, Iyar 1..29 → days 16..44, Sivan 1..5 → days 45..49.
function keyToDayOfOmer(key: number): number {
  const month = Math.floor(key)
  const day = Math.round((key - month) * 100)
  if (month === 1) return day - 15 // Nisan 16 → day 1
  if (month === 2) return 15 + day // Iyar 1 → day 16
  if (month === 3) return 44 + day // Sivan 1 → day 45
  throw new Error(`Unknown omer key ${key}`)
}

const result: Record<string, string[]> = { edot: [], sfarad: [], ashkenaz: [], sefiraSof: [] }
for (const name of Object.keys(result)) {
  result[name] = new Array(49).fill('')
}

for (const e of entries) {
  const semantic = fieldName[e.field]
  if (!semantic) continue
  const day = keyToDayOfOmer(e.key)
  if (day < 1 || day > 49) continue
  result[semantic][day - 1] = e.value
}

// Sanity check
for (const [name, arr] of Object.entries(result)) {
  const missing = arr.filter((s) => !s).length
  if (missing > 0) {
    console.warn(`omer.${name}: ${missing} entries missing of 49`)
  }
}

writeFileSync(join(__dirname, '..', 'src', 'data', 'omer.json'), JSON.stringify(result, null, 0) + '\n')
console.log(`Extracted omer tables: ${Object.entries(result).map(([n, a]) => `${n}=${a.filter(Boolean).length}`).join(', ')}`)
