import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrayerRenderer } from './PrayerRenderer'

describe('PrayerRenderer', () => {
  it('strips unreplaced printf placeholders from the body', () => {
    render(
      <PrayerRenderer
        rows={[
          {
            id: 'r1',
            title: 'Avot',
            body: 'ברוך אתה %1$s אלהינו %2$s אבותינו',
          },
        ]}
      />,
    )
    const body = screen.getByTestId('row-r1').querySelector('.prayer-body')!
    expect(body.textContent).not.toMatch(/%\d+\$s/)
    expect(body.textContent).toContain('אלהינו')
  })

  it('does not render the placeholder regex as visible text anywhere', () => {
    render(
      <PrayerRenderer
        rows={[
          { id: 'a', title: 'a', body: 'plain text' },
          { id: 'b', title: 'b', body: 'has %1$s' },
          { id: 'c', title: 'c', body: 'has %2$s and %3$s' },
        ]}
      />,
    )
    expect(document.body.textContent).not.toMatch(/%\d+\$s/)
  })
})
