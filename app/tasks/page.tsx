'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import TaskCalendar from '@/components/tasks/TaskCalendar'
import OneTimeTaskForm from '@/components/tasks/OneTimeTaskForm'
import TaskList from '@/components/tasks/TaskList'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { Plus, Calendar, List, Clock } from 'lucide-react'

export default function TasksPage() {
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const { fetchTasks, fetchOneTimeTasks } = useTaskStore()
  const { generateHabitTasks } = useHabitStore()

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">タスク管理</h1>
            <p className="mt-2 text-sm text-gray-700">
              習慣タスクと単発タスクを一元管理して、効率的に一日を過ごしましょう
            </p>
          </div>
          <div className="flex space-x-3">
            {/* 表示モード切替 */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                カレンダー
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                リスト
              </button>
            </div>

            {/* 習慣タスク生成ボタン */}
            <button
              onClick={handleGenerateHabitTasks}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Clock className="w-4 h-4" />
              <span>今日の習慣タスク生成</span>
            </button>

            {/* 単発タスク追加ボタン */}
            <button
              onClick={() => setTaskFormOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">リスト表示</h3>
            <p className="text-gray-500">リスト表示機能は今後実装予定です</p>
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