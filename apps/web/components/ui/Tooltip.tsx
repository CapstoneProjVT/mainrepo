'use client'

import { ReactNode } from 'react'

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className='group relative inline-flex'>
      {children}
      <span className='pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition group-hover:opacity-100'>
        {text}
      </span>
    </span>
  )
}
