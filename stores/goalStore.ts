import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { tutorialEvents } from '@/lib/tutorialEvents'
import type {
  LongTermGoal,
  ShortTermGoal,
  CreateLongTermGoalData,
  UpdateLongTermGoalData,
  CreateShortTermGoalData,
  UpdateShortTermGoalData,
  MeasurementUnit
} from '@/types'

interface GoalState {
  // State
  longTermGoals: LongTermGoal[]
  shortTermGoals: ShortTermGoal[]
  loading: boolean
  error: string | null

  // 長期目標のCRUD操作
  fetchLongTermGoals: () => Promise<void>
  createLongTermGoal: (data: CreateLongTermGoalData) => Promise<LongTermGoal | null>
  updateLongTermGoal: (id: string, data: UpdateLongTermGoalData) => Promise<boolean>
  deleteLongTermGoal: (id: string) => Promise<boolean>

  // 短期目標のCRUD操作
  fetchShortTermGoals: (longTermGoalId?: string) => Promise<void>
  createShortTermGoal: (data: CreateShortTermGoalData) => Promise<ShortTermGoal | null>
  updateShortTermGoal: (id: string, data: UpdateShortTermGoalData) => Promise<boolean>
  deleteShortTermGoal: (id: string) => Promise<boolean>

  // 進捗計算
  calculateShortTermGoalProgress: (id: string) => Promise<number>
  calculateLongTermGoalProgress: (id: string) => Promise<number>

  // 短期目標の現在値を更新
  updateShortTermGoalCurrentValue: (id: string, increment: number) => Promise<boolean>
}

export const useGoalStore = create<GoalState>((set, get) => ({
  // Initial State
  longTermGoals: [],
  shortTermGoals: [],
  loading: false,
  error: null,

  // ====================================
  // 長期目標のCRUD操作
  // ====================================

  fetchLongTermGoals: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const { data, error } = await supabase
        .from('long_term_goals')
        .select(`
          *,
          vision:visions(*),
          short_term_goals (
            *,
            habits (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ longTermGoals: data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '長期目標の取得に失敗しました'
      set({ error: message, loading: false })
    }
  },

  createLongTermGoal: async (data) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      // ビジョンを取得して期間を計算
      const { data: vision, error: visionError } = await supabase
        .from('visions')
        .select('period_months, created_at')
        .eq('id', data.vision_id)
        .single()

      if (visionError) throw visionError

      // 期間を計算（ビジョンの半分）
      const periodMonths = Math.floor(vision.period_months / 2)

      // 期限を計算
      let deadline: Date
      if (data.period_pattern === 'exact_half') {
        // 正確に半分
        deadline = new Date()
        deadline.setMonth(deadline.getMonth() + periodMonths)
      } else {
        // half_month_end: 半分の月の月末
        deadline = new Date()
        deadline.setMonth(deadline.getMonth() + periodMonths + 1)
        deadline.setDate(0) // 前月の最終日
      }

      const insertData: {
        user_id: string
        vision_id: string
        title: string
        period: number
        period_months: number
        period_pattern: string
        deadline: string
        description?: string
      } = {
        user_id: user.id,
        vision_id: data.vision_id,
        title: data.title,
        period: periodMonths, // 後方互換用
        period_months: periodMonths,
        period_pattern: data.period_pattern,
        deadline: deadline.toISOString(),
        ...(data.description ? { description: data.description } : {})
      }

      const { data: newGoal, error } = await supabase
        .from('long_term_goals')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        longTermGoals: [newGoal, ...state.longTermGoals],
        loading: false
      }))

      // チュートリアルイベント発火
      tutorialEvents.emit('ltg-created')

      return newGoal
    } catch (error) {
      const message = error instanceof Error ? error.message : '長期目標の作成に失敗しました'
      set({ error: message, loading: false })
      return null
    }
  },

  updateLongTermGoal: async (id, data) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const updateData: {
        title?: string
        description?: string
        is_achieved?: boolean
      } = {}

      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.is_achieved !== undefined) updateData.is_achieved = data.is_achieved

      const { error } = await supabase
        .from('long_term_goals')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        longTermGoals: state.longTermGoals.map(goal =>
          goal.id === id ? { ...goal, ...updateData } : goal
        ),
        loading: false
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '長期目標の更新に失敗しました'
      set({ error: message, loading: false })
      return false
    }
  },

  deleteLongTermGoal: async (id) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      // 1. 紐づく短期目標を取得
      const { data: shortTermGoals, error: fetchError } = await supabase
        .from('short_term_goals')
        .select('id')
        .eq('long_term_goal_id', id)

      if (fetchError) throw fetchError

      // 2. 各短期目標に紐づく習慣の紐づけを解除
      if (shortTermGoals && shortTermGoals.length > 0) {
        const shortTermGoalIds = shortTermGoals.map(g => g.id)

        const { error: unlinkError } = await supabase
          .from('habits')
          .update({ short_term_goal_id: null })
          .in('short_term_goal_id', shortTermGoalIds)

        if (unlinkError) throw unlinkError
      }

      // 3. 長期目標を削除（CASCADEで短期目標も削除される）
      const { error } = await supabase
        .from('long_term_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        longTermGoals: state.longTermGoals.filter(goal => goal.id !== id),
        loading: false
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '長期目標の削除に失敗しました'
      set({ error: message, loading: false })
      return false
    }
  },

  // ====================================
  // 短期目標のCRUD操作
  // ====================================

  fetchShortTermGoals: async (longTermGoalId) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      let query = supabase
        .from('short_term_goals')
        .select(`
          *,
          long_term_goal:long_term_goals(
            *,
            vision:visions(*)
          ),
          habits(*)
        `)
        .eq('user_id', user.id)

      if (longTermGoalId) {
        query = query.eq('long_term_goal_id', longTermGoalId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      set({ shortTermGoals: data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '短期目標の取得に失敗しました'
      set({ error: message, loading: false })
    }
  },

  createShortTermGoal: async (data) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      // target_monthの設定（省略時は現在月の1日）
      const targetMonth = data.target_month ||
        new Date().toISOString().slice(0, 7) + '-01'

      const insertData: {
        user_id: string
        long_term_goal_id: string
        title: string
        measurement_unit: string
        target_value: number
        target_month: string
        deadline?: string
        show_after_achieved?: boolean
      } = {
        user_id: user.id,
        long_term_goal_id: data.long_term_goal_id,
        title: data.title,
        measurement_unit: data.measurement_unit,
        target_value: data.target_value,
        target_month: targetMonth,
        ...(data.deadline ? { deadline: data.deadline } : {}),
        ...(typeof data.show_after_achieved === 'boolean' ? { show_after_achieved: data.show_after_achieved } : {})
      }

      const { data: newGoal, error } = await supabase
        .from('short_term_goals')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        shortTermGoals: [newGoal, ...state.shortTermGoals],
        loading: false
      }))

      // チュートリアルイベント発火
      tutorialEvents.emit('stg-created')

      return newGoal
    } catch (error) {
      const message = error instanceof Error ? error.message : '短期目標の作成に失敗しました'
      set({ error: message, loading: false })
      return null
    }
  },

  updateShortTermGoal: async (id, data) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const updateData: {
        title?: string
        measurement_unit?: MeasurementUnit
        target_value?: number
        current_value?: number
        deadline?: string
        is_achieved?: boolean
        show_after_achieved?: boolean
      } = {}

      if (data.title !== undefined) updateData.title = data.title
      if (data.measurement_unit !== undefined) updateData.measurement_unit = data.measurement_unit
      if (data.target_value !== undefined) updateData.target_value = data.target_value
      if (data.current_value !== undefined) updateData.current_value = data.current_value
      if (data.deadline !== undefined) updateData.deadline = data.deadline
      if (data.is_achieved !== undefined) updateData.is_achieved = data.is_achieved
      if (data.show_after_achieved !== undefined) updateData.show_after_achieved = data.show_after_achieved

      const { error } = await supabase
        .from('short_term_goals')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        shortTermGoals: state.shortTermGoals.map(goal =>
          goal.id === id ? { ...goal, ...updateData } : goal
        ),
        loading: false
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '短期目標の更新に失敗しました'
      set({ error: message, loading: false })
      return false
    }
  },

  deleteShortTermGoal: async (id) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      // 1. 紐づく習慣の紐づけを解除（習慣は削除しない）
      const { error: unlinkError } = await supabase
        .from('habits')
        .update({ short_term_goal_id: null })
        .eq('short_term_goal_id', id)

      if (unlinkError) throw unlinkError

      // 2. 短期目標を削除
      const { error } = await supabase
        .from('short_term_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        shortTermGoals: state.shortTermGoals.filter(goal => goal.id !== id),
        loading: false
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '短期目標の削除に失敗しました'
      set({ error: message, loading: false })
      return false
    }
  },

  // ====================================
  // 進捗計算
  // ====================================

  calculateShortTermGoalProgress: async (id) => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .rpc('calculate_short_term_goal_progress', {
          p_short_term_goal_id: id
        })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('短期目標の進捗計算に失敗:', error)
      return 0
    }
  },

  calculateLongTermGoalProgress: async (id) => {
    const supabase = createClient()
    try {
      // 新方式の進捗計算（月ごとの重み付け）を使用
      const { data, error } = await supabase
        .rpc('calculate_long_term_goal_progress_v2', {
          p_long_term_goal_id: id
        })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('長期目標の進捗計算に失敗:', error)
      return 0
    }
  },

  // ====================================
  // 短期目標の現在値を更新
  // ====================================

  updateShortTermGoalCurrentValue: async (id, increment) => {
    const supabase = createClient()
    try {
      // 現在の短期目標を取得
      const { data: goal, error: fetchError } = await supabase
        .from('short_term_goals')
        .select('current_value')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const newValue = goal.current_value + increment

      // 新しい値で更新（トリガーが自動的にis_achievedを更新）
      const { error: updateError } = await supabase
        .from('short_term_goals')
        .update({ current_value: newValue })
        .eq('id', id)

      if (updateError) throw updateError

      // ローカルステートも更新
      set(state => ({
        shortTermGoals: state.shortTermGoals.map(goal =>
          goal.id === id
            ? { ...goal, current_value: newValue, is_achieved: newValue >= goal.target_value }
            : goal
        )
      }))

      return true
    } catch (error) {
      console.error('短期目標の現在値更新に失敗:', error)
      return false
    }
  }
}))
