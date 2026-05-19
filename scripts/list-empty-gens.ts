#!/usr/bin/env tsx
import { listGenerators, makeContext } from '../src/generators/registry'
import { DEFAULT_SETTINGS } from '../src/lib/settings'
import { DEFAULT_LOCATION } from '../src/lib/location'

const HEBREW_RE = /[֐-׿]/
const ctx = makeContext(new Date('2026-05-19'), DEFAULT_SETTINGS, DEFAULT_LOCATION)
for (const g of listGenerators()) {
  const rows = g.generate(ctx)
  const text = rows.map((r) => r.body).join('')
  const status = rows.length === 0 ? 'EMPTY' : !HEBREW_RE.test(text) ? 'NO_HEBREW' : 'OK'
  if (status !== 'OK') {
    console.log(`${status.padEnd(10)} ${g.id.padEnd(20)} rows=${rows.length} bodyLen=${text.length}`)
  }
}
