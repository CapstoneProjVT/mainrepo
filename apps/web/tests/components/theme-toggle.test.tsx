import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider } from '../../components/theme/ThemeProvider'
import { ThemeToggle } from '../../components/theme/ThemeToggle'

describe('ThemeToggle', () => {
  it('toggles dark class on html', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    const btn = screen.getByRole('button', { name: 'Toggle theme' })
    fireEvent.click(btn)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
