import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-sm font-semibold text-muted-foreground', className)} {...props} />
}
