import { ReactNode } from 'react'
import { Card } from './Card'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className='border-dashed text-center'>
      <svg viewBox='0 0 220 120' className='mx-auto mb-4 h-24 w-44 text-muted-foreground' aria-hidden>
        <rect y='16' width='130' height='84' rx='8' fill='currentColor' opacity='0.15' />
        <rect x='14' y='30' width='94' height='8' rx='4' fill='currentColor' opacity='0.35' />
        <rect x='14' y='46' width='70' height='8' rx='4' fill='currentColor' opacity='0.25' />
        <circle cx='157' cy='40' r='18' fill='currentColor' opacity='0.22' />
        <path d='M140 70h34v8h-34z' fill='currentColor' opacity='0.3' />
      </svg>
      <h3>{title}</h3>
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      {action ? <div className='mt-4'>{action}</div> : null}
    </Card>
  )
}
