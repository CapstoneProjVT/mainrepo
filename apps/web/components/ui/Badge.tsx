import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground', className)} {...props} />
}
