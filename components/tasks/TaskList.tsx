'use client'

import { useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import type { DailyTask, OneTimeTask } from '@/types'
import { Clock, AlertCircle, Edit2 } from 'lucide-react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import {
  getScheduledTimeRange,
  getActualTimeRange,
  getAchievementColor
} from '@/utils/timeCalculator'
import EditExecutionModal from './EditExecutionModal'

interface TaskListProps {
  showTitle?: boolean
}

export default function TaskList({ showTitle = true }: TaskListProps) {
  const { todayTasks, oneTimeTasks, startTask, completeTask } = useTaskStore()
  const [editingExecution, setEditingExecution] = useState<{
    execution: any
    task: DailyTask
  } | null>(null)

  // 今日以前が期限の単発タスクをフィルタリング
  const today = startOfDay(new Date())
  const todayOrPastOneTimeTasks = oneTimeTasks.filter((task) => {
    if (task.status === 'completed') return false
    if (!task.deadline) return false

    const deadline = parseISO(task.deadline)
    return deadline <= today
  })

  // 習慣タスクと単発タスクを統合
  const allTasks = [
    ...todayTasks.map((t) => ({ ...t, taskType: 'habit' as const })),
    ...todayOrPastOneTimeTasks.map((t) => ({ ...t, taskType: 'oneTime' as const }))
  ]

  // 時系列でソート
  const sortedTasks = allTasks.sort((a, b) => {
    const timeA = 'scheduled_time' in a && a.scheduled_time ? a.scheduled_time : '23:59'
    const timeB = 'scheduled_time' in b && b.scheduled_time ? b.scheduled_time : '23:59'
    return timeA.localeCompare(timeB)
  })

  // 期限超過かどうかを判定
  const isOverdue = (task: any) => {
    if (task.taskType === 'habit') return false
    if (!task.deadline) return false

    const deadline = parseISO(task.deadline)
    return isBefore(deadline, today)
  }

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-500">今日のタスクはありません</p>
        <p className="text-sm text-gray-400 mt-2">
          素晴らしい！のんびり過ごしましょう 🌟
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900">
          今日のタスク ({sortedTasks.length}件)
        </h3>
      )}

      {sortedTasks.map((task) => {
        const overdue = isOverdue(task)

        return (
          <div
            key={task.id}
            className={`p-4 border rounded-lg transition-all ${
              task.status === 'completed'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-300 hover:border-primary-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {overdue && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <h4
                    className={`font-medium ${
                      task.status === 'completed'
                        ? 'text-gray-400 line-through'
                        : overdue
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {task.taskType === 'habit' && task.habit
                      ? task.habit.name
                      : task.taskType === 'oneTime'
                      ? (task as any).title
                      : 'No title'}
                  </h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {task.taskType === 'habit' ? '習慣' : '単発'}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {/* 予定時間の表示（習慣タスクのみ） */}
                  {task.taskType === 'habit' && (() => {
                    const scheduledTime = getScheduledTimeRange(
                      task.scheduled_time,
                      task.estimated_duration
                    )
                    return (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>予定: {scheduledTime}</span>
                      </div>
                    )
                  })()}

                  {/* 実績時間の表示（完了済みのみ） */}
                  {task.status === 'completed' && task.taskType === 'habit' && task.executions?.[0] && (() => {
                    const execution = task.executions[0]
                    const actualTime = getActualTimeRange(execution.started_at, execution.completed_at)
                    const achievementColor = getAchievementColor(execution.achievement_rate)
                    return (
                      <div className="flex items-center space-x-1">
                        <span className={achievementColor}>
                          ✅ 実績: {actualTime} 達成率{execution.achievement_rate.toFixed(0)}%
                        </span>
                      </div>
                    )
                  })()}

                  {/* 予定時間なしの場合は所要時間のみ */}
                  {task.taskType === 'habit' && !task.scheduled_time && task.status !== 'completed' && (
                    <span>{task.estimated_duration}分</span>
                  )}

                  {overdue && (
                    <span className="text-red-500 font-medium">期限超過</span>
                  )}
                </div>
              </div>

              {/* 編集ボタン（完了後のみ） */}
              {task.status === 'completed' && task.taskType === 'habit' && task.executions?.[0] && (
                <button
                  onClick={() => setEditingExecution({ execution: task.executions![0], task })}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center space-x-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>編集</span>
                </button>
              )}

              {task.status !== 'completed' && (
                <div className="flex space-x-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => startTask(task.id)}
                      className="px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100"
                    >
                      開始
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => completeTask(task.id)}
                      className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                    >
                      完了
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* 編集モーダル */}
      {editingExecution && (
        <EditExecutionModal
          isOpen={true}
          onClose={() => setEditingExecution(null)}
          execution={editingExecution.execution}
          task={editingExecution.task}
        />
      )}
    </div>
  )
}
