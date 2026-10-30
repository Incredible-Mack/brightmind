'use client'
import { useEffect, useRef } from 'react'

// Runs `refetch` when the tab becomes visible or the window regains focus,
// so lists never need a manual reload after finishing a lesson elsewhere.
export function useRefetchOnFocus(refetch: () => void) {
  const ref = useRef(refetch)
  ref.current = refetch

  useEffect(() => {
    let last = Date.now()
    const run = () => {
      // ignore bursts (focus + visibilitychange fire together)
      if (Date.now() - last < 1500) return
      last = Date.now()
      ref.current()
    }
    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    window.addEventListener('focus', run)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', run)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
