'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DragDropContent } from '@/types/activity'

interface DragDropActivityProps {
  content: DragDropContent
  onComplete: (allCorrect: boolean) => void
}

export function DragDropActivity({ content, onComplete }: DragDropActivityProps) {
  const { pairs } = content
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [dragItem, setDragItem] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleDrop = (targetId: string) => {
    if (!dragItem) return
    setAssignments(prev => ({ ...prev, [targetId]: dragItem }))
    setDragItem(null)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const allCorrect = pairs.every(p => assignments[p.id] === p.item)
    onComplete(allCorrect)
  }

  const unassigned = pairs.filter(p => !Object.values(assignments).includes(p.item)).map(p => p.item)

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Draggable items */}
      <div className="flex flex-wrap gap-2 justify-center">
        {unassigned.map(item => (
          <motion.button
            key={item}
            drag
            dragSnapToOrigin
            onDragStart={() => setDragItem(item)}
            whileDrag={{ scale: 1.1, opacity: 0.9 }}
            className="bg-white shadow-md border-2 border-[#4ade80]/40 rounded-xl px-5 py-3 text-[#1d2445] font-black font-nunito cursor-grab active:cursor-grabbing"
          >
            {item}
          </motion.button>
        ))}
      </div>

      {/* Drop targets */}
      <div className="flex flex-col gap-3">
        {pairs.map(pair => {
          const assigned = assignments[pair.id]
          const correct = submitted && assigned === pair.item
          const wrong = submitted && assigned && assigned !== pair.item
          return (
            <div
              key={pair.id}
              className="flex items-center gap-4"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(pair.id)}
            >
              <div className="flex-1 text-[#1d2445] font-black font-nunito text-sm text-right pr-2">{pair.target}</div>
              <div className={`w-32 h-12 rounded-xl border-2 flex items-center justify-center font-bold font-nunito text-sm transition-colors ${
                correct ? 'border-[#22c55e] bg-[#22c55e]/20 text-[#4ade80]'
                : wrong ? 'border-red-500 bg-red-500/20 text-red-400'
                : assigned ? 'border-[#4ade80]/40 bg-white shadow-md text-white'
                : 'border-dashed border-slate-300 text-slate-400'
              }`}>
                {assigned ?? '—'}
              </div>
            </div>
          )
        })}
      </div>

      {!submitted && Object.keys(assignments).length === pairs.length && (
        <button
          onClick={handleSubmit}
          className="bg-[#22c55e] hover:bg-[#16a34a] text-[#1d2445] font-black font-nunito rounded-2xl py-3 px-8 transition-colors"
        >
          Check Answers
        </button>
      )}
    </div>
  )
}
