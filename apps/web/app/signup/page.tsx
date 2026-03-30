'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const router = useRouter()

  return (
    <Card className='mx-auto mt-8 max-w-md space-y-3'>
      <h1>Create your account</h1>

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
          autoComplete='new-password'
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
        onClick={async () => {
          try {
            await api.signup({ email, password })
            router.push('/login?signup=success')
          }
          catch (e: any) {
            setErr(e.message)
          }
        }}
      >
        Create account
      </Button>

      {err ? <p className='text-sm text-danger'>{err}</p> : null}
    </Card>
  )
}