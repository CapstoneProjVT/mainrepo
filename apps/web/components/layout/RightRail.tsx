'use client'

import Link from 'next/link'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export function RightRail() {
    return (
        <div className='hidden lg:flex flex-col space-y-4'>
            <Card className='p-5 shadow-sm bg-card border-border'>
                <div className="flex items-center justify-between mb-4">
                    <p className='text-sm font-bold text-foreground'>Network Snapshot</p>
                    <span className="text-lg opacity-60">📈</span>
                </div>
                <ul className='space-y-3 text-sm text-muted-foreground'>
                    <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">3 profiles</strong> viewed this week.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">2 saved</strong> ops matched your top skills.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Keep applying to improve confidence.</span>
                    </li>
                </ul>
                <Link href="/tracker"><Button variant="outline" className="w-full mt-4 text-xs font-medium h-8">View Detailed Stats</Button></Link>
            </Card>

            <Card className='p-5 shadow-sm bg-card border-border'>
                <div className="flex items-center justify-between mb-3">
                    <p className='text-sm font-bold text-foreground'>Trending Skills</p>
                    <span className="text-lg opacity-60">🔥</span>
                </div>
                <div className='flex flex-wrap gap-2 text-xs'>
                    {['backend', 'startup', 'typescript', 'remote', 'ml'].map((tag) => (
                        <span
                            key={tag}
                            className='rounded border bg-muted/30 px-2.5 py-1 font-medium text-foreground hover:bg-muted/80 hover:border-border cursor-pointer transition-colors'
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </Card>
        </div>
    )
}
