import { ReactNode } from 'react'
import { Button } from './Button'

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4'>
      <div role='dialog' aria-modal='true' className='w-full max-w-lg rounded-xl border bg-card p-6 shadow-card'>
        <div className='mb-4 flex items-center justify-between'>
          <h2>{title}</h2>
          <Button variant='ghost' size='sm' onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  )
}
