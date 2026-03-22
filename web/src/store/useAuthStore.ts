'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/services/authClient'

interface AuthState {
  user: AuthUser | null
  idToken: string | null
  refreshToken: string | null
  isHydrated: boolean
  setSession: (p: { user: AuthUser; idToken: string; refreshToken: string }) => void
  clearSession: () => void
  setHydrated: (v: boolean) => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, idToken: null, refreshToken: null, isHydrated: false,
      setSession: ({ user, idToken, refreshToken }) => set({ user, idToken, refreshToken }),
      clearSession: () => set({ user: null, idToken: null, refreshToken: null }),
      setHydrated: (v) => set({ isHydrated: v }),
    }),
    {
      name: 'lesead-auth',
      partialize: (s) => ({ user: s.user, idToken: s.idToken, refreshToken: s.refreshToken }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
)

export default useAuthStore
