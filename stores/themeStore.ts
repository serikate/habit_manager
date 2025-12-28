'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type SidebarTheme = 'light' | 'dark'
export type UITheme = 'default' | 'aurora' | 'cyber' | 'nature' | 'sunset' | 'ocean' | 'royal'

// UIテーマの定義
export interface UIThemeDefinition {
  id: UITheme
  name: string
  description: string
  unlockLevel: number
  gradient: string
  previewColors: {
    primary: string
    secondary: string
    accent: string
  }
}

export const UI_THEMES: UIThemeDefinition[] = [
  {
    id: 'default',
    name: 'デフォルト',
    description: '標準のIndigo配色',
    unlockLevel: 1,
    gradient: 'from-indigo-400 to-purple-500',
    previewColors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#F59E0B'
    }
  },
  {
    id: 'aurora',
    name: 'オーロラ',
    description: 'ティール・紫・ピンクの幻想的なグラデーション',
    unlockLevel: 5,
    gradient: 'from-teal-400 via-purple-500 to-pink-500',
    previewColors: {
      primary: '#2DD4BF',
      secondary: '#A855F7',
      accent: '#F472B6'
    }
  },
  {
    id: 'cyber',
    name: 'サイバー',
    description: 'ネオンブルー・パープルの近未来的なテーマ',
    unlockLevel: 10,
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    previewColors: {
      primary: '#22D3EE',
      secondary: '#3B82F6',
      accent: '#A855F7'
    }
  },
  {
    id: 'nature',
    name: 'ネイチャー',
    description: '森と大地を感じる癒しのグリーンテーマ',
    unlockLevel: 15,
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    previewColors: {
      primary: '#34D399',
      secondary: '#22C55E',
      accent: '#14B8A6'
    }
  },
  {
    id: 'sunset',
    name: 'サンセット',
    description: '夕焼けのオレンジ・ピンクの温かみあるテーマ',
    unlockLevel: 20,
    gradient: 'from-orange-400 via-rose-500 to-pink-600',
    previewColors: {
      primary: '#FB923C',
      secondary: '#F43F5E',
      accent: '#EC4899'
    }
  },
  {
    id: 'ocean',
    name: 'オーシャン',
    description: '深海の神秘的なブルーグラデーション',
    unlockLevel: 25,
    gradient: 'from-blue-400 via-indigo-500 to-blue-800',
    previewColors: {
      primary: '#60A5FA',
      secondary: '#6366F1',
      accent: '#1E40AF'
    }
  },
  {
    id: 'royal',
    name: 'ロイヤル',
    description: '冒険者の王座、金と紫の高貴なテーマ',
    unlockLevel: 30,
    gradient: 'from-amber-400 via-yellow-500 to-purple-600',
    previewColors: {
      primary: '#FBBF24',
      secondary: '#EAB308',
      accent: '#9333EA'
    }
  }
]

interface ThemeState {
  theme: Theme
  sidebarTheme: SidebarTheme
  resolvedTheme: 'light' | 'dark'
  uiTheme: UITheme
  unlockedThemes: UITheme[]
  // 新テーマ解放通知
  newlyUnlockedTheme: UIThemeDefinition | null
  setTheme: (theme: Theme) => void
  setSidebarTheme: (theme: SidebarTheme) => void
  setUITheme: (uiTheme: UITheme) => void
  unlockTheme: (themeId: UITheme, showNotification?: boolean) => boolean
  unlockThemesForLevel: (level: number) => void
  isThemeUnlocked: (themeId: UITheme) => boolean
  initializeTheme: () => void
  applyUITheme: () => void
  clearNewlyUnlockedTheme: () => void
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarTheme: 'dark',
      resolvedTheme: 'light',
      uiTheme: 'default',
      unlockedThemes: ['default'], // デフォルトは常に解放済み
      newlyUnlockedTheme: null,

      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        set({ theme, resolvedTheme })

        // DOMにクラスを適用
        if (typeof document !== 'undefined') {
          const { uiTheme } = get()
          const allThemeClasses = ['light', 'dark', 'aurora', 'cyber', 'nature', 'sunset', 'ocean', 'royal']
          document.documentElement.classList.remove(...allThemeClasses)
          document.documentElement.classList.add(resolvedTheme)
          if (uiTheme !== 'default') {
            document.documentElement.classList.add(uiTheme)
          }
        }
      },

      setSidebarTheme: (sidebarTheme: SidebarTheme) => {
        set({ sidebarTheme })
      },

      setUITheme: (uiTheme: UITheme) => {
        const { unlockedThemes, resolvedTheme } = get()
        // 解放済みテーマのみ選択可能
        if (!unlockedThemes.includes(uiTheme)) {
          console.warn(`Theme "${uiTheme}" is not unlocked yet.`)
          return
        }

        set({ uiTheme })

        // DOMにクラスを適用
        if (typeof document !== 'undefined') {
          // 全てのUIテーマクラスを削除
          const uiThemeClasses = ['aurora', 'cyber', 'nature', 'sunset', 'ocean', 'royal']
          document.documentElement.classList.remove(...uiThemeClasses)
          // 新しいテーマを適用
          if (uiTheme !== 'default') {
            document.documentElement.classList.add(uiTheme)
          }
        }
      },

      unlockTheme: (themeId: UITheme, showNotification: boolean = true) => {
        const { unlockedThemes } = get()
        if (!unlockedThemes.includes(themeId)) {
          const themeDefinition = UI_THEMES.find(t => t.id === themeId)
          set({
            unlockedThemes: [...unlockedThemes, themeId],
            newlyUnlockedTheme: showNotification && themeDefinition ? themeDefinition : null
          })
          console.log(`🎨 New theme unlocked: ${themeId}`)
          return true
        }
        return false
      },

      unlockThemesForLevel: (level: number) => {
        const { unlockedThemes } = get()
        // レベルに応じて解放されるべき全テーマを取得
        const themesToUnlock = UI_THEMES.filter(theme =>
          theme.unlockLevel <= level && !unlockedThemes.includes(theme.id)
        )

        if (themesToUnlock.length > 0) {
          const newUnlockedIds = themesToUnlock.map(t => t.id)
          set({
            unlockedThemes: [...unlockedThemes, ...newUnlockedIds]
          })
          console.log(`🎨 Themes unlocked for level ${level}:`, newUnlockedIds)
        }
      },

      clearNewlyUnlockedTheme: () => {
        set({ newlyUnlockedTheme: null })
      },

      isThemeUnlocked: (themeId: UITheme) => {
        const { unlockedThemes } = get()
        return unlockedThemes.includes(themeId)
      },

      applyUITheme: () => {
        const { resolvedTheme, uiTheme } = get()
        if (typeof document !== 'undefined') {
          const allThemeClasses = ['light', 'dark', 'aurora', 'cyber', 'nature', 'sunset', 'ocean', 'royal']
          document.documentElement.classList.remove(...allThemeClasses)
          document.documentElement.classList.add(resolvedTheme)
          if (uiTheme !== 'default') {
            document.documentElement.classList.add(uiTheme)
          }
        }
      },

      initializeTheme: () => {
        const { theme, uiTheme } = get()
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        set({ resolvedTheme })

        const allThemeClasses = ['light', 'dark', 'aurora', 'cyber', 'nature', 'sunset', 'ocean', 'royal']

        // DOMにクラスを適用
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove(...allThemeClasses)
          document.documentElement.classList.add(resolvedTheme)
          if (uiTheme !== 'default') {
            document.documentElement.classList.add(uiTheme)
          }
        }

        // システムテーマの変更を監視
        if (typeof window !== 'undefined' && theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? 'dark' : 'light'
            set({ resolvedTheme: newTheme })
            const { uiTheme: currentUITheme } = get()
            document.documentElement.classList.remove(...allThemeClasses)
            document.documentElement.classList.add(newTheme)
            if (currentUITheme !== 'default') {
              document.documentElement.classList.add(currentUITheme)
            }
          }
          mediaQuery.addEventListener('change', handleChange)
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarTheme: state.sidebarTheme,
        uiTheme: state.uiTheme,
        unlockedThemes: state.unlockedThemes,
      }),
    }
  )
)
