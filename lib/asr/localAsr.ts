// Speech recognition that runs inside the browser (for Firefox and anything without built-in recognition).
// Free, private (the child's voice never leaves the device) and needs no server key.
// The first use downloads a ~40 MB model; after that it is cached by the browser.

export type AsrStatus = 'idle' | 'loading' | 'ready' | 'failed'

let worker: Worker | null = null
let status: AsrStatus = 'idle'
let progress = 0
let readyWaiters: Array<{ resolve: () => void; reject: (e: Error) => void }> = []
let nextId = 1
const pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>()
const listeners = new Set<(s: AsrStatus, percent: number) => void>()

const emit = () => listeners.forEach(l => l(status, progress))

/** Can this browser run it at all? */
export function localAsrSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as { Worker?: unknown; AudioContext?: unknown; webkitAudioContext?: unknown }
  return typeof WebAssembly === 'object' && Boolean(w.Worker) && Boolean(w.AudioContext ?? w.webkitAudioContext)
}

export function onAsrStatus(fn: (s: AsrStatus, percent: number) => void): () => void {
  listeners.add(fn)
  fn(status, progress)
  return () => { listeners.delete(fn) }
}

function start(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as { type: string; percent?: number; id?: number; text?: string; message?: string }
    if (m.type === 'progress') { status = 'loading'; progress = m.percent ?? progress; emit() }
    else if (m.type === 'ready') { status = 'ready'; progress = 100; emit(); readyWaiters.forEach(w => w.resolve()); readyWaiters = [] }
    else if (m.type === 'result' && m.id != null) { pending.get(m.id)?.resolve(m.text ?? ''); pending.delete(m.id) }
    else if (m.type === 'error') {
      const err = new Error(m.message ?? 'Speech model failed')
      if (m.id != null) { pending.get(m.id)?.reject(err); pending.delete(m.id) }
      else {
        status = 'failed'; emit()
        readyWaiters.forEach(w => w.reject(err)); readyWaiters = []
        worker?.terminate(); worker = null          // allow a later retry
      }
    }
  }
  worker.onerror = () => {
    status = 'failed'; emit()
    const err = new Error('Speech model could not start')
    readyWaiters.forEach(w => w.reject(err)); readyWaiters = []
    pending.forEach(p => p.reject(err)); pending.clear()
    worker?.terminate(); worker = null
  }
  return worker
}

/** Start downloading the model now, so it is ready when the child needs it. */
export function preloadLocalAsr(): Promise<void> {
  if (status === 'ready') return Promise.resolve()
  const w = start()
  if (status !== 'loading') { status = 'loading'; progress = Math.max(progress, 0); emit() }
  return new Promise<void>((resolve, reject) => {
    readyWaiters.push({ resolve, reject })
    w.postMessage({ type: 'load' })
  })
}

/** Turn a recording (webm/ogg/mp4) into 16 kHz mono samples, which is what the model reads. */
async function decodeTo16k(blob: Blob): Promise<Float32Array> {
  const Ctx = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
  const ctx = new Ctx()
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
    const length = Math.max(1, Math.ceil(decoded.duration * 16000))
    const offline = new OfflineAudioContext(1, length, 16000)
    const src = offline.createBufferSource()
    src.buffer = decoded
    src.connect(offline.destination)
    src.start()
    const rendered = await offline.startRendering()
    const samples = rendered.getChannelData(0).slice()
    let peak = 0
    for (let i = 0; i < samples.length; i++) { const v = Math.abs(samples[i]); if (v > peak) peak = v }
    // Many laptop microphones record very quietly, and the small model then hears nothing
    if (peak > 0.002 && peak < 0.6) {
      const gain = Math.min(0.9 / peak, 30)
      for (let i = 0; i < samples.length; i++) samples[i] *= gain
    }
    return samples
  } finally {
    ctx.close().catch(() => {})
  }
}

/** Words only: Whisper sometimes returns markers like [BLANK_AUDIO] or (silence). */
function clean(text: string): string {
  return text.replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/[^A-Za-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function transcribeLocally(blob: Blob): Promise<string> {
  await preloadLocalAsr()
  const audio = await decodeTo16k(blob)
  // Almost nothing recorded: do not ask the model to guess
  if (audio.length < 16000 * 0.25) return ''
  const w = start()
  const id = nextId++
  const text = await new Promise<string>((resolve, reject) => {
    pending.set(id, { resolve, reject })
    w.postMessage({ type: 'transcribe', id, audio }, [audio.buffer])
  })
  return clean(text)
}
