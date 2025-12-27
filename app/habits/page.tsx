'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import HabitList from '@/components/habits/HabitList'
import HabitForm from '@/components/habits/HabitForm'
import CategoryForm from '@/components/categories/CategoryForm'
import HabitTimetable from '@/components/habits/HabitTimetable'
import { WeeklyReviewPopup } from '@/components/habits/WeeklyReviewPopup'
import { HabitReviewModal } from '@/components/habits/HabitReviewModal'
import { useHabitStore } from '@/stores/habitStore'
import { useTaskStore } from '@/stores/taskStore'
import { useThemeStore } from '@/stores/themeStore'
import { useHabitReviewStore, type HabitSnapshot } from '@/stores/habitReviewStore'
import { Plus, Tag, Calendar, List } from 'lucide-react'

export default function HabitsPage() {
  const router = useRouter()
  const [habitFormOpen, setHabitFormOpen] = useState(false)
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'timetable'>('timetable')
  const [taskUpdateTrigger, setTaskUpdateTrigger] = useState(0)
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error', message: string } | null>(null)
  const [editingHabit, setEditingHabit] = useState<any>(null)
  const { habits, fetchHabits, deleteHabit, updateHabit } = useHabitStore()
  const { startTask, fetchTodayTasks } = useTaskStore()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  // 週間レビュー関連
  const {
    shouldShowWeeklyPopup,
    openWeeklyPopup,
  } = useHabitReviewStore()

  // 習慣データをHabitSnapshot形式に変換
  const habitSnapshots: HabitSnapshot[] = habits.map((habit: any) => ({
    id: habit.id,
    name: habit.name,
    achievement_rate: habit.achievement_rate || 0,
    streak_current: habit.streak_current || 0,
    streak_max: habit.streak_max || 0,
    total_days: habit.total_days || 0,
    level: habit.level || 1,
  }))

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  // 週間レビューポップアップの表示チェック
  useEffect(() => {
    if (habits.length > 0 && shouldShowWeeklyPopup()) {
      openWeeklyPopup()
    }
  }, [habits.length, shouldShowWeeklyPopup, openWeeklyPopup])

  // 通知を自動で消す
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleHabitClick = async (habit: any, day: string, time: string) => {
    console.log('Habit clicked:', { habit: habit.name, day, time })

    // 今日の曜日かチェック
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayDayName = dayNames[new Date().getDay()]

    if (day !== todayDayName) {
      setNotification({
        type: 'info',
        message: `「${habit.name}」は今日のタスクではありません`
      })
      return
    }

    try {
      // 今日の習慣タスクを生成
      const tasks = await useHabitStore.getState().generateHabitTasks('today')

      if (tasks.length > 0) {
        console.log(`✅ 今日の習慣タスクを${tasks.length}件生成しました`)
        setNotification({
          type: 'success',
          message: `${tasks.length}件のタスクを生成しました`
        })
      }

      // 今日のタスクを取得
      await fetchTodayTasks()

      // 該当する習慣のタスクを探して開始状態にする
      const { todayTasks } = useTaskStore.getState()
      const habitTask = todayTasks.find(
        t => t.habit_id === habit.id && t.status === 'pending'
      )

      if (habitTask) {
        await startTask(habitTask.id)
        setNotification({
          type: 'success',
          message: `「${habit.name}」を開始しました！`
        })
        // タスク更新をトリガー
        setTaskUpdateTrigger(prev => prev + 1)
      } else {
        // 既に開始済みまたは完了済み
        const existingTask = todayTasks.find(t => t.habit_id === habit.id)
        if (existingTask?.status === 'completed') {
          setNotification({
            type: 'info',
            message: `「${habit.name}」は既に完了しています`
          })
        } else if (existingTask?.status === 'in_progress') {
          setNotification({
            type: 'info',
            message: `「${habit.name}」は実行中です`
          })
        }
      }

      // タスクページへ遷移するオプション（コメントアウト）
      // router.push('/tasks')

    } catch (error) {
      console.error('習慣タスク処理エラー:', error)
      setNotification({
        type: 'error',
        message: 'エラーが発生しました'
      })
    }
  }

  const handleHabitEdit = (habit: any) => {
    setEditingHabit(habit)
    setHabitFormOpen(true)
  }

  const handleHabitDelete = async (habit: any) => {
    try {
      const success = await deleteHabit(habit.id)
      if (success) {
        setNotification({
          type: 'success',
          message: `「${habit.name}」を削除しました`
        })
        await fetchHabits()
        setTaskUpdateTrigger(prev => prev + 1)
      } else {
        setNotification({
          type: 'error',
          message: '削除に失敗しました'
        })
      }
    } catch (error) {
      console.error('習慣削除エラー:', error)
      setNotification({
        type: 'error',
        message: '削除中にエラーが発生しました'
      })
    }
  }

  const handleHabitFormClose = () => {
    setHabitFormOpen(false)
    setEditingHabit(null)
  }

  const handleHabitFormSuccess = async () => {
    await fetchHabits()
    setTaskUpdateTrigger(prev => prev + 1)
    if (editingHabit) {
      setNotification({
        type: 'success',
        message: '習慣を更新しました'
      })
    }
  }

  const handleScheduleEdit = (habit: any, day: string) => {
    const dayLabel = ['月', '火', '水', '木', '金', '土', '日'][['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day)]
    const currentTime = habit.schedule?.[day]?.time || '06:00'

    const newTime = prompt(`${dayLabel}曜日の「${habit.name}」の時間を変更してください (HH:MM形式)`, currentTime)

    if (newTime && newTime !== currentTime) {
      // 時間のバリデーション
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(newTime)) {
        setNotification({
          type: 'error',
          message: '正しい時間形式で入力してください (例: 06:30)'
        })
        return
      }

      const updatedSchedule = {
        ...habit.schedule,
        [day]: {
          enabled: true,
          time: newTime
        }
      }

      updateHabit(habit.id, { schedule: updatedSchedule }).then((success) => {
        if (success) {
          setNotification({
            type: 'success',
            message: `${dayLabel}曜日の時間を${newTime}に変更しました`
          })
          fetchHabits()
          setTaskUpdateTrigger(prev => prev + 1)
        } else {
          setNotification({
            type: 'error',
            message: '更新に失敗しました'
          })
        }
      })
    }
  }

  const handleScheduleDelete = async (habit: any, day: string) => {
    const dayLabel = ['月', '火', '水', '木', '金', '土', '日'][['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day)]

    try {
      const updatedSchedule = { ...habit.schedule }
      delete updatedSchedule[day]

      const success = await updateHabit(habit.id, { schedule: updatedSchedule })

      if (success) {
        setNotification({
          type: 'success',
          message: `${dayLabel}曜日の「${habit.name}」を削除しました`
        })
        await fetchHabits()
        setTaskUpdateTrigger(prev => prev + 1)
      } else {
        setNotification({
          type: 'error',
          message: '削除に失敗しました'
        })
      }
    } catch (error) {
      console.error('スケジュール削除エラー:', error)
      setNotification({
        type: 'error',
        message: '削除中にエラーが発生しました'
      })
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* 通知バナー */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transition-all duration-300 animate-fade-in-up ${
              notification.type === 'success'
                ? 'bg-success-500 text-white'
                : notification.type === 'error'
                ? 'bg-danger-500 text-white'
                : 'bg-primary-500 text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between" data-tutorial="habits-section">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>習慣管理</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              継続したい習慣を登録して、レベルアップしていきましょう
            </p>
          </div>
          <div className="flex space-x-3">
            {/* 表示モード切替 */}
            <div className={`flex rounded-xl p-1 ${isDark ? 'bg-surface-800' : 'bg-surface-100'}`}>
              <button
                onClick={() => setViewMode('timetable')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  viewMode === 'timetable'
                    ? isDark
                      ? 'bg-surface-700 text-white shadow-sm'
                      : 'bg-white text-surface-900 shadow-sm'
                    : isDark
                      ? 'text-surface-400 hover:text-white'
                      : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1.5" />
                時間割
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
                一覧
              </button>
            </div>

            <button
              onClick={() => setCategoryFormOpen(true)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                isDark
                  ? 'text-surface-300 bg-surface-800 border border-surface-700 hover:bg-surface-700'
                  : 'text-surface-700 bg-white border border-surface-200 hover:bg-surface-50'
              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <Tag className="w-4 h-4" />
              <span>カテゴリ追加</span>
            </button>
            <button
              onClick={() => setHabitFormOpen(true)}
              data-tutorial="add-habit-button"
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 btn-hover"
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
            onHabitEdit={handleHabitEdit}
            onHabitDelete={handleHabitDelete}
            onScheduleEdit={handleScheduleEdit}
            onScheduleDelete={handleScheduleDelete}
            key={taskUpdateTrigger}
          />
        ) : (
          <HabitList />
        )}

        <HabitForm
          isOpen={habitFormOpen}
          onClose={handleHabitFormClose}
          onSuccess={handleHabitFormSuccess}
          initialData={editingHabit}
        />

        <CategoryForm
          isOpen={categoryFormOpen}
          onClose={() => setCategoryFormOpen(false)}
          onSuccess={() => {
            // Additional success handling if needed
          }}
        />

        {/* 週間レビューポップアップ */}
        <WeeklyReviewPopup
          habits={habitSnapshots}
          onOpenSettings={() => router.push('/settings')}
        />

        {/* レビューモーダル */}
        <HabitReviewModal />
      </div>
    </MainLayout>
  )
}