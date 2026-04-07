'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import InternAtlasSignIn from '../../components/ui/internatlas-signin'

function LoginContent() {
  const searchParams = useSearchParams()
  const signupSuccess = searchParams.get('signup') === 'success'

  return <InternAtlasSignIn signupSuccess={signupSuccess} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mt-8 text-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}