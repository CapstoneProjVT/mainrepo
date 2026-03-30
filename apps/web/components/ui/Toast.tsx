'use client'
import { createContext, useContext, useMemo, useState } from 'react'

type ToastFn = (message: string) => void
const ToastContext = createContext<ToastFn>(() => {})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  const show = (value: string) => {
    setMessage(value)
    window.setTimeout(() => setMessage(''), 2200)
  }
  const value = useMemo(() => show, [])
  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? <div className='fixed bottom-5 right-5 z-[70] rounded-lg border bg-card px-4 py-3 text-sm shadow-card'>✅ {message}</div> : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
