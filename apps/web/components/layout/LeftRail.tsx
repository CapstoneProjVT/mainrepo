'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { Card } from '../ui/Card'

export const navItems = [
    { href: '/opportunities', label: 'Home', icon: '⌂' },
    { href: '/tracker', label: 'Applications', icon: '◎' },
    { href: '/insights', label: 'Insights', icon: '◩' },
    { href: '/profile', label: 'Profile', icon: '◉' },
    { href: '/admin/import', label: 'Admin', icon: '◈' },
]

export function LeftRail({ isAdmin }: { isAdmin: boolean }) {
    const path = usePathname()

    return (
        <aside className='hidden space-y-4 lg:block'>
            <Card className='p-3 bg-card border-border shadow-sm'>
                <nav className='space-y-1.5'>
                    {navItems.map((item) => {
                        if (item.label === 'Admin' && !isAdmin) return null
                        const active = path?.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'focus-ring flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                )}
                            >
                                <span className='mr-3 text-lg opacity-80' aria-hidden>{item.icon}</span>
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </Card>

            <Card className='p-4 bg-muted/30 border-dashed border-border group overflow-hidden relative'>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                    <p className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1'>Workspace Mode</p>
                    <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', isAdmin ? 'bg-primary' : 'bg-green-500')}></span>
                        <p className='font-semibold text-sm'>{isAdmin ? 'Admin Mode' : 'Candidate Mode'}</p>
                    </div>
                </div>
            </Card>

            <div className="text-xs text-muted-foreground/60 px-2 pt-2 text-center">
                InternAtlas © 2026
            </div>
        </aside>
    )
}
