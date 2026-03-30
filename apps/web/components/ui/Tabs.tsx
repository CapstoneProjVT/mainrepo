'use client'
import { ReactNode, useState } from 'react'
import { cn } from '../../lib/utils'

export function Tabs({ tabs }: { tabs: Array<{ id: string; label: string; content: ReactNode }> }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const current = tabs.find((item) => item.id === active)
  return (
    <div>
      <div className='mb-3 flex gap-2'>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActive(tab.id)} className={cn('focus-ring rounded-lg border px-3 py-1 text-sm', active === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {tab.label}
          </button>
        ))}
      </div>
      {current?.content}
    </div>
  )
}
