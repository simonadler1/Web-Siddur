import { useState } from 'react'
import type { TfilaRow } from '../generators/types'
import { t } from '../lib/ui'
import { p } from '../generators/util'

interface Props {
  rows: TfilaRow[]
}

export function PrayerRenderer({ rows }: Props) {
  return (
    <div className="space-y-4" data-testid="prayer-renderer">
      {rows.map((row) => (
        <Row key={row.id} row={row} />
      ))}
    </div>
  )
}

function Row({ row }: { row: TfilaRow }) {
  const [open, setOpen] = useState(row.expand !== 'collapsed')
  const title = row.title ? (row.titleIsKey ? t(row.title) : row.title) : null
  const rawBody = row.bodyIsKey ? p(row.body) : row.body
  // Strip any printf-style placeholders that generators forgot to interpolate;
  // we never want `%1$s` or `%2$s` literals leaking into the rendered prayer.
  const body = rawBody.replace(/%\d+\$s/g, '')

  if (!title && !body) return null

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 pb-3" data-testid={`row-${row.id}`}>
      {title && (
        <button
          type="button"
          className="w-full text-left text-base font-semibold text-blue-700 dark:text-blue-300 mb-2 flex justify-between items-center"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span>{title}</span>
          {body && row.expand !== 'none' && <span className="text-xs">{open ? '▾' : '▸'}</span>}
        </button>
      )}
      {body && open && (
        <div
          className="prayer-body"
          // The corpus is trusted offline content from the bundled prayer book.
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
    </div>
  )
}
