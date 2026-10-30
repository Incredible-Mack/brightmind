'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface Pair { id: string; item: string; target: string }

interface MatchActivityProps {
  prompt?: string
  pairs: Pair[]
  disabled?: boolean
  onComplete: (allCorrect: boolean) => void
}

// Tap-to-match (works with a finger, unlike drag and drop): tap a word on the left, then its partner on the right.
export function MatchActivity({ prompt, pairs, disabled = false, onComplete }: MatchActivityProps) {
  // Right-hand column in a fixed, different order from the left so the answer is not in line
  const targets = useMemo(() => {
    const list = pairs.map(p => p.target)
    const shift = Math.max(1, Math.floor(list.length / 2))
    return list.map((_, i) => list[(i + shift) % list.length])
  }, [pairs])

  const [picked, setPicked] = useState<string | null>(null)           // selected item
  const [links, setLinks] = useState<Record<string, string>>({})      // item -> target
  const [checked, setChecked] = useState(false)

  const answerFor = (item: string) => pairs.find(p => p.item === item)?.target
  const linkedTargets = new Set(Object.values(links))

  const tapItem = (item: string) => {
    if (disabled || checked) return
    if (links[item]) {                                   // tapping a linked item unlinks it
      setLinks(prev => { const n = { ...prev }; delete n[item]; return n })
      setPicked(item)
      return
    }
    setPicked(item === picked ? null : item)
  }

  const tapTarget = (target: string) => {
    if (disabled || checked || !picked || linkedTargets.has(target)) return
    setLinks(prev => ({ ...prev, [picked]: target }))
    setPicked(null)
  }

  const allLinked = Object.keys(links).length === pairs.length

  const check = () => {
    setChecked(true)
    onComplete(pairs.every(p => links[p.item] === p.target))
  }

  const itemClass = (item: string) => {
    const linked = links[item]
    if (checked) return linked === answerFor(item)
      ? 'border-[#10b981] bg-emerald-50 text-emerald-950 border-b-4 border-b-emerald-600 shadow-sm'
      : 'border-rose-400 bg-rose-50 text-rose-950 border-b-4 border-b-rose-600 shadow-sm'
    if (picked === item) return 'border-[#10b981] bg-emerald-100 text-[#1d2445] border-b-4 border-b-emerald-600 ring-2 ring-emerald-300 shadow-md scale-105'
    if (linked) return 'border-emerald-300 bg-emerald-50 text-[#1d2445] border-b-4 border-b-emerald-500 shadow-sm'
    return 'border-slate-200 bg-white text-[#1d2445] hover:border-slate-300 border-b-4 border-b-slate-300 shadow-sm'
  }

  return (
    <div className="w-full flex flex-col gap-5">
      {prompt && <p className="text-[#1d2445] font-black text-xl font-nunito text-center">{prompt}</p>}
      <p className="text-slate-600 font-bold text-sm font-nunito text-center">Tap a word, then tap what goes with it.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {pairs.map(p => (
            <motion.button key={p.id} whileTap={{ scale: 0.97 }} onClick={() => tapItem(p.item)}
              className={`min-h-[56px] px-3 py-2 rounded-2xl border-2 font-black font-nunito text-base transition-colors ${itemClass(p.item)}`}>
              {p.item}
              {links[p.item] && <span className="block text-xs font-black text-emerald-700 mt-0.5">→ {links[p.item]}</span>}
            </motion.button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {targets.map(t => {
            const used = linkedTargets.has(t)
            return (
              <motion.button key={t} whileTap={{ scale: 0.97 }} onClick={() => tapTarget(t)}
                disabled={used && !checked}
                className={`min-h-[56px] px-4 py-3 rounded-2xl border-2 font-black font-nunito text-base transition-all ${
                  used ? 'border-slate-200 bg-slate-100 text-slate-400 border-b-2'
                  : picked ? 'border-emerald-400 bg-white hover:bg-emerald-50 text-[#1d2445] border-b-4 border-b-emerald-600 shadow-md scale-[1.02]'
                  : 'border-slate-200 bg-white text-[#1d2445] border-b-4 border-b-slate-300 shadow-sm'
                }`}>
                {t}
              </motion.button>
            )
          })}
        </div>
      </div>

      {!checked && (
        <Button fullWidth size="lg" onClick={check} disabled={!allLinked || disabled}>Check</Button>
      )}
    </div>
  )
}
