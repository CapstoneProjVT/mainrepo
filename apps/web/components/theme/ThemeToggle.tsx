'use client'

import { useTheme } from './ThemeProvider'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <Tooltip text={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Button variant='ghost' size='icon' aria-label='Toggle theme' onClick={toggle}>
        <span aria-hidden className='text-lg'>{isDark ? '☀︎' : '☾'}</span>
      </Button>
    </Tooltip>
  )
}
