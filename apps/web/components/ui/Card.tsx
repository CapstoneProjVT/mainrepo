import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border bg-card p-4 text-card-foreground shadow-card', className)} {...props} />
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('space-y-3', className)} {...props} />
}

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 md:px-6', className)} {...props} />
}
