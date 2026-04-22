'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import { Container } from '../ui/Card'
import { Button } from '../ui/Button'
import { TopNav } from './TopNav'
import { LeftRail, navItems } from './LeftRail'
import { RightRail } from './RightRail'

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    api.getMe().then((me) => setIsAdmin(me.is_admin)).catch(() => setIsAdmin(false))
  }, [])

  if (path === '/' || path === '/login' || path === '/signup') {
    return (
      <div className='min-h-screen bg-muted/20'>
        <TopNav onMenuToggle={() => { }} />
        {children}
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-muted/20'>
      <TopNav onMenuToggle={() => setOpen(true)} />

      <Container className='grid gap-6 pt-6 pb-12 lg:grid-cols-[240px_minmax(0,1fr)_240px]'>
        <LeftRail isAdmin={isAdmin} />

        <main className="min-w-0">{children}</main>

        <RightRail />
      </Container>

      {open ? (
        <div className='fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm lg:hidden'>
          <aside className='h-full w-72 space-y-4 border-r bg-card p-5 animate-in slide-in-from-left duration-200'>
            <div className='flex items-center justify-between mb-2'>
              <p className='font-bold text-lg tracking-tight'>InternAtlas</p>
              <Button variant='ghost' size='icon' aria-label='Close navigation' onClick={() => setOpen(false)}>✕</Button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = path?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <span className="mr-3 text-lg opacity-80">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="pt-4 mt-4 border-t border-border">
              <p className='text-xs uppercase font-bold text-muted-foreground ml-1'>Workspace Mode</p>
              <div className="mt-2 text-sm font-medium ml-1 flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', isAdmin ? 'bg-primary' : 'bg-green-500')}></span>
                {isAdmin ? 'Admin' : 'Candidate'}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
