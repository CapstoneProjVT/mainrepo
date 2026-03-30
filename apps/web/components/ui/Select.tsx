import { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn('focus-ring h-10 w-full rounded-lg border bg-background px-3 text-sm', props.className)} />
}
