import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { tutorialEvents } from '@/lib/tutorialEvents'
import type { Vision, CreateVisionData, UpdateVisionData } from '@/types'

interface VisionState {
  // State
  visions: Vision[]
  loading: boolean
  error: string | null

  // CRUD操作
  fetchVisions: () => Promise<void>
  createVision: (data: CreateVisionData) => Promise<Vision | null>
  updateVision: (id: string, data: UpdateVisionData) => Promise<boolean>
  deleteVision: (id: string) => Promise<boolean>

  // 進捗計算
  calculateVisionProgress: (id: string) => Promise<number>
}

export const useVisionStore = create<VisionState>((set) => ({
  // Initial State
  visions: [],
  loading: false,
  error: null,

  // ====================================
  // ビジョンの取得
  // ====================================
  fetchVisions: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const { data, error } = await supabase
        .from('visions')
        .select(`
          *,
          long_term_goals (
            *,
            short_term_goals (
              *,
              habits (*)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ visions: data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ビジョンの取得に失敗しました'
      set({ error: message, loading: false })
    }
  },

  // ====================================
  // ビジョンの作成
  // ====================================
  createVision: async (data) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      // 期限を計算（現在日時 + period_months ヶ月）
      const deadline = new Date()
      deadline.setMonth(deadline.getMonth() + data.period_months)

      const insertData: {
        user_id: string
        title: string
        period_months: number
        deadline: string
        description?: string
      } = {
        user_id: user.id,
        title: data.title,
        period_months: data.period_months,
        deadline: deadline.toISOString(),
        ...(data.description ? { description: data.description } : {})
      }

      const { data: newVision, error } = await supabase
        .from('visions')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        visions: [newVision, ...state.visions],
        loading: false
      }))

      // チュートリアルイベント発火
      tutorialEvents.emit('vision-created')

      return newVision
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ビジョンの作成に失敗しました'
      set({ error: message, loading: false })
      return null
    }
  },

  // ====================================
  // ビジョンの更新
  // ====================================
  updateVision: async (id, data) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      const updateData: {
        title?: string
        description?: string
        period_months?: number
        deadline?: string
        is_achieved?: boolean
      } = {}

      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.is_achieved !== undefined) updateData.is_achieved = data.is_achieved

      if (data.period_months !== undefined) {
        updateData.period_months = data.period_months
        // 期限を再計算
        const deadline = new Date()
        deadline.setMonth(deadline.getMonth() + data.period_months)
        updateData.deadline = deadline.toISOString()
      }

      const { error } = await supabase
        .from('visions')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        visions: state.visions.map(vision =>
          vision.id === id ? { ...vision, ...updateData } : vision
        ),
        loading: false
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ビジョンの更新に失敗しました'
      set({ error: message, loading: false })
      return false
    }
  },

  // ====================================
  // ビジョンの削除
  // ====================================
  deleteVision: async (id) => {
    const supabase = createClient()
    set({ loading: true, error: null })
    try {
      // 1. 紐づく長期目標を取得
      const { data: longTermGoals, error: fetchLtgError } = await supabase
        .from('long_term_goals')
        .select('id')
        .eq('vision_id', id)

      if (fetchLtgError) throw fetchLtgError

      if (longTermGoals && longTermGoals.length > 0) {
        const longTermGoalIds = longTermGoals.map(g => g.id)

        // 2. 紐づく短期目標を取得
        const { data: shortTermGoals, error: fetchStgError } = await supabase
          .from('short_term_goals')
          .select('id')
          .in('long_term_goal_id', longTermGoalIds)

        if (fetchStgError) throw fetchStgError

        if (shortTermGoals && shortTermGoals.length > 0) {
          const shortTermGoalIds = shortTermGoals.map(g => g.id)

          // 3. 習慣の紐づけを解除（習慣自体は削除しない）
          const { error: unlinkError } = await supabase
            .from('habits')
            .update({ short_term_goal_id: null })
            .in('short_term_goal_id', shortTermGoalIds)

          if (unlinkError) throw unlinkError
        }
      }

      // 4. ビジョンを削除（CASCADEで長期・短期目標も削除）
      const { error } = await supabase
        .from('visions')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        visions: state.visions.filter(vision => vision.id !== id),
        loading: false
      }))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ビジョンの削除に失敗しました'
      set({ error: message, loading: false })
      return false
    }
  },

  // ====================================
  // ビジョンの進捗計算
  // ====================================
  calculateVisionProgress: async (id) => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .rpc('calculate_vision_progress', { p_vision_id: id })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('ビジョンの進捗計算に失敗:', error)
      return 0
    }
  }
}))
