import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
  clearInvalidSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Sign out error (ignored):', error)
    }
    set({ user: null })
  },

  clearInvalidSession: async () => {
    const supabase = createClient()
    try {
      // ローカルのセッションデータをクリア
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      console.warn('Clear session error (ignored):', error)
    }
    set({ user: null, loading: false })
  },

  checkAuth: async () => {
    const { initialized } = get()
    const supabase = createClient()

    // 初回のみloadingをtrueに
    if (!initialized) {
      set({ loading: true })
    }

    try {
      // まずセッションを取得してみる
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        // セッション取得エラー（リフレッシュトークン無効など）
        console.warn('Session error, clearing invalid session:', sessionError.message)
        await get().clearInvalidSession()
        set({ initialized: true })
        return
      }

      if (!session) {
        // セッションがない場合
        set({ user: null, loading: false, initialized: true })
        return
      }

      // セッションがある場合、ユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.warn('User fetch error, clearing session:', userError.message)
        await get().clearInvalidSession()
        set({ initialized: true })
        return
      }

      set({ user, loading: false, initialized: true })
    } catch (error) {
      // ネットワークエラーなど
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('Network error during auth check, clearing invalid session')
        await get().clearInvalidSession()
      } else {
        console.error('Auth check error:', error)
        set({ user: null, loading: false })
      }
      set({ initialized: true })
    }
  },
}))