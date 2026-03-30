import { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('focus-ring min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground', props.className)} />
}
