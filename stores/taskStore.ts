import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import type { DailyTask, TaskExecution, CreateTaskData, OneTimeTask, CreateOneTimeTaskData, EditExecutionData } from '@/types'
import { addExperience, shouldLevelUp } from '@/utils/levelSystem'
import {
  calculateDuration,
  calculateAchievementRate,
  validateExecutionTime
} from '@/utils/timeCalculator'
import {
  updateShortTermGoalProgress,
  decrementShortTermGoalProgress
} from '@/utils/goalProgressCalculator'
import { format } from 'date-fns'
import { useUserProfileStore } from './userProfileStore'
import { useHabitCompletionStore } from './habitCompletionStore'

interface TaskState {
  tasks: DailyTask[]
  todayTasks: DailyTask[]
  oneTimeTasks: OneTimeTask[]
  loading: boolean
  error: string | null

  // Daily Task Actions
  fetchTasks: (date?: string) => Promise<void>
  fetchTodayTasks: () => Promise<void>
  createTask: (data: CreateTaskData) => Promise<DailyTask | null>
  updateTask: (id: string, updates: Partial<DailyTask>) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  completeTask: (taskId: string) => Promise<boolean>  // 🆕 引数を削除
  startTask: (id: string) => Promise<boolean>
  uncompleteTask: (taskId: string) => Promise<boolean>  // 🆕 未完了に戻す
  editExecution: (executionId: string, data: EditExecutionData) => Promise<boolean>  // 🆕 追加

  // One-Time Task Actions
  fetchOneTimeTasks: () => Promise<void>
  createOneTimeTask: (data: CreateOneTimeTaskData) => Promise<OneTimeTask | null>
  updateOneTimeTask: (id: string, updates: Partial<OneTimeTask>) => Promise<boolean>
  deleteOneTimeTask: (id: string) => Promise<boolean>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  todayTasks: [],
  oneTimeTasks: [],
  loading: false,
  error: null,

  fetchTasks: async (date?: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const targetDate = date || format(new Date(), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('daily_tasks')
        .select(`
          *,
          habit:habits(
            *,
            category:categories(*)
          )
        `)
        .eq('date', targetDate)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ tasks: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchTodayTasks: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('daily_tasks')
        .select(`
          *,
          habit:habits(
            *,
            category:categories(*)
          ),
          executions:task_executions(*)
        `)
        .eq('date', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ todayTasks: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createTask: async (data: CreateTaskData) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data: task, error } = await supabase
        .from('daily_tasks')
        .insert({
          user_id: user.id,
          habit_id: data.habit_id,
          date: data.date,
          estimated_duration: data.estimated_duration,
          importance: data.importance,
          deadline: data.deadline,
          is_recurring: data.is_recurring,
        })
        .select(`
          *,
          habit:habits(
            *,
            category:categories(*)
          )
        `)
        .single()

      if (error) throw error

      set(state => ({
        tasks: [task, ...state.tasks],
        todayTasks: task.date === format(new Date(), 'yyyy-MM-dd')
          ? [task, ...state.todayTasks]
          : state.todayTasks,
        loading: false
      }))

      return task
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updateTask: async (id: string, updates: Partial<DailyTask>) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        ),
        todayTasks: state.todayTasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        ),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  deleteTask: async (id: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        todayTasks: state.todayTasks.filter(task => task.id !== id),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  startTask: async (id: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('daily_tasks')
        .update({
          status: 'in_progress',
          started_at: now  // 🆕 開始時刻を記録
        })
        .eq('id', id)

      if (error) throw error

      // ローカル状態を更新
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, status: 'in_progress', started_at: now } : t
        ),
        todayTasks: state.todayTasks.map(t =>
          t.id === id ? { ...t, status: 'in_progress', started_at: now } : t
        ),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  completeTask: async (taskId: string) => {  // 🆕 引数を削除
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const task = get().tasks.find(t => t.id === taskId) ||
                   get().todayTasks.find(t => t.id === taskId)

      if (!task) throw new Error('タスクが見つかりません')
      if (!task.started_at) throw new Error('開始時刻が記録されていません')

      const completedAt = new Date().toISOString()

      // 🆕 実際の所要時間を計算
      const actualDuration = calculateDuration(task.started_at, completedAt)

      // 達成率を計算
      const achievementRate = calculateAchievementRate(
        actualDuration,
        task.estimated_duration
      )

      // タスク実行履歴を記録
      const { error: executionError } = await supabase
        .from('task_executions')
        .insert({
          task_id: taskId,
          started_at: task.started_at,  // 🆕 開始時刻も記録
          completed_at: completedAt,
          actual_duration: actualDuration,
          achievement_rate: achievementRate,
        })

      if (executionError) throw executionError

      // タスクステータス更新
      const { error: taskError } = await supabase
        .from('daily_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (taskError) throw taskError

      // 習慣の経験値とレベル更新
      if (task.habit) {
        const currentXP = task.habit.experience_points
        const newXP = addExperience(currentXP, achievementRate)
        const newLevel = Math.floor(newXP / 100) + 1

        const { error: habitError } = await supabase
          .from('habits')
          .update({
            experience_points: newXP,
            level: newLevel,
            avg_actual_duration: Math.round(
              (task.habit.avg_actual_duration + actualDuration) / 2
            )
          })
          .eq('id', task.habit.id)

        if (habitError) throw habitError
      }

      // 🆕 短期目標の進捗を更新
      // タスクの実行情報を含めて渡す
      const taskWithExecution = {
        ...task,
        executions: [{
          id: 'temp',
          task_id: taskId,
          started_at: task.started_at,
          completed_at: completedAt,
          actual_duration: actualDuration,
          achievement_rate: achievementRate
        }]
      }
      await updateShortTermGoalProgress(taskWithExecution as DailyTask)

      // 🆕 グローバルXP付与（習慣タスクの場合のみ）
      let xpResult: {
        baseXP: number
        streakBonus: number
        totalXP: number
        newStreak: number
        isStreakExtended: boolean
        leveledUp: boolean
        newLevel: number | undefined
        previousProgress: number
        currentProgress: number
        currentLevelXP: number
        requiredXP: number
        currentLevel: number
      } | null = null

      if (task.is_recurring && task.habit_id) {
        try {
          // XP付与前のレベル情報を取得
          const profileStore = useUserProfileStore.getState()
          const previousLevelInfo = profileStore.getLevelInfo()

          // XP付与
          const result = await profileStore.addXPForHabitCompletion(taskId)

          if (result) {
            // XP付与後のレベル情報を取得
            const currentLevelInfo = profileStore.getLevelInfo()

            xpResult = {
              ...result,
              previousProgress: previousLevelInfo.progress,
              currentProgress: currentLevelInfo.progress,
              currentLevelXP: currentLevelInfo.currentXP,
              requiredXP: 100, // 100XPでレベルアップ
              currentLevel: currentLevelInfo.level
            }
          }
        } catch (xpError) {
          console.warn('グローバルXP付与に失敗:', xpError)
          // XP付与の失敗はタスク完了を妨げない
        }
      }

      // 状態更新
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'completed' } : t
        ),
        todayTasks: state.todayTasks.map(t =>
          t.id === taskId ? { ...t, status: 'completed' } : t
        ),
        loading: false
      }))

      // 🆕 習慣タスク完了時にポップアップを表示（XP情報付き）
      if (task.is_recurring && task.habit) {
        useHabitCompletionStore.getState().showCompletion(
          task.habit.id,
          task.habit.name,
          xpResult || undefined
        )
      }

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  uncompleteTask: async (taskId: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      // タスクを取得（進捗減算用）
      const task = get().tasks.find(t => t.id === taskId) ||
                   get().todayTasks.find(t => t.id === taskId)

      // 🆕 短期目標の進捗を減算（削除前に実行）
      if (task) {
        await decrementShortTermGoalProgress(task)
      }

      // タスクの実行履歴を削除
      const { error: executionError } = await supabase
        .from('task_executions')
        .delete()
        .eq('task_id', taskId)

      if (executionError) throw executionError

      // タスクステータスを pending に戻し、started_at をクリア
      const { error: taskError } = await supabase
        .from('daily_tasks')
        .update({
          status: 'pending',
          started_at: null
        })
        .eq('id', taskId)

      if (taskError) throw taskError

      // 状態更新
      set(state => ({
        tasks: state.tasks.map(t => {
          if (t.id === taskId) {
            const { started_at, executions, ...rest } = t
            return { ...rest, status: 'pending' as const }
          }
          return t
        }),
        todayTasks: state.todayTasks.map(t => {
          if (t.id === taskId) {
            const { started_at, executions, ...rest } = t
            return { ...rest, status: 'pending' as const }
          }
          return t
        }),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  // One-Time Task Actions
  fetchOneTimeTasks: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data, error } = await supabase
        .from('one_time_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ oneTimeTasks: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createOneTimeTask: async (data: CreateOneTimeTaskData) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data: task, error } = await supabase
        .from('one_time_tasks')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          deadline: data.deadline,
          estimated_duration: data.estimated_duration,
          importance: data.importance,
          urgency: data.urgency,
          category: data.category,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      set(state => ({
        oneTimeTasks: [task, ...state.oneTimeTasks],
        loading: false
      }))

      return task
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updateOneTimeTask: async (id: string, updates: Partial<OneTimeTask>) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('one_time_tasks')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        oneTimeTasks: state.oneTimeTasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        ),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  deleteOneTimeTask: async (id: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('one_time_tasks')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        oneTimeTasks: state.oneTimeTasks.filter(task => task.id !== id),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  // 🆕 タスク実行時間の編集
  editExecution: async (executionId: string, data: EditExecutionData) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      // バリデーション
      validateExecutionTime(data.started_at, data.completed_at)

      // 既存データを取得（編集履歴用）
      const { data: oldExecution, error: fetchError } = await supabase
        .from('task_executions')
        .select('*')
        .eq('id', executionId)
        .single()

      if (fetchError) throw fetchError
      if (!oldExecution) throw new Error('実行履歴が見つかりません')

      // 新しい所要時間と達成率を計算
      const newActualDuration = calculateDuration(
        data.started_at,
        data.completed_at
      )

      // タスク情報を取得（estimated_durationが必要）
      const { data: task, error: taskError } = await supabase
        .from('daily_tasks')
        .select('estimated_duration')
        .eq('id', oldExecution.task_id)
        .single()

      if (taskError) throw taskError

      const newAchievementRate = calculateAchievementRate(
        newActualDuration,
        task.estimated_duration
      )

      // 編集履歴を記録
      const { error: historyError } = await supabase
        .from('task_execution_edits')
        .insert({
          execution_id: executionId,
          old_started_at: oldExecution.started_at,
          old_completed_at: oldExecution.completed_at,
          old_actual_duration: oldExecution.actual_duration,
          old_achievement_rate: oldExecution.achievement_rate,
          new_started_at: data.started_at,
          new_completed_at: data.completed_at,
          new_actual_duration: newActualDuration,
          new_achievement_rate: newAchievementRate,
          edited_by: user.id,
          edit_reason: data.edit_reason || null,
        })

      if (historyError) throw historyError

      // task_executions を更新
      const { error: updateError } = await supabase
        .from('task_executions')
        .update({
          started_at: data.started_at,
          completed_at: data.completed_at,
          actual_duration: newActualDuration,
          achievement_rate: newAchievementRate,
        })
        .eq('id', executionId)

      if (updateError) throw updateError

      set({ loading: false })
      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error  // モーダル側でエラーメッセージを表示するため
    }
  },
}))