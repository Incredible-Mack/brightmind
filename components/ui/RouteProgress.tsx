'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function RouteProgress() {
  const pathname  = usePathname()
  const prevPath  = useRef(pathname)
  const [pct, setPct]         = useState(0)
  const [visible, setVisible] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }

  // Intercept clicks on internal <a> tags → start bar
  useEffect(() => {
    const onAnchorClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a')
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      if (href === pathname) return  // same-page, no navigation

      clear()
      setVisible(true)
      setPct(20)
      after(150, () => setPct(45))
      after(450, () => setPct(65))
      after(900, () => setPct(78))
    }
    document.addEventListener('click', onAnchorClick, true)
    return () => document.removeEventListener('click', onAnchorClick, true)
  }, [pathname])

  // Pathname changed → finish bar
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    clear()
    setPct(100)
    after(350, () => setVisible(false))
    after(400, () => setPct(0))
  }, [pathname])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] h-[3px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms' }}
    >
      <div
        className="h-full bg-gradient-to-r from-[#4ade80] to-[#22d3ee] rounded-r-full"
        style={{ width: `${pct}%`, transition: pct === 100 ? 'width 200ms ease-out' : 'width 400ms ease-in-out' }}
      />
      {/* glow dot at the tip */}
      {visible && pct > 0 && pct < 100 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#4ade80] shadow-[0_0_8px_2px_#4ade80aa]"
          style={{ left: `${pct}%` }}
        />
      )}
    </div>
  )
}
