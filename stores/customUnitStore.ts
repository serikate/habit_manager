import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { CustomUnit } from '@/types'

interface CustomUnitState {
  customUnits: CustomUnit[]
  isLoading: boolean
  error: string | null

  fetchCustomUnits: () => Promise<void>
  createCustomUnit: (name: string) => Promise<CustomUnit | null>
  deleteCustomUnit: (id: string) => Promise<boolean>
  canDeleteUnit: (id: string) => Promise<boolean>
}

export const useCustomUnitStore = create<CustomUnitState>((set, get) => ({
  customUnits: [],
  isLoading: false,
  error: null,

  fetchCustomUnits: async () => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ isLoading: false, error: 'ユーザーが見つかりません' })
        return
      }

      const { data, error } = await supabase
        .from('custom_units')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      set({ customUnits: data || [], isLoading: false })
    } catch (error) {
      console.error('カスタム単位の取得エラー:', error)
      set({
        error: error instanceof Error ? error.message : 'カスタム単位の取得に失敗しました',
        isLoading: false
      })
    }
  },

  createCustomUnit: async (name: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ isLoading: false, error: 'ユーザーが見つかりません' })
        return null
      }

      // 重複チェック
      const existingUnits = get().customUnits
      if (existingUnits.some(u => u.name === name)) {
        set({ isLoading: false, error: 'この単位名は既に存在します' })
        return null
      }

      const { data, error } = await supabase
        .from('custom_units')
        .insert({
          user_id: user.id,
          name: name.trim()
        })
        .select()
        .single()

      if (error) throw error

      set(state => ({
        customUnits: [...state.customUnits, data],
        isLoading: false
      }))

      return data
    } catch (error) {
      console.error('カスタム単位の作成エラー:', error)
      set({
        error: error instanceof Error ? error.message : 'カスタム単位の作成に失敗しました',
        isLoading: false
      })
      return null
    }
  },

  deleteCustomUnit: async (id: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      // 使用中かチェック
      const canDelete = await get().canDeleteUnit(id)
      if (!canDelete) {
        set({ isLoading: false, error: 'この単位は使用中のため削除できません' })
        return false
      }

      const { error } = await supabase
        .from('custom_units')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        customUnits: state.customUnits.filter(u => u.id !== id),
        isLoading: false
      }))

      return true
    } catch (error) {
      console.error('カスタム単位の削除エラー:', error)
      set({
        error: error instanceof Error ? error.message : 'カスタム単位の削除に失敗しました',
        isLoading: false
      })
      return false
    }
  },

  canDeleteUnit: async (id: string) => {
    const supabase = createClient()

    try {
      // 該当のカスタム単位を取得
      const unit = get().customUnits.find(u => u.id === id)
      if (!unit) return false

      // この単位を使用している短期目標があるかチェック
      const customUnitKey = `custom_${unit.name}`
      const { data, error } = await supabase
        .from('short_term_goals')
        .select('id')
        .eq('measurement_unit', customUnitKey)
        .limit(1)

      if (error) throw error

      // 使用中の目標がなければ削除可能
      return !data || data.length === 0
    } catch (error) {
      console.error('使用状況チェックエラー:', error)
      return false
    }
  }
}))
