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
    description: '北極光のような幻想的なグラデーション',
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
    description: 'ネオングリッドが輝く近未来都市',
    unlockLevel: 10,
    gradient: 'from-cyan-400 via-fuchsia-500 to-green-400',
    previewColors: {
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#00FF88'
    }
  },
  {
    id: 'nature',
    name: 'ネイチャー',
    description: '深い森の静寂と生命の息吹',
    unlockLevel: 15,
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    previewColors: {
      primary: '#4ADE80',
      secondary: '#22C55E',
      accent: '#14B8A6'
    }
  },
  {
    id: 'sunset',
    name: 'サンセット',
    description: '地平線に沈む太陽の温かな輝き',
    unlockLevel: 20,
    gradient: 'from-orange-400 via-rose-500 to-purple-500',
    previewColors: {
      primary: '#F97316',
      secondary: '#EC4899',
      accent: '#A855F7'
    }
  },
  {
    id: 'ocean',
    name: 'オーシャン',
    description: '深海の神秘と波のアニメーション',
    unlockLevel: 25,
    gradient: 'from-blue-400 via-blue-600 to-blue-900',
    previewColors: {
      primary: '#60A5FA',
      secondary: '#3B82F6',
      accent: '#1E40AF'
    }
  },
  {
    id: 'royal',
    name: 'ロイヤル',
    description: '黄金と紫の煌めく王者のテーマ',
    unlockLevel: 30,
    gradient: 'from-yellow-400 via-amber-500 to-purple-600',
    previewColors: {
      primary: '#FFD700',
      secondary: '#F59E0B',
      accent: '#7C3AED'
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
