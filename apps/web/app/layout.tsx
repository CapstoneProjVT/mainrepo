import './globals.css'
import { AppShell } from '../components/layout/AppShell'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { ToastProvider } from '../components/ui/Toast'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
