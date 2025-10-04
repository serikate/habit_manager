import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import type { Habit, Category, CreateHabitData, CreateCategoryData, DailyTask } from '@/types'
import { generateTodayHabitTasks, generateTomorrowHabitTasks, filterNewHabitTasks } from '@/utils/habitTaskGenerator'

interface HabitState {
  habits: Habit[]
  categories: Category[]
  loading: boolean
  error: string | null

  // Actions
  fetchHabits: () => Promise<void>
  fetchCategories: () => Promise<void>
  createHabit: (data: CreateHabitData) => Promise<Habit | null>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<boolean>
  deleteHabit: (id: string) => Promise<boolean>
  createCategory: (data: CreateCategoryData) => Promise<Category | null>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>
  // 🆕 習慣タスク自動生成
  generateHabitTasks: (targetDate?: 'today' | 'tomorrow') => Promise<DailyTask[]>
  // 🆕 今日のタスク取得
  getTodayTasks: () => Promise<DailyTask[]>
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  categories: [],
  loading: false,
  error: null,

  fetchHabits: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ habits: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchCategories: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      set({ categories: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createHabit: async (data: CreateHabitData) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data: habit, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: data.name,
          category_id: data.category_id,
          default_duration: data.default_duration,
          avg_actual_duration: data.default_duration,
          level: 1,
          experience_points: 0,
          is_active: true,
          schedule: data.schedule, // 🆕 スケジュール追加
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error

      set(state => ({
        habits: [habit, ...state.habits],
        loading: false
      }))

      return habit
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updateHabit: async (id: string, updates: Partial<Habit>) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        habits: state.habits.map(habit =>
          habit.id === id ? { ...habit, ...updates } : habit
        ),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  deleteHabit: async (id: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        habits: state.habits.filter(habit => habit.id !== id),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  createCategory: async (data: CreateCategoryData) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: data.name,
          color: data.color,
        })
        .select()
        .single()

      if (error) throw error

      set(state => ({
        categories: [...state.categories, category].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false
      }))

      return category
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        categories: state.categories.map(category =>
          category.id === id ? { ...category, ...updates } : category
        ).sort((a, b) => a.name.localeCompare(b.name)),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  deleteCategory: async (id: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        categories: state.categories.filter(category => category.id !== id),
        loading: false
      }))

      return true
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return false
    }
  },

  // 🆕 習慣タスクの自動生成
  generateHabitTasks: async (targetDate: 'today' | 'tomorrow' = 'today') => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      // 現在の習慣を取得
      const { habits } = get()

      // 既存のタスクを取得（重複チェック用）
      const { data: existingTasks } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_recurring', true)

      // タスク生成
      const newTasks = targetDate === 'today'
        ? generateTodayHabitTasks(habits)
        : generateTomorrowHabitTasks(habits)

      // 重複を除いて新しいタスクのみ抽出
      const tasksToCreate = filterNewHabitTasks(newTasks, existingTasks || [])

      if (tasksToCreate.length === 0) {
        console.log('📋 新しい習慣タスクはありません')
        set({ loading: false })
        return []
      }

      // タスクを一括作成
      const { data: createdTasks, error } = await supabase
        .from('daily_tasks')
        .insert(
          tasksToCreate.map(task => ({
            user_id: user.id,
            habit_id: task.habit_id!,
            date: task.date!,
            estimated_duration: task.estimated_duration!,
            importance: task.importance!,
            deadline: task.deadline,
            is_recurring: task.is_recurring!,
            status: task.status!,
            auto_generated: task.auto_generated
          }))
        )
        .select(`
          *,
          habit:habits(
            *,
            category:categories(*)
          )
        `)

      if (error) throw error

      console.log(`✨ ${createdTasks?.length || 0}件の習慣タスクを生成しました`)

      set({ loading: false })
      return createdTasks || []
    } catch (error: any) {
      console.error('😱 習慣タスク生成エラー:', error)
      set({ error: error.message, loading: false })
      return []
    }
  },

  // 🆕 今日のタスクを取得
  getTodayTasks: async () => {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const today = new Date().toISOString().split('T')[0]

      const { data: tasks, error } = await supabase
        .from('daily_tasks')
        .select(`
          *,
          habit:habits(
            *,
            category:categories(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('date', today)

      if (error) throw error
      return tasks || []
    } catch (error: any) {
      console.error('今日のタスク取得エラー:', error)
      return []
    }
  },
}))