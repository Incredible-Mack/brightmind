import { clearToken } from './auth'
import { useAppStore } from '@/store/useAppStore'

// Sign out completely: the token AND everything remembered about the child on this device,
// so the next person to log in never sees the previous child's XP, hearts or name.
export function signOut(router: { push: (href: string) => void }) {
  clearToken()
  useAppStore.getState().clearAll()
  router.push('/login')
}
