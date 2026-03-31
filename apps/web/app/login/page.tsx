'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const signupSuccess = searchParams.get('signup') === 'success'

  return (
    <Card className='mx-auto mt-8 max-w-md space-y-3'>
      <h1>Welcome back</h1>

      {signupSuccess && (
        <p className='text-sm text-green-600'>
          Account created successfully. Please log in.
        </p>
      )}

      <Input
        placeholder='Email'
        type='email'
        autoComplete='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className='relative'>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete='current-password'
          className='pr-16'
        />
        <button
          type='button'
          onClick={() => setShowPassword((prev) => !prev)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      <Button
        className='w-full'
        onClick={async () => {
          try {
            await api.login({ email, password })
            localStorage.setItem('isLoggedIn', 'true')
            localStorage.setItem('userEmail', email)
            window.location.href = '/opportunities'
          }
          catch (e: any) {
            setErr(e.message)
          }
        }}
      >
        Login
      </Button>

      <Link href='/signup' className='block pt-1 text-sm text-primary underline'>
        New account?
      </Link>

      {err ? <p className='text-sm text-danger'>{err}</p> : null}
    </Card>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<div className='text-center mt-8'>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}