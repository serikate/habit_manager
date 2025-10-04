'use client'

import { useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { sortTasksByPriority } from '@/utils/priorityCalculator'
import TaskCard from './TaskCard'
import { format } from 'date-fns'

interface TaskListProps {
  date?: string
  showTitle?: boolean
}

export default function TaskList({ date, showTitle = true }: TaskListProps) {
  const { tasks, loading, error, fetchTasks } = useTaskStore()

  const targetDate = date || format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetchTasks(targetDate)
  }, [fetchTasks, targetDate])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-2 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">
          <strong>エラーが発生しました:</strong> {error}
        </div>
      </div>
    )
  }

  const sortedTasks = sortTasksByPriority(tasks)

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {date ? `${new Date(date).toLocaleDateString('ja-JP')} の` : '今日の'}タスクがまだありません
        </h3>
        <p className="text-gray-500 mb-6">
          習慣からタスクを作成して、計画的に実行しましょう！
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {date ? `${new Date(date).toLocaleDateString('ja-JP')} のタスク` : '今日のタスク'}
          </h2>
          <span className="text-sm text-gray-500">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length} 完了
          </span>
        </div>
      )}

      <div className="space-y-4">
        {sortedTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* 進捗サマリー */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">進捗サマリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">完了</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">実行中</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">未実行</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">達成率</div>
          </div>
        </div>
      </div>
    </div>
  )
}