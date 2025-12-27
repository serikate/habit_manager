'use client'

import { useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useHabitStore } from '@/stores/habitStore'
import { useThemeStore } from '@/stores/themeStore'
import type { Habit, DailyTask } from '@/types'
import { Edit2, Trash2, CheckCircle, Clock, Calendar, BarChart3 } from 'lucide-react'

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
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([])
  const [contextMenu, setContextMenu] = useState<{ habitId: string; day: string; x: number; y: number } | null>(null)

  const isDark = resolvedTheme === 'dark'

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

  const dayNames: readonly string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
  const dayLabels: readonly string[] = ['月', '火', '水', '木', '金', '土', '日'] as const

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
  const dayOfWeek = new Date().getDay()
  const weekDays: readonly string[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayDayName = weekDays[dayOfWeek] ?? 'monday'
  const todayDayIndex = dayNames.indexOf(todayDayName)

  if (timetableData.length === 0) {
    return (
      <div className={`text-center py-16 px-8 rounded-2xl ${isDark ? 'bg-surface-800' : 'bg-white'} border ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
          まだ習慣が設定されていません
        </h3>
        <p className={`mb-6 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
          習慣を追加して、あなたの理想的な時間割を作りましょう！
        </p>
        <button
          onClick={() => {/* 習慣追加モーダルを開く */}}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors btn-hover"
        >
          最初の習慣を追加
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>
            習慣時間割
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
            学校の時間割のように、あなたの習慣スケジュールを確認できます
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-surface-800' : 'bg-surface-100'}`}>
          <div className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
            {format(new Date(), 'M月d日')}（{dayLabels[todayDayIndex]}）
          </div>
        </div>
      </div>

      {/* 時間割グリッド */}
      <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'} shadow-sm`}>
        {/* ヘッダー */}
        <div className={`grid grid-cols-8 ${isDark ? 'bg-surface-900' : 'bg-surface-50'} border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
          <div className={`p-4 text-center font-semibold border-r ${isDark ? 'text-surface-300 border-surface-700' : 'text-surface-700 border-surface-200'}`}>
            時間
          </div>
          {dayLabels.map((day, index) => (
            <div
              key={day}
              className={`p-4 text-center font-semibold border-r last:border-r-0 ${
                index === todayDayIndex
                  ? isDark
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'bg-primary-50 text-primary-700'
                  : isDark
                    ? 'text-surface-300 border-surface-700'
                    : 'text-surface-700 border-surface-200'
              } ${isDark ? 'border-surface-700' : 'border-surface-200'}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 時間別の行 */}
        {timetableData.map((timeSlot) => (
          <div key={timeSlot.time} className={`grid grid-cols-8 border-b last:border-b-0 ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
            {/* 時間列 */}
            <div className={`p-4 text-center font-medium font-mono-nums border-r ${isDark ? 'text-surface-300 bg-surface-900/50 border-surface-700' : 'text-surface-700 bg-surface-50 border-surface-200'}`}>
              {timeSlot.time}
            </div>

            {/* 各曜日の列 */}
            {dayNames.map((day, dayIndex) => {
              const habitInfo = getHabitForDayAndTime(day, timeSlot.time)
              const isToday = day === todayDayName
              const isCompleted = habitInfo ? isHabitCompleted(habitInfo.habit.id) : false

              return (
                <div
                  key={`${day}-${timeSlot.time}`}
                  className={`p-2 border-r last:border-r-0 min-h-[88px] flex items-center justify-center ${
                    isToday
                      ? isDark ? 'bg-primary-500/10' : 'bg-primary-50/50'
                      : ''
                  } ${isDark ? 'border-surface-700' : 'border-surface-200'}`}
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
                        className={`
                          w-full h-full min-h-[72px] p-3 rounded-xl border-2 transition-all duration-200
                          ${isCompleted && isToday
                            ? isDark
                              ? 'border-success-500/40 bg-success-500/20 hover:bg-success-500/30'
                              : 'border-success-300 bg-success-50 hover:bg-success-100'
                            : isToday
                            ? isDark
                              ? 'border-primary-500/40 bg-primary-500/15 hover:bg-primary-500/25 hover:border-primary-500/60'
                              : 'border-primary-200 bg-primary-50 hover:bg-primary-100 hover:border-primary-300'
                            : isDark
                              ? 'border-surface-600 bg-surface-700/50 hover:bg-surface-700 hover:border-surface-500'
                              : 'border-surface-200 bg-surface-50 hover:bg-surface-100 hover:border-surface-300'
                          }
                        `}
                      >
                        <div className="text-center">
                          {isCompleted && isToday && (
                            <div className="mb-1">
                              <CheckCircle className="w-5 h-5 mx-auto text-success-500" />
                            </div>
                          )}
                          <div className={`text-sm font-semibold mb-1 line-clamp-2 ${
                            isCompleted && isToday
                              ? isDark ? 'text-success-300' : 'text-success-700'
                              : isToday
                              ? isDark ? 'text-white' : 'text-surface-900'
                              : isDark ? 'text-surface-300' : 'text-surface-700'
                          }`}>
                            {habitInfo.habit.name}
                          </div>
                          <div className={`text-xs font-mono-nums ${
                            isCompleted && isToday
                              ? isDark ? 'text-success-400' : 'text-success-600'
                              : isToday
                              ? isDark ? 'text-surface-400' : 'text-surface-600'
                              : isDark ? 'text-surface-500' : 'text-surface-500'
                          }`}>
                            {habitInfo.habit.default_duration}分
                          </div>
                          {habitInfo.habit.category && (
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: habitInfo.habit.category.color }}
                              />
                              <span className={`text-xs ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                                {habitInfo.habit.category.name}
                              </span>
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
                          className="p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
                          title="この曜日の設定を編集"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const dayLabel = dayLabels[dayIndex]
                            if (confirm(`${dayLabel}曜日の「${habitInfo.habit.name}」を削除しますか？`)) {
                              onScheduleDelete?.(habitInfo.habit, day)
                            }
                          }}
                          className="p-1.5 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors shadow-sm"
                          title="この曜日の設定を削除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full min-h-[72px] flex items-center justify-center">
                      <div className={`text-xs ${isDark ? 'text-surface-600' : 'text-surface-300'}`}>—</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-surface-50 border border-surface-200'}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
          <Clock className="w-4 h-4" />
          使い方
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-500/20 border border-primary-500/40' : 'bg-primary-50 border border-primary-200'}`}>
              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-primary-400' : 'bg-primary-500'}`} />
            </div>
            <span className={isDark ? 'text-surface-300' : 'text-surface-600'}>
              クリックで習慣開始
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-success-500/20 border border-success-500/40' : 'bg-success-50 border border-success-200'}`}>
              <CheckCircle className={`w-4 h-4 ${isDark ? 'text-success-400' : 'text-success-500'}`} />
            </div>
            <span className={isDark ? 'text-surface-300' : 'text-surface-600'}>
              完了済みは緑色で表示
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-surface-700 border border-surface-600' : 'bg-surface-100 border border-surface-200'}`}>
              <span className={`text-xs ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>—</span>
            </div>
            <span className={isDark ? 'text-surface-300' : 'text-surface-600'}>
              未設定の時間帯
            </span>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'} shadow-sm`}>
        <h3 className={`text-sm font-semibold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
          <BarChart3 className="w-4 h-4" />
          今日の習慣統計
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold font-mono-nums ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
              {timetableData.reduce((total, slot) => total + slot.habits.length, 0)}
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>設定済み習慣</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold font-mono-nums ${isDark ? 'text-success-400' : 'text-success-600'}`}>
              {todayTasks.filter(task => task.status === 'completed' && task.is_recurring).length}
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>完了済み</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold font-mono-nums ${isDark ? 'text-accent-400' : 'text-accent-600'}`}>
              {Math.round(
                timetableData.reduce((total, slot) =>
                  total + slot.habits.reduce((sum, h) => sum + h.habit.default_duration, 0), 0
                ) / 60 * 10
              ) / 10}
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>予定時間(h)</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold font-mono-nums ${isDark ? 'text-info-400' : 'text-info-600'}`}>
              {new Set(timetableData.flatMap(slot =>
                slot.habits.map(h => h.habit.category?.name).filter(Boolean)
              )).size}
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>カテゴリ数</div>
          </div>
        </div>
      </div>

      {/* コンテキストメニュー */}
      {contextMenu && (
        <div
          className={`fixed shadow-xl rounded-xl border py-2 z-50 min-w-[220px] animate-scale-in ${
            isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'
          }`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const habit = habits.find(h => h.id === contextMenu.habitId)
            if (!habit) return null

            const dayIndex = dayNames.indexOf(contextMenu.day)
            const dayLabel = dayLabels[dayIndex]

            return (
              <>
                <div className={`px-4 py-2 text-xs font-medium border-b ${isDark ? 'text-surface-400 border-surface-700' : 'text-surface-500 border-surface-200'}`}>
                  {dayLabel}曜日の設定
                </div>
                <button
                  onClick={() => {
                    onScheduleEdit?.(habit, contextMenu.day)
                    setContextMenu(null)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 ${isDark ? 'hover:bg-surface-700' : 'hover:bg-surface-50'}`}
                >
                  <Edit2 className="w-4 h-4 text-primary-500" />
                  <span className={isDark ? 'text-surface-200' : 'text-surface-700'}>この曜日の時間を編集</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`${dayLabel}曜日の「${habit.name}」を削除しますか？`)) {
                      onScheduleDelete?.(habit, contextMenu.day)
                    }
                    setContextMenu(null)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 ${isDark ? 'hover:bg-surface-700' : 'hover:bg-surface-50'}`}
                >
                  <Trash2 className="w-4 h-4 text-danger-500" />
                  <span className="text-danger-500">この曜日の設定を削除</span>
                </button>
                <div className={`border-t my-1 ${isDark ? 'border-surface-700' : 'border-surface-200'}`}></div>
                <div className={`px-4 py-2 text-xs font-medium border-b ${isDark ? 'text-surface-400 border-surface-700' : 'text-surface-500 border-surface-200'}`}>
                  習慣全体の設定
                </div>
                <button
                  onClick={() => {
                    onHabitEdit?.(habit)
                    setContextMenu(null)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 ${isDark ? 'hover:bg-surface-700' : 'hover:bg-surface-50'}`}
                >
                  <Edit2 className="w-4 h-4 text-info-500" />
                  <span className={isDark ? 'text-surface-200' : 'text-surface-700'}>習慣全体を編集</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`「${habit.name}」全体を削除しますか？`)) {
                      onHabitDelete?.(habit)
                    }
                    setContextMenu(null)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 ${isDark ? 'hover:bg-surface-700' : 'hover:bg-surface-50'}`}
                >
                  <Trash2 className="w-4 h-4 text-danger-500" />
                  <span className="text-danger-500">習慣全体を削除</span>
                </button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
