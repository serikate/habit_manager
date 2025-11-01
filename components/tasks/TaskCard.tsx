'use client'

import { useState } from 'react'
import { Play, CheckCircle, Clock, Calendar, AlertTriangle, Trash2 } from 'lucide-react'
import type { DailyTask } from '@/types'
import { useTaskStore } from '@/stores/taskStore'
import { calculatePriority } from '@/utils/priorityCalculator'

interface TaskCardProps {
  task: DailyTask
}

export default function TaskCard({ task }: TaskCardProps) {
  const { startTask, completeTask, deleteTask } = useTaskStore()
  const [executing, setExecuting] = useState(false)
  const [actualDuration, setActualDuration] = useState(task.estimated_duration)
  const [showCompleteForm, setShowCompleteForm] = useState(false)

  const priorityInfo = calculatePriority(task.importance, task.deadline)

  const handleStart = async () => {
    await startTask(task.id)
  }

  const handleComplete = async () => {
    setExecuting(true)
    try {
      const success = await completeTask(task.id)
      if (success) {
        setShowCompleteForm(false)
      }
    } finally {
      setExecuting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`「${task.habit?.name}」のタスクを削除しますか？`)) return
    await deleteTask(task.id)
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (task.status) {
      case 'completed':
        return '完了'
      case 'in_progress':
        return '実行中'
      case 'skipped':
        return 'スキップ'
      default:
        return '未実行'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {task.habit?.category && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.habit.category.color }}
              />
            )}
            <h3 className="text-lg font-medium text-gray-900">{task.habit?.name}</h3>
            {task.is_recurring && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                習慣
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{task.estimated_duration}分</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(task.date).toLocaleDateString('ja-JP')}</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityInfo.color}`}>
              優先度 {priorityInfo.priority}
            </span>
          </div>

          {task.deadline && (
            <div className="flex items-center space-x-1 text-sm text-orange-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>期限: {new Date(task.deadline).toLocaleString('ja-JP')}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          {task.status === 'pending' && (
            <button
              onClick={handleStart}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="開始"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {(task.status === 'pending' || task.status === 'in_progress') && (
            <button
              onClick={() => setShowCompleteForm(true)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="完了"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {task.status === 'pending' && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showCompleteForm && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">タスク完了</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                実際の実行時間（分）
              </label>
              <input
                type="number"
                value={actualDuration}
                onChange={(e) => setActualDuration(Number(e.target.value))}
                min="1"
                max="480"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleComplete}
                disabled={executing}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {executing ? '完了中...' : '完了'}
              </button>
              <button
                onClick={() => setShowCompleteForm(false)}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}