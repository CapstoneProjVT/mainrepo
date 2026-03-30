import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Drawer({ open, title, children, onClose, side = 'right' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; side?: 'right' | 'left' }) {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 bg-foreground/50'>
      <button aria-label='Close drawer backdrop' className='h-full w-full' onClick={onClose} />
      <aside role='dialog' aria-modal='true' className={cn('absolute top-0 h-full w-full max-w-md border bg-card p-5 shadow-card sm:w-[420px]', side === 'right' ? 'right-0' : 'left-0')}>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg'>{title}</h2>
          <button className='focus-ring rounded-md px-2 py-1 text-sm hover:bg-muted' onClick={onClose}>Close</button>
        </div>
        {children}
      </aside>
    </div>
  )
}
