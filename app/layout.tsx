import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'
import { AITierBadge } from '@/components/ui/AITierBadge'
import { RouteProgress } from '@/components/ui/RouteProgress'

export const metadata: Metadata = {
  title: 'Bright Steps — Learning Made Fun',
  description: 'Gamified AI-powered learning platform for children aged 0–14',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f8f6fc] text-slate-800 font-nunito min-h-screen antialiased selection:bg-purple-200 selection:text-purple-900">
        <RouteProgress />
        {children}
        <ToastContainer />
        <AITierBadge />
      </body>
    </html>
  )
}
