import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'
import { AITierBadge } from '@/components/ui/AITierBadge'
import { RouteProgress } from '@/components/ui/RouteProgress'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BrightMind — Learning Made Fun',
  description: 'Gamified AI-powered learning platform for children aged 0–14',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="bg-[#1a1f2e] text-white font-nunito min-h-screen antialiased">
        <RouteProgress />
        {children}
        <ToastContainer />
        <AITierBadge />
      </body>
    </html>
  )
}
