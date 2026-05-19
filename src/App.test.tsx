import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App skeleton', () => {
  it('renders the header with the app title and menu button', () => {
    render(<App />)
    expect(screen.getAllByText(/Smart Siddur/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('menu-button')).toBeInTheDocument()
  })

  it('renders the home page by default', () => {
    render(<App />)
    expect(screen.getByTestId('today-prayers')).toBeInTheDocument()
  })
})
