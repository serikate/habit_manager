'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import TaskCalendar from '@/components/tasks/TaskCalendar'
import OneTimeTaskForm from '@/components/tasks/OneTimeTaskForm'
import TaskList from '@/components/tasks/TaskList'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { useThemeStore } from '@/stores/themeStore'
import { Plus, Calendar, List, Clock } from 'lucide-react'

export default function TasksPage() {
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const { fetchTasks, fetchOneTimeTasks } = useTaskStore()
  const { generateHabitTasks } = useHabitStore()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    fetchTasks()
    fetchOneTimeTasks()
  }, [fetchTasks, fetchOneTimeTasks])

  const handleGenerateHabitTasks = async () => {
    try {
      const tasks = await generateHabitTasks('today')
      if (tasks.length > 0) {
        console.log(`✅ 今日の習慣タスクを${tasks.length}件生成しました`)
        fetchTasks() // タスクリストを更新
      } else {
        console.log('📋 今日の習慣タスクは既に生成済みです')
      }
    } catch (error) {
      console.error('習慣タスク生成エラー:', error)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>タスク管理</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              習慣タスクと単発タスクを一元管理して、効率的に一日を過ごしましょう
            </p>
          </div>
          <div className="flex space-x-3">
            {/* 表示モード切替 */}
            <div className={`flex rounded-xl p-1 ${isDark ? 'bg-surface-800' : 'bg-surface-100'}`}>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? isDark
                      ? 'bg-surface-700 text-white shadow-sm'
                      : 'bg-white text-surface-900 shadow-sm'
                    : isDark
                      ? 'text-surface-400 hover:text-white'
                      : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1.5" />
                カレンダー
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? isDark
                      ? 'bg-surface-700 text-white shadow-sm'
                      : 'bg-white text-surface-900 shadow-sm'
                    : isDark
                      ? 'text-surface-400 hover:text-white'
                      : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                <List className="w-4 h-4 inline mr-1.5" />
                リスト
              </button>
            </div>

            {/* 習慣タスク生成ボタン */}
            <button
              onClick={handleGenerateHabitTasks}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                isDark
                  ? 'text-accent-400 bg-accent-500/10 border border-accent-500/30 hover:bg-accent-500/20'
                  : 'text-accent-700 bg-accent-50 border border-accent-200 hover:bg-accent-100'
              } focus:outline-none focus:ring-2 focus:ring-accent-500`}
            >
              <Clock className="w-4 h-4" />
              <span>今日の習慣タスク生成</span>
            </button>

            {/* 単発タスク追加ボタン */}
            <button
              onClick={() => setTaskFormOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 btn-hover"
            >
              <Plus className="w-4 h-4" />
              <span>単発タスク追加</span>
            </button>
          </div>
        </div>

        {/* 表示モードによる切り替え */}
        {viewMode === 'calendar' ? (
          <TaskCalendar />
        ) : (
          <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <div className="text-6xl mb-4">📋</div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>リスト表示</h3>
            <p className={isDark ? 'text-surface-400' : 'text-surface-500'}>リスト表示機能は今後実装予定です</p>
          </div>
        )}

        {/* 単発タスク追加フォーム */}
        <OneTimeTaskForm
          isOpen={taskFormOpen}
          onClose={() => setTaskFormOpen(false)}
          onSuccess={() => {
            fetchOneTimeTasks()
          }}
        />
      </div>
    </MainLayout>
  )
}
