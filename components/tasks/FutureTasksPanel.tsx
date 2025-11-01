'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { OneTimeTask } from '@/types'
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react'

interface FutureTasksPanelProps {
  tasks: OneTimeTask[]
  daysToShow: number
  onDaysChange: (days: number) => void
}

export default function FutureTasksPanel({
  tasks,
  daysToShow,
  onDaysChange
}: FutureTasksPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  // localStorageから開閉状態を読み込み
  useEffect(() => {
    const saved = localStorage.getItem('future_tasks_panel_open')
    if (saved === 'true') {
      setIsOpen(true)
    }
  }, [])

  // 開閉状態をlocalStorageに保存
  const toggleOpen = () => {
    const newState = !isOpen
    setIsOpen(newState)
    localStorage.setItem('future_tasks_panel_open', newState.toString())
  }

  // タスクを日付ごとにグループ化
  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.deadline
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(task)
    return acc
  }, {} as Record<string, OneTimeTask[]>)

  // 日付でソート
  const sortedDates = Object.keys(groupedTasks).sort()

  // タスクが0件の場合は非表示
  if (tasks.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={toggleOpen}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            今週の予定 (明日〜{daysToShow}日後)
          </h3>
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {tasks.length}件
          </span>
        </div>

        <select
          value={daysToShow}
          onChange={(e) => {
            e.stopPropagation() // 親のクリックイベントを防ぐ
            onDaysChange(parseInt(e.target.value, 10))
          }}
          onClick={(e) => e.stopPropagation()} // 親のクリックイベントを防ぐ
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={3}>3日後まで</option>
          <option value={7}>7日後まで</option>
          <option value={14}>14日後まで</option>
          <option value={30}>30日後まで</option>
        </select>
      </button>

      {isOpen && (
        <div className="px-6 py-4 border-t border-gray-200 space-y-4">
          {sortedDates.map((date) => {
            const dateTasks = groupedTasks[date]
            const dateObj = parseISO(date)

            if (!dateTasks) return null

            return (
              <div key={date}>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-700">
                    {format(dateObj, 'MM/dd (E)', { locale: ja })}
                  </h4>
                </div>
                <div className="space-y-2 ml-6">
                  {dateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start space-x-2 text-sm text-gray-600"
                    >
                      <span className="text-gray-400">□</span>
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
