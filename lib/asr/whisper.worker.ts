// Runs speech recognition in a background thread so the lesson never freezes while the model works.
// The model (Whisper "tiny", English only, about 40 MB) is downloaded once, then kept by the browser.
import { pipeline, env } from '@xenova/transformers'

env.allowLocalModels = false   // fetch from the hub (and cache in the browser)
env.useBrowserCache = true

type Msg =
  | { type: 'load' }
  | { type: 'transcribe'; id: number; audio: Float32Array }

const ctx = self as unknown as {
  postMessage: (m: unknown) => void
  onmessage: ((e: MessageEvent<Msg>) => void) | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognizer: any = null
let loading: Promise<void> | null = null

function load(): Promise<void> {
  if (recognizer) return Promise.resolve()
  if (loading) return loading
  const files = new Map<string, { loaded: number; total: number }>()
  loading = (async () => {
    recognizer = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      quantized: true,
      progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status === 'progress' && p.file && p.total) {
          files.set(p.file, { loaded: p.loaded ?? 0, total: p.total })
          let loaded = 0, total = 0
          files.forEach(f => { loaded += f.loaded; total += f.total })
          ctx.postMessage({ type: 'progress', percent: total ? Math.min(99, Math.round((loaded / total) * 100)) : 0 })
        }
      },
    })
    ctx.postMessage({ type: 'ready' })
  })().catch(err => {
    loading = null
    ctx.postMessage({ type: 'error', message: String(err?.message ?? err) })
    throw err
  })
  return loading
}

ctx.onmessage = async (e: MessageEvent<Msg>) => {
  const msg = e.data
  try {
    if (msg.type === 'load') { await load(); return }
    if (msg.type === 'transcribe') {
      await load()
      const out = await recognizer(msg.audio, { chunk_length_s: 30, stride_length_s: 5 })
      ctx.postMessage({ type: 'result', id: msg.id, text: String(out?.text ?? '') })
    }
  } catch (err) {
    ctx.postMessage({ type: 'error', id: (msg as { id?: number }).id, message: String((err as Error)?.message ?? err) })
  }
}
