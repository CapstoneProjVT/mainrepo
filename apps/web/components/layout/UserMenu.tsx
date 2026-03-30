'use client'

import { useState } from 'react'
import Link from 'next/link'

export function UserMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className='relative'>
      <button
        onClick={() => setOpen(!open)}
        className='flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold hover:bg-muted'
        aria-label='Open user menu'
      >
        IA
      </button>

      {open && (
        <div className='absolute right-0 mt-2 w-48 rounded-xl border bg-card p-2 shadow-lg'>
          <Link href='/settings' className='block rounded-md px-3 py-2 text-sm hover:bg-muted'>
            Settings
          </Link>

          {isAdmin && (
            <Link href='/admin' className='block rounded-md px-3 py-2 text-sm hover:bg-muted'>
              Admin
            </Link>
          )}

          <button
            onClick={() => {
              localStorage.removeItem('isLoggedIn')
              window.location.href = '/opportunities'
            }}
            className='mt-1 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted'
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}