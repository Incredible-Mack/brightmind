'use client'
import { motion } from 'framer-motion'
import { imageSrc } from '@/lib/media'

// A real picture for a lesson (shown instead of an emoji).
export function ActivityImage({ path, alt = '', size = 'lg' }: { path: string; alt?: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'sm' ? 'max-h-20' : size === 'md' ? 'max-h-40' : 'max-h-64'
  return (
    <motion.img
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      src={imageSrc(path)} alt={alt}
      className={`${h} w-auto max-w-full object-contain rounded-2xl bg-white/5`}
      draggable={false}
    />
  )
}
