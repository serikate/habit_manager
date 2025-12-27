'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type SidebarTheme = 'light' | 'dark'
export type UITheme = 'default' | 'aurora'

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
      primary: '#2DD4BF',   // ティール
      secondary: '#A855F7', // 紫
      accent: '#F472B6'     // ピンク
    }
  }
]

interface ThemeState {
  theme: Theme
  sidebarTheme: SidebarTheme
  resolvedTheme: 'light' | 'dark'
  uiTheme: UITheme
  unlockedThemes: UITheme[]
  setTheme: (theme: Theme) => void
  setSidebarTheme: (theme: SidebarTheme) => void
  setUITheme: (uiTheme: UITheme) => void
  unlockTheme: (themeId: UITheme) => void
  isThemeUnlocked: (themeId: UITheme) => boolean
  initializeTheme: () => void
  applyUITheme: () => void
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

      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        set({ theme, resolvedTheme })

        // DOMにクラスを適用
        if (typeof document !== 'undefined') {
          const { uiTheme } = get()
          document.documentElement.classList.remove('light', 'dark', 'aurora')
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
          document.documentElement.classList.remove('aurora')
          // 新しいテーマを適用
          if (uiTheme !== 'default') {
            document.documentElement.classList.add(uiTheme)
          }
        }
      },

      unlockTheme: (themeId: UITheme) => {
        const { unlockedThemes } = get()
        if (!unlockedThemes.includes(themeId)) {
          set({ unlockedThemes: [...unlockedThemes, themeId] })
          console.log(`🎨 New theme unlocked: ${themeId}`)
        }
      },

      isThemeUnlocked: (themeId: UITheme) => {
        const { unlockedThemes } = get()
        return unlockedThemes.includes(themeId)
      },

      applyUITheme: () => {
        const { resolvedTheme, uiTheme } = get()
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark', 'aurora')
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

        // DOMにクラスを適用
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark', 'aurora')
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
            document.documentElement.classList.remove('light', 'dark', 'aurora')
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
