'use client'

import Link from 'next/link'

export function GuestActions() {
  return (
    <div className='flex items-center gap-2'>
      <Link
        href='/login'
        className='rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted'
      >
        Login
      </Link>

      <Link
        href='/signup'
        className='rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90'
      >
        Sign Up
      </Link>
    </div>
  )
}