'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Flag, CheckCircle, Circle, X, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { calculateUrgency } from '@/utils/priorityCalculator'
import type { DailyTask, OneTimeTask } from '@/types'

export default function TaskCalendar() {
  const { tasks, oneTimeTasks, fetchTasks, fetchOneTimeTasks, updateOneTimeTask, deleteOneTimeTask } = useTaskStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [detailTask, setDetailTask] = useState<OneTimeTask | null>(null)
  const [editTask, setEditTask] = useState<OneTimeTask | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 日曜日始まり
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  useEffect(() => {
    fetchTasks()
    fetchOneTimeTasks()
  }, [fetchTasks, fetchOneTimeTasks])

  // 日付ごとのタスクをグループ化
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: { dailyTasks: DailyTask[], oneTimeTasks: OneTimeTask[] } } = {}

    // 習慣タスク（DailyTask）をグループ化
    tasks.forEach(task => {
      if (!grouped[task.date]) {
        grouped[task.date] = { dailyTasks: [], oneTimeTasks: [] }
      }
      grouped[task.date].dailyTasks.push(task)
    })

    // 単発タスク（OneTimeTask）をグループ化（期限日で）
    oneTimeTasks.forEach(task => {
      if (task.deadline) {
        const deadlineDate = format(new Date(task.deadline), 'yyyy-MM-dd')
        if (!grouped[deadlineDate]) {
          grouped[deadlineDate] = { dailyTasks: [], oneTimeTasks: [] }
        }
        grouped[deadlineDate].oneTimeTasks.push(task)
      }
    })

    return grouped
  }, [tasks, oneTimeTasks])

  const getPriorityColor = (importance: number, urgency: number) => {
    const priority = importance * urgency
    if (priority >= 8) return 'bg-red-100 border-red-300 text-red-800'
    if (priority >= 6) return 'bg-orange-100 border-orange-300 text-orange-800'
    if (priority >= 4) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-green-100 border-green-300 text-green-800'
  }

  const toggleOneTimeTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await updateOneTimeTask(taskId, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    })
    fetchOneTimeTasks() // 更新後にデータを再取得
  }

  const renderCalendarDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayTasks = tasksByDate[dateStr]
    const isSelected = selectedDate && isSameDay(day, selectedDate)
    const isToday = isSameDay(day, new Date())
    const isCurrentMonth = format(day, 'M') === format(currentDate, 'M')

    return (
      <div
        key={dateStr}
        onClick={() => setSelectedDate(isSelected ? null : day)}
        className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-colors ${
          isSelected ? 'bg-primary-50 border-primary-300' : 'hover:bg-gray-50'
        } ${isToday ? 'bg-blue-50 border-blue-300' : ''} ${
          !isCurrentMonth ? 'bg-gray-50' : ''
        }`}
      >
        <div className={`text-sm font-medium mb-2 ${
          isToday ? 'text-blue-800' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
        }`}>
          {format(day, 'd')}
          {isToday && <span className="ml-1 text-xs text-blue-600">今日</span>}
        </div>

        {dayTasks && (() => {
          // すべてのタスクを統合して優先度順にソート
          const allTasks = [
            ...dayTasks.dailyTasks.map(task => ({
              ...task,
              type: 'habit' as const,
              priority: 5, // 習慣タスクは中程度の優先度
              displayTime: task.scheduled_time || ''
            })),
            ...dayTasks.oneTimeTasks.map(task => ({
              ...task,
              type: 'onetime' as const,
              priority: task.importance * task.urgency,
              displayTime: format(new Date(task.deadline), 'HH:mm')
            }))
          ].sort((a, b) => b.priority - a.priority) // 優先度の高い順

          const displayTasks = allTasks.slice(0, 2)
          const remainingCount = allTasks.length - 2

          return (
            <div className="space-y-1">
              {displayTasks.map((task) => {
                if (task.type === 'habit') {
                  const habitTask = task as typeof task & DailyTask
                  return (
                    <div
                      key={habitTask.id}
                      className={`text-xs p-1 rounded border ${
                        habitTask.status === 'completed'
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-purple-100 border-purple-300 text-purple-800'
                      }`}
                    >
                      <div className="flex items-center">
                        {habitTask.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Circle className="w-3 h-3 mr-1" />
                        )}
                        <span className="truncate">
                          {habitTask.habit?.name || 'タスク'}
                        </span>
                      </div>
                    </div>
                  )
                } else {
                  const oneTimeTask = task as typeof task & OneTimeTask
                  return (
                    <div
                      key={oneTimeTask.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailTask(oneTimeTask)
                      }}
                      className={`text-xs p-1 rounded border cursor-pointer ${
                        oneTimeTask.status === 'completed'
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : getPriorityColor(oneTimeTask.importance, oneTimeTask.urgency)
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          {oneTimeTask.status === 'completed' ? (
                            <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3 h-3 mr-1 flex-shrink-0" />
                          )}
                          <span className="truncate">{oneTimeTask.title}</span>
                        </div>
                        <span className="ml-1 text-[10px] opacity-75 whitespace-nowrap">
                          {task.displayTime}まで
                        </span>
                      </div>
                    </div>
                  )
                }
              })}

              {/* 残りのタスク数表示 */}
              {remainingCount > 0 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{remainingCount}件
                </div>
              )}
            </div>
          )
        })()}
      </div>
    )
  }

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return null
    const tasks = tasksByDate[format(selectedDate, 'yyyy-MM-dd')]
    if (!tasks) return null

    // タスクを期限（時刻）順にソート
    return {
      dailyTasks: [...tasks.dailyTasks].sort((a, b) => {
        const timeA = a.scheduled_time || '00:00'
        const timeB = b.scheduled_time || '00:00'
        return timeA.localeCompare(timeB)
      }),
      oneTimeTasks: [...tasks.oneTimeTasks].sort((a, b) => {
        const timeA = new Date(a.deadline).getTime()
        const timeB = new Date(b.deadline).getTime()
        return timeA - timeB
      })
    }
  }, [selectedDate, tasksByDate])

  return (
    <div className="space-y-6">
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'yyyy年M月')}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
        >
          今月
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* カレンダーグリッド */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 bg-gray-50">
              {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダー本体 */}
            <div className="grid grid-cols-7">
              {calendarDays.map(renderCalendarDay)}
            </div>
          </div>
        </div>

        {/* 選択日詳細 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate ? format(selectedDate, 'M月d日（E）') : '日付を選択'}
            </h3>

            {selectedDayTasks ? (
              <div className="space-y-4">
                {/* 習慣タスク */}
                {selectedDayTasks.dailyTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">習慣タスク</h4>
                    <div className="space-y-2">
                      {selectedDayTasks.dailyTasks.map(task => (
                        <div
                          key={task.id}
                          className={`p-2 rounded border text-sm ${
                            task.status === 'completed'
                              ? 'bg-blue-100 border-blue-300'
                              : 'bg-purple-100 border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{task.habit?.name}</span>
                            {task.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.estimated_duration}分
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 単発タスク */}
                {selectedDayTasks.oneTimeTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">単発タスク</h4>
                    <div className="space-y-2">
                      {selectedDayTasks.oneTimeTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => toggleOneTimeTaskStatus(task.id, task.status)}
                          className={`p-2 rounded border text-sm cursor-pointer transition-colors ${
                            task.status === 'completed'
                              ? 'bg-blue-100 border-blue-300'
                              : getPriorityColor(task.importance, task.urgency)
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{task.title}</span>
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.estimated_duration}分
                            </div>
                            <div className="flex items-center">
                              <Flag className="w-3 h-3 mr-1" />
                              優先度: {task.importance * task.urgency}
                            </div>
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDayTasks.dailyTasks.length === 0 && selectedDayTasks.oneTimeTasks.length === 0 && (
                  <p className="text-sm text-gray-500">この日にはタスクがありません</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                カレンダーから日付を選択すると、その日のタスクが表示されます
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">💡 カレンダーの見方</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
            <span>習慣タスク</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span>低優先度</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
            <span>高優先度</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
            <span>完了済み</span>
          </div>
        </div>
      </div>

      {/* タスク詳細モーダル */}
      {detailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => setDetailTask(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">タスク詳細</h2>
              <button
                onClick={() => setDetailTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{detailTask.title}</h3>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {format(new Date(detailTask.deadline), 'M月d日 HH:mm')}まで
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {detailTask.estimated_duration}分
                  </div>
                </div>
              </div>

              {detailTask.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">詳細説明</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{detailTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">重要度</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    detailTask.importance === 3 ? 'bg-red-100 text-red-800' :
                    detailTask.importance === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {detailTask.importance === 3 ? '高' : detailTask.importance === 2 ? '中' : '低'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">緊急度</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    detailTask.urgency === 3 ? 'bg-red-100 text-red-800' :
                    detailTask.urgency === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {detailTask.urgency === 3 ? '高 (当日中)' : detailTask.urgency === 2 ? '中 (3日以内)' : '低 (4日以上先)'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">優先度</h4>
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="text-lg font-semibold text-gray-900">
                    {detailTask.importance * detailTask.urgency}
                  </span>
                  <span className="text-sm text-gray-500">
                    (重要度 {detailTask.importance} × 緊急度 {detailTask.urgency})
                  </span>
                </div>
              </div>

              {detailTask.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">カテゴリ</h4>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {detailTask.category}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <button
                  onClick={() => {
                    toggleOneTimeTaskStatus(detailTask.id, detailTask.status)
                    setDetailTask(null)
                  }}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
                    detailTask.status === 'completed'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {detailTask.status === 'completed' ? '未完了に戻す' : '完了にする'}
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditTask(detailTask)
                      setDetailTask(null)
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>編集</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('このタスクを削除しますか？')) {
                        await deleteOneTimeTask(detailTask.id)
                        setDetailTask(null)
                        fetchOneTimeTasks()
                      }
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>削除</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* タスク編集モーダル */}
      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => setEditTask(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">タスクを編集</h2>
              <button
                onClick={() => setEditTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const deadline = formData.get('deadline') as string
                const localDate = new Date(deadline)
                const deadlineISO = localDate.toISOString()

                await updateOneTimeTask(editTask.id, {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  deadline: deadlineISO,
                  estimated_duration: parseInt(formData.get('estimated_duration') as string),
                  importance: parseInt(formData.get('importance') as string) as 1 | 2 | 3,
                  urgency: calculateUrgency(deadlineISO),
                  category: formData.get('category') as string,
                })
                setEditTask(null)
                fetchOneTimeTasks()
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タスク名 *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editTask.title}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  詳細説明
                </label>
                <textarea
                  name="description"
                  defaultValue={editTask.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    期限 *
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    defaultValue={format(new Date(editTask.deadline), "yyyy-MM-dd'T'HH:mm")}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予想所要時間（分）
                  </label>
                  <input
                    type="number"
                    name="estimated_duration"
                    defaultValue={editTask.estimated_duration}
                    min="5"
                    max="480"
                    step="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  重要度 *
                </label>
                <select
                  name="importance"
                  defaultValue={editTask.importance}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>低 (1)</option>
                  <option value={2}>中 (2)</option>
                  <option value={3}>高 (3)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <input
                  type="text"
                  name="category"
                  defaultValue={editTask.category || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditTask(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}