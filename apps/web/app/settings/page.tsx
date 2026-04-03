'use client'

import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useRouter } from 'next/navigation'

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  autoComplete: string
}) {
  return (
    <div>
      <p className='mb-2 text-sm font-medium'>{label}</p>
      <div className='relative'>
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className='pr-16'
        />
        <button
          type='button'
          onClick={onToggle}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const MIN_PASSWORD_LENGTH = 6

  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const toast = useToast()

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail') || ''
    setEmail(savedEmail)
  }, [])

  const handleSavePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast('Please fill out all password fields')
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast(`New password must be at least ${MIN_PASSWORD_LENGTH} characters long`)
      return
    }

    if (newPassword !== confirmPassword) {
      toast('New passwords do not match')
      return
    }

    toast('Password change UI saved (backend not connected yet)')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userEmail')
    router.replace('/login')
  }

  return (
    <div className='mx-auto max-w-2xl space-y-4'>
      <h1>Settings</h1>

      <Card className='space-y-3'>
        <div>
          <h2 className='text-lg font-semibold'>Account</h2>
          <p className='text-sm text-muted-foreground'>
            Manage your account information.
          </p>
        </div>

        <div>
          <p className='mb-2 text-sm font-medium'>Email</p>
          <Input value={email} readOnly autoComplete='off' />
        </div>

        <div>
          <p className='mb-2 text-sm font-medium'>User Mode</p>
          <Input value='Candidate' readOnly autoComplete='off' />
        </div>
      </Card>

      <Card className='space-y-3'>
        <div>
          <h2 className='text-lg font-semibold'>Security</h2>
          <p className='text-sm text-muted-foreground'>
            Update your password.
          </p>
        </div>

        <PasswordField
          label='Current Password'
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrentPassword}
          onToggle={() => setShowCurrentPassword((prev) => !prev)}
          autoComplete='current-password'
        />

        <PasswordField
          label='New Password'
          value={newPassword}
          onChange={setNewPassword}
          show={showNewPassword}
          onToggle={() => setShowNewPassword((prev) => !prev)}
          autoComplete='new-password'
        />

        <PasswordField
          label='Confirm New Password'
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((prev) => !prev)}
          autoComplete='new-password'
        />

        <Button onClick={handleSavePassword}>Save Password</Button>
      </Card>

      <Card className='space-y-3'>
        <div>
          <h2 className='text-lg font-semibold'>Session</h2>
          <p className='text-sm text-muted-foreground'>
            Sign out from your current session.
          </p>
        </div>

        <Button variant='danger' onClick={handleLogout}>
          Log Out
        </Button>
      </Card>
    </div>
  )
}