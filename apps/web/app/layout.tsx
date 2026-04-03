import './globals.css'
import Script from 'next/script'
import { AppShell } from '../components/layout/AppShell'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { ToastProvider } from '../components/ui/Toast'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <Script id='theme-init' strategy='beforeInteractive'>
          {`
            (function () {
              try {
                var storedTheme = localStorage.getItem('internatlas-theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = storedTheme || (prefersDark ? 'dark' : 'light');

                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `}
        </Script>

        <ThemeProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}