// Pictures uploaded by admins live on the API server and are referenced by a path like /uploads/images/abc.png
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/brightmind-api'

export function imageSrc(path: string | null | undefined): string {
  if (!path) return ''
  return /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

/** The picture attached to an activity, if any (content.image). */
export function activityImage(content: Record<string, unknown> | undefined): string | null {
  const v = content?.image
  return typeof v === 'string' && v ? v : null
}

/** Pictures for answer options, keyed by the option's text (content.option_images). */
export function optionImages(content: Record<string, unknown> | undefined): Record<string, string> {
  const v = content?.option_images
  return v && typeof v === 'object' ? (v as Record<string, string>) : {}
}

/** Remove emoji from shown text once a real picture replaces them. */
export function stripEmoji(text: string): string {
  return text
    .replace(/(?:[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2190-\u21FF\u2300-\u23FF\u25AA-\u25FE\u2600-\u27BF\u2934\u2935\u2B00-\u2BFF\u3030\u303D\u3297\u3299\u20E3\uFE0F\u200D])/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim()
}
