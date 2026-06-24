import Link from 'next/link'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex items-end gap-4 mb-8 justify-center">
        <Pip size="lg" mood="thinking" animate="idle" />
        <SpeechBubble text="Hmm, I cannot find that page. Let us go back!" />
      </div>
      <h1 className="text-6xl font-extrabold text-white font-nunito mb-3">404</h1>
      <p className="text-slate-400 font-nunito mb-8">That page does not seem to exist.</p>
      <Link href="/dashboard">
        <Button size="lg">Go to Dashboard</Button>
      </Link>
    </div>
  )
}
