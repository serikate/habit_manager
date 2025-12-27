import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { ProgressEntry } from '@/types'

interface ProgressState {
  isLoading: boolean
  error: string | null

  // 進捗を記録
  recordProgress: (
    shortTermGoalId: string,
    taskId: string | null,
    value: number
  ) => Promise<boolean>

  // 進捗履歴を取得
  fetchProgressEntries: (shortTermGoalId: string) => Promise<ProgressEntry[]>

  // 進捗エントリを更新（修正）
  updateProgressEntry: (id: string, value: number) => Promise<boolean>

  // 進捗エントリを削除
  deleteProgressEntry: (id: string) => Promise<boolean>
}

export const useProgressStore = create<ProgressState>((set) => ({
  isLoading: false,
  error: null,

  recordProgress: async (shortTermGoalId, taskId, value) => {
    const supabase = createClient()
    set({ isLoading: true, error: null })

    try {
      // 1. progress_entriesに記録
      const { error: insertError } = await supabase
        .from('progress_entries')
        .insert({
          short_term_goal_id: shortTermGoalId,
          ...(taskId ? { task_id: taskId } : {}),
          value,
          is_correction: false
        })

      if (insertError) throw insertError

      // 2. 短期目標のcurrent_valueを更新
      const { data: goal, error: fetchError } = await supabase
        .from('short_term_goals')
        .select('current_value')
        .eq('id', shortTermGoalId)
        .single()

      if (fetchError) throw fetchError

      const newValue = (goal.current_value || 0) + value

      const { error: updateError } = await supabase
        .from('short_term_goals')
        .update({ current_value: newValue })
        .eq('id', shortTermGoalId)

      if (updateError) throw updateError

      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('進捗記録エラー:', error)
      set({
        error: error instanceof Error ? error.message : '進捗の記録に失敗しました',
        isLoading: false
      })
      return false
    }
  },

  fetchProgressEntries: async (shortTermGoalId) => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('short_term_goal_id', shortTermGoalId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('進捗履歴取得エラー:', error)
      return []
    }
  },

  updateProgressEntry: async (id, value) => {
    const supabase = createClient()
    set({ isLoading: true, error: null })

    try {
      // 1. 元のエントリを取得
      const { data: oldEntry, error: fetchError } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const oldValue = oldEntry.value
      const valueDiff = value - oldValue

      // 2. エントリを更新
      const { error: updateEntryError } = await supabase
        .from('progress_entries')
        .update({
          value,
          updated_at: new Date().toISOString(),
          is_correction: true
        })
        .eq('id', id)

      if (updateEntryError) throw updateEntryError

      // 3. 短期目標のcurrent_valueを調整
      const { data: goal, error: goalFetchError } = await supabase
        .from('short_term_goals')
        .select('current_value')
        .eq('id', oldEntry.short_term_goal_id)
        .single()

      if (goalFetchError) throw goalFetchError

      const newGoalValue = (goal.current_value || 0) + valueDiff

      const { error: goalUpdateError } = await supabase
        .from('short_term_goals')
        .update({ current_value: newGoalValue })
        .eq('id', oldEntry.short_term_goal_id)

      if (goalUpdateError) throw goalUpdateError

      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('進捗更新エラー:', error)
      set({
        error: error instanceof Error ? error.message : '進捗の更新に失敗しました',
        isLoading: false
      })
      return false
    }
  },

  deleteProgressEntry: async (id) => {
    const supabase = createClient()
    set({ isLoading: true, error: null })

    try {
      // 1. 元のエントリを取得
      const { data: oldEntry, error: fetchError } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // 2. エントリを削除
      const { error: deleteError } = await supabase
        .from('progress_entries')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // 3. 短期目標のcurrent_valueを調整
      const { data: goal, error: goalFetchError } = await supabase
        .from('short_term_goals')
        .select('current_value')
        .eq('id', oldEntry.short_term_goal_id)
        .single()

      if (goalFetchError) throw goalFetchError

      const newGoalValue = Math.max(0, (goal.current_value || 0) - oldEntry.value)

      const { error: goalUpdateError } = await supabase
        .from('short_term_goals')
        .update({ current_value: newGoalValue })
        .eq('id', oldEntry.short_term_goal_id)

      if (goalUpdateError) throw goalUpdateError

      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('進捗削除エラー:', error)
      set({
        error: error instanceof Error ? error.message : '進捗の削除に失敗しました',
        isLoading: false
      })
      return false
    }
  }
}))
