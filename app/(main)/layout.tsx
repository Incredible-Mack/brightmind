import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
