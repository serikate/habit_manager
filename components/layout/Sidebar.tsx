'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Home,
  Settings,
  Target,
  TrendingUp,
  Menu,
  X,
  Flag,
  Sparkles
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'
import { tutorialEvents, type TutorialEventType } from '@/lib/tutorialEvents'

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: Home, tutorialId: 'sidebar-dashboard' },
  { name: '目標管理', href: '/goals', icon: Flag, tutorialId: 'sidebar-goals' },
  { name: '習慣管理', href: '/habits', icon: Target, tutorialId: 'sidebar-habits' },
  { name: 'タスク登録', href: '/tasks', icon: CheckSquare, tutorialId: 'sidebar-tasks' },
  { name: '統計・レポート', href: '/statistics', icon: BarChart3, tutorialId: 'sidebar-stats' },
  { name: 'レビュー', href: '/review', icon: TrendingUp, tutorialId: 'sidebar-review' },
  { name: '設定', href: '/settings', icon: Settings, tutorialId: 'sidebar-settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarTheme = useThemeStore((state) => state.sidebarTheme)

  const isDark = sidebarTheme === 'dark'

  // チュートリアルイベントをリッスンしてサイドバーを開閉
  useEffect(() => {
    const unsubscribe = tutorialEvents.subscribe((eventType: TutorialEventType) => {
      if (eventType === 'open-sidebar') {
        setSidebarOpen(true)
      } else if (eventType === 'close-sidebar') {
        setSidebarOpen(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // テーマに応じたスタイル
  const containerStyles = isDark
    ? 'bg-surface-900'
    : 'bg-white border-r border-surface-200'

  const logoTextStyles = isDark
    ? 'text-white'
    : 'text-surface-900'

  const navItemStyles = (isActive: boolean) => {
    if (isDark) {
      return isActive
        ? 'bg-primary-500/15 text-primary-300'
        : 'text-surface-400 hover:bg-surface-800 hover:text-white'
    }
    return isActive
      ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
  }

  const activeIndicatorStyles = isDark
    ? 'bg-primary-400'
    : 'bg-primary-500'

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`fixed top-0 left-0 z-40 w-72 h-full ${containerStyles} shadow-2xl animate-slide-in-left`}>
          {/* Mobile Header */}
          <div className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className={`text-lg font-bold tracking-tight ${logoTextStyles}`}>
                HabitFlow
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'text-surface-400 hover:bg-surface-800' : 'text-surface-500 hover:bg-surface-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="mt-4 px-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-tutorial={item.tutorialId}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 my-1 rounded-xl
                    text-sm font-medium transition-all duration-200
                    ${navItemStyles(isActive)}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className={`w-1.5 h-1.5 rounded-full ${activeIndicatorStyles}`} />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
        <div className={`flex flex-col flex-grow ${containerStyles}`}>
          {/* Logo */}
          <div className={`flex items-center gap-3 px-6 py-6 border-b ${isDark ? 'border-surface-800' : 'border-surface-200'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold tracking-tight ${logoTextStyles}`}>
                HabitFlow
              </h1>
              <p className={`text-xs ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                習慣で人生を変える
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 px-3">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-3 px-4 ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>
              メニュー
            </div>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-tutorial={item.tutorialId}
                  className={`
                    flex items-center gap-3 px-4 py-3 my-1 rounded-xl
                    text-sm font-medium transition-all duration-200
                    ${navItemStyles(isActive)}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className={`w-1.5 h-1.5 rounded-full ${activeIndicatorStyles}`} />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className={`p-4 mx-3 mb-4 rounded-xl ${isDark ? 'bg-surface-800/50' : 'bg-surface-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-surface-700' : 'bg-surface-200'} flex items-center justify-center`}>
                <Calendar className={`w-4 h-4 ${isDark ? 'text-surface-400' : 'text-surface-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                  今日も頑張ろう
                </p>
                <p className={`text-xs ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                  {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 rounded-xl bg-white shadow-lg shadow-surface-900/10 text-surface-700 hover:bg-surface-50 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  )
}
