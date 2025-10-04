import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import type { DailyTask, TaskExecution, CreateTaskData, OneTimeTask, CreateOneTimeTaskData } from '@/types'
import { addExperience, shouldLevelUp } from '@/utils/levelSystem'
import { format } from 'date-fns'

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
  completeTask: (taskId: string, actualDuration: number) => Promise<boolean>
  startTask: (id: string) => Promise<boolean>

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
          )
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
    return await get().updateTask(id, { status: 'in_progress' })
  },

  completeTask: async (taskId: string, actualDuration: number) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const task = get().tasks.find(t => t.id === taskId) ||
                   get().todayTasks.find(t => t.id === taskId)

      if (!task) throw new Error('タスクが見つかりません')

      // 達成率を計算
      const achievementRate = Math.min((actualDuration / task.estimated_duration) * 100, 150)

      // タスク実行履歴を記録
      const { error: executionError } = await supabase
        .from('task_executions')
        .insert({
          task_id: taskId,
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
}))