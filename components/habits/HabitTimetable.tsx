'use client'

import { useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit, DailyTask } from '@/types'
import { Edit2, Trash2, X } from 'lucide-react'

interface HabitTimetableProps {
  habits: Habit[]
  onHabitClick?: (habit: Habit, day: string, time: string) => void
  onHabitEdit?: (habit: Habit) => void
  onHabitDelete?: (habit: Habit) => void
  onScheduleEdit?: (habit: Habit, day: string) => void
  onScheduleDelete?: (habit: Habit, day: string) => void
}

interface TimetableSlot {
  time: string
  habits: {
    habit: Habit
    day: keyof Habit['schedule']
  }[]
}

export default function HabitTimetable({ habits, onHabitClick, onHabitEdit, onHabitDelete, onScheduleEdit, onScheduleDelete }: HabitTimetableProps) {
  const { getTodayTasks } = useHabitStore()
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([])
  const [contextMenu, setContextMenu] = useState<{ habitId: string; day: string; x: number; y: number } | null>(null)

  // 今日のタスクを取得
  const fetchTodayTasks = async () => {
    const tasks = await getTodayTasks()
    setTodayTasks(tasks)
  }

  useEffect(() => {
    fetchTodayTasks()
  }, [getTodayTasks])

  // コンテキストメニューを閉じる
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // 時間帯とその時間の習慣を整理
  const timetableData = useMemo(() => {
    const timeSlots: { [time: string]: TimetableSlot } = {}

    habits.forEach(habit => {
      if (habit.schedule) {
        Object.entries(habit.schedule).forEach(([day, daySchedule]) => {
          if (daySchedule?.enabled && daySchedule.time) {
            const time = daySchedule.time
            if (!timeSlots[time]) {
              timeSlots[time] = { time, habits: [] }
            }
            timeSlots[time].habits.push({
              habit,
              day: day as keyof Habit['schedule']
            })
          }
        })
      }
    })

    // 時間順にソート
    return Object.values(timeSlots).sort((a, b) => a.time.localeCompare(b.time))
  }, [habits])

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']

  const getHabitForDayAndTime = (day: string, time: string) => {
    return timetableData
      .find(slot => slot.time === time)
      ?.habits.find(h => h.day === day)
  }

  // 習慣が今日完了済みかチェック
  const isHabitCompleted = (habitId: string) => {
    return todayTasks.some(
      task => task.habit_id === habitId &&
              task.status === 'completed' &&
              task.is_recurring === true
    )
  }

  // 今日は何曜日かを取得
  const todayDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]

  if (timetableData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">まだ習慣が設定されていません</h3>
        <p className="text-gray-500 mb-6">習慣を追加して、あなたの理想的な時間割を作りましょう！</p>
        <button
          onClick={() => {/* 習慣追加モーダルを開く */}}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          最初の習慣を追加
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📚 習慣時間割</h2>
          <p className="text-sm text-gray-600 mt-1">
            学校の時間割のように、あなたの習慣スケジュールを確認できます
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            今日: {format(new Date(), 'M月d日')}
          </div>
        </div>
      </div>

      {/* 時間割グリッド */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
          <div className="p-4 text-center font-medium text-gray-900 border-r border-gray-200">
            時間
          </div>
          {dayLabels.map((day) => (
            <div key={day} className="p-4 text-center font-medium text-gray-900 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 時間別の行 */}
        {timetableData.map((timeSlot) => (
          <div key={timeSlot.time} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
            {/* 時間列 */}
            <div className="p-4 text-center font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
              {timeSlot.time}
            </div>

            {/* 各曜日の列 */}
            {dayNames.map((day) => {
              const habitInfo = getHabitForDayAndTime(day, timeSlot.time)
              const isToday = day === todayDayName
              const isCompleted = habitInfo ? isHabitCompleted(habitInfo.habit.id) : false

              return (
                <div
                  key={`${day}-${timeSlot.time}`}
                  className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[80px] flex items-center justify-center ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  {habitInfo ? (
                    <div className="relative w-full h-full group/cell">
                      <button
                        onClick={() => onHabitClick?.(habitInfo.habit, day, timeSlot.time)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setContextMenu({
                            habitId: habitInfo.habit.id,
                            day: day,
                            x: e.clientX,
                            y: e.clientY
                          })
                        }}
                        className={`w-full h-full min-h-[64px] p-3 rounded-md border-2 transition-all duration-200 ${
                          isCompleted && isToday
                            ? 'border-green-300 bg-green-100 hover:bg-green-200'
                            : isToday
                            ? 'border-primary-200 bg-primary-50 hover:bg-primary-100 hover:border-primary-300'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                        style={{
                          backgroundColor:
                            isCompleted && isToday
                              ? '#dcfce7'
                              : habitInfo.habit.category?.color && isToday
                              ? `${habitInfo.habit.category.color}15`
                              : habitInfo.habit.category?.color && !isToday
                              ? `${habitInfo.habit.category.color}08`
                              : undefined,
                          borderColor:
                            isCompleted && isToday
                              ? '#86efac'
                              : habitInfo.habit.category?.color && isToday
                              ? `${habitInfo.habit.category.color}40`
                              : habitInfo.habit.category?.color && !isToday
                              ? `${habitInfo.habit.category.color}20`
                              : undefined
                        }}
                      >
                        <div className="text-center">
                          {isCompleted && isToday && (
                            <div className="text-lg mb-1">✅</div>
                          )}
                          <div className={`text-sm font-medium mb-1 line-clamp-2 ${
                            isCompleted && isToday
                              ? 'text-green-800 group-hover/cell:text-green-900'
                              : isToday
                              ? 'text-gray-900 group-hover/cell:text-primary-700'
                              : 'text-gray-600 group-hover/cell:text-gray-700'
                          }`}>
                            {habitInfo.habit.name}
                          </div>
                          <div className={`text-xs ${
                            isCompleted && isToday
                              ? 'text-green-700 group-hover/cell:text-green-800'
                              : isToday
                              ? 'text-gray-600 group-hover/cell:text-primary-600'
                              : 'text-gray-500 group-hover/cell:text-gray-600'
                          }`}>
                            {habitInfo.habit.default_duration}分
                          </div>
                          {habitInfo.habit.category && (
                            <div className={`text-xs mt-1 ${
                              isCompleted && isToday
                                ? 'text-green-600 group-hover/cell:text-green-700'
                                : isToday
                                ? 'text-gray-500 group-hover/cell:text-primary-500'
                                : 'text-gray-400 group-hover/cell:text-gray-500'
                            }`}>
                              {habitInfo.habit.category.name}
                            </div>
                          )}
                        </div>
                      </button>

                      {/* ホバー時のアクションボタン */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onScheduleEdit?.(habitInfo.habit, day)
                          }}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          title="この曜日の設定を編集"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const dayLabel = ['月', '火', '水', '木', '金', '土', '日'][['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day)]
                            if (confirm(`${dayLabel}曜日の「${habitInfo.habit.name}」を削除しますか？`)) {
                              onScheduleDelete?.(habitInfo.habit, day)
                            }
                          }}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          title="この曜日の設定を削除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full min-h-[64px] flex items-center justify-center">
                      <div className="text-gray-300 text-xs">─</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">💡 使い方</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-primary-100 border border-primary-200 rounded mr-2"></div>
            <span>ボックスをクリックで習慣開始</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
            <span>完了済みは緑色で表示</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
            <span>未設定の時間帯</span>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">📊 今日の習慣統計</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {timetableData.reduce((total, slot) => total + slot.habits.length, 0)}
            </div>
            <div className="text-xs text-gray-600">設定済み習慣</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {todayTasks.filter(task => task.status === 'completed' && task.is_recurring).length}
            </div>
            <div className="text-xs text-gray-600">完了済み</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(
                timetableData.reduce((total, slot) =>
                  total + slot.habits.reduce((sum, h) => sum + h.habit.default_duration, 0), 0
                ) / 60 * 10
              ) / 10}
            </div>
            <div className="text-xs text-gray-600">予定時間(h)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(timetableData.flatMap(slot =>
                slot.habits.map(h => h.habit.category?.name).filter(Boolean)
              )).size}
            </div>
            <div className="text-xs text-gray-600">カテゴリ数</div>
          </div>
        </div>
      </div>

      {/* コンテキストメニュー */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-50 min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const habit = habits.find(h => h.id === contextMenu.habitId)
            if (!habit) return null

            const dayLabel = ['月', '火', '水', '木', '金', '土', '日'][['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(contextMenu.day)]

            return (
              <>
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  {dayLabel}曜日の設定
                </div>
                <button
                  onClick={() => {
                    onScheduleEdit?.(habit, contextMenu.day)
                    setContextMenu(null)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <span>この曜日の時間を編集</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`${dayLabel}曜日の「${habit.name}」を削除しますか？`)) {
                      onScheduleDelete?.(habit, contextMenu.day)
                    }
                    setContextMenu(null)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>この曜日の設定を削除</span>
                </button>
                <div className="border-t my-1"></div>
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  習慣全体の設定
                </div>
                <button
                  onClick={() => {
                    onHabitEdit?.(habit)
                    setContextMenu(null)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4 text-purple-600" />
                  <span>習慣全体を編集</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`「${habit.name}」全体を削除しますか？`)) {
                      onHabitDelete?.(habit)
                    }
                    setContextMenu(null)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>習慣全体を削除</span>
                </button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}