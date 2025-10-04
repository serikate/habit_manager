'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import HabitList from '@/components/habits/HabitList'
import HabitForm from '@/components/habits/HabitForm'
import CategoryForm from '@/components/categories/CategoryForm'
import HabitTimetable from '@/components/habits/HabitTimetable'
import { useHabitStore } from '@/stores/habitStore'
import { Plus, Tag, Calendar, List } from 'lucide-react'

export default function HabitsPage() {
  const [habitFormOpen, setHabitFormOpen] = useState(false)
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'timetable'>('timetable')
  const [taskUpdateTrigger, setTaskUpdateTrigger] = useState(0)
  const { habits, fetchHabits } = useHabitStore()

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const handleHabitClick = async (habit: any, day: string, time: string) => {
    console.log('Habit clicked:', { habit: habit.name, day, time })

    try {
      const tasks = await useHabitStore.getState().generateHabitTasks('today')
      if (tasks.length > 0) {
        console.log(`✅ 今日の習慣タスクを${tasks.length}件生成しました`)
        // タスク更新をトリガー
        setTaskUpdateTrigger(prev => prev + 1)
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
            <h1 className="text-3xl font-bold text-gray-900">習慣管理</h1>
            <p className="mt-2 text-sm text-gray-700">
              継続したい習慣を登録して、レベルアップしていきましょう
            </p>
          </div>
          <div className="flex space-x-3">
            {/* 🆕 表示モード切替 */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('timetable')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'timetable'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                時間割
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
                一覧
              </button>
            </div>

            <button
              onClick={() => setCategoryFormOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Tag className="w-4 h-4" />
              <span>カテゴリ追加</span>
            </button>
            <button
              onClick={() => setHabitFormOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4" />
              <span>習慣を追加</span>
            </button>
          </div>
        </div>

        {/* 🆕 表示モードによる切り替え */}
        {viewMode === 'timetable' ? (
          <HabitTimetable
            habits={habits}
            onHabitClick={handleHabitClick}
            onTaskUpdate={() => taskUpdateTrigger}
          />
        ) : (
          <HabitList />
        )}

        <HabitForm
          isOpen={habitFormOpen}
          onClose={() => setHabitFormOpen(false)}
          onSuccess={() => {
            // Additional success handling if needed
          }}
        />

        <CategoryForm
          isOpen={categoryFormOpen}
          onClose={() => setCategoryFormOpen(false)}
          onSuccess={() => {
            // Additional success handling if needed
          }}
        />
      </div>
    </MainLayout>
  )
}