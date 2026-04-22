import { ReactNode } from 'react'
import { Button } from './Button'

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4'>
      <div role='dialog' aria-modal='true' className='flex w-full max-w-lg flex-col rounded-xl border bg-card shadow-card' style={{ maxHeight: 'calc(100dvh - 2rem)' }}>
        <div className='flex shrink-0 items-center justify-between border-b p-6 pb-4'>
          <h2>{title}</h2>
          <Button variant='ghost' size='sm' onClick={onClose}>Close</Button>
        </div>
        <div className='overflow-y-auto p-6'>
          {children}
        </div>
      </div>
    </div>
  )
}
