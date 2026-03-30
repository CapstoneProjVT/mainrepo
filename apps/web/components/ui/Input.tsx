import { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'focus-ring h-10 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  )
}
