'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '../theme/ThemeToggle'
import { Container } from '../ui/Card'
import { Input } from '../ui/Input'
import { GuestActions } from './GuestActions'
import { UserMenu } from './UserMenu'

export function TopNav({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
  }, [pathname])

  return (
    <header className='sticky top-0 z-40 border-b bg-card/95 backdrop-blur shadow-sm'>
      <Container className='flex h-14 items-center justify-between gap-4 py-2'>
        <div className='flex items-center gap-4'>
          <button
            className='focus-ring rounded-md border bg-background px-2 py-1 text-muted-foreground hover:bg-muted lg:hidden'
            aria-label='Open navigation'
            onClick={onMenuToggle}
          >
            ☰
          </button>

          <Link href={isLoggedIn ? '/opportunities' : '/'} className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold'>
              IA
            </div>
            <span className='hidden text-xl font-bold tracking-tight sm:block'>
              InternAtlas
            </span>
          </Link>
        </div>

        <div className='hidden max-w-xl flex-1 md:block'>
          <Input
            placeholder='Search jobs, skills, companies...'
            autoComplete='off'
            name='opportunity-search'
            type='search'
          />
        </div>

        <div className='flex items-center gap-3'>
          <ThemeToggle />
          {isLoggedIn ? <UserMenu isAdmin={isAdmin} /> : <GuestActions />}
        </div>
      </Container>
    </header>
  )
}