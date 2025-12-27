'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import Sidebar from './Sidebar'
import Header from './Header'
import { TutorialProvider } from '@/components/tutorial/TutorialProvider'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { checkAuth } = useAuthStore()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const initializeTheme = useThemeStore((state) => state.initializeTheme)
  const applyUITheme = useThemeStore((state) => state.applyUITheme)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // テーマの初期化とUI適用
  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  // UIテーマ変更時に再適用
  useEffect(() => {
    applyUITheme()
  }, [applyUITheme, resolvedTheme])

  const isDark = resolvedTheme === 'dark'

  return (
    <TutorialProvider>
      <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 lg:pl-64 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TutorialProvider>
  )
}
