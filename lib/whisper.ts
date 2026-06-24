export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type || 'audio/webm' })
  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  })
  return response.text
}
