import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { calculateStreakBonus, shouldLevelUp, getLevelInfo, getThemeUnlockAtLevel, type LevelInfo } from '@/utils/levelSystem'
import { format, parseISO, differenceInDays, isYesterday, isToday } from 'date-fns'

export interface UserProfile {
  id: string
  user_id: string
  total_experience_points: number
  current_streak: number
  longest_streak: number
  last_completion_date: string | null
  total_tasks_completed: number
  total_habits_completed: number
  created_at: string
  updated_at: string
}

interface XPGainResult {
  baseXP: number
  streakBonus: number
  totalXP: number
  newStreak: number
  isStreakExtended: boolean
  leveledUp: boolean
  newLevel: number | undefined
}

interface UserProfileState {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  lastXPGain: XPGainResult | null

  // Actions
  fetchProfile: () => Promise<void>
  initializeProfile: () => Promise<void>
  addXPForHabitCompletion: (taskId: string) => Promise<XPGainResult | null>
  getLevelInfo: () => LevelInfo

  // Internal helpers
  updateStreak: (completionDate: Date) => Promise<{ newStreak: number; isExtended: boolean }>
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  lastXPGain: null,

  fetchProfile: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // プロファイルが存在しない場合は作成
        if (error.code === 'PGRST116') {
          await get().initializeProfile()
          return
        }
        throw error
      }

      set({ profile: data, loading: false })
    } catch (error: any) {
      console.error('プロファイル取得エラー:', error)
      set({ error: error.message, loading: false })
    }
  },

  initializeProfile: async () => {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          total_experience_points: 0,
          current_streak: 0,
          longest_streak: 0,
          total_tasks_completed: 0,
          total_habits_completed: 0,
        })
        .select()
        .single()

      if (error) throw error

      set({ profile: data, loading: false })
    } catch (error: any) {
      console.error('プロファイル初期化エラー:', error)
      set({ error: error.message, loading: false })
    }
  },

  updateStreak: async (completionDate: Date) => {
    const profile = get().profile
    if (!profile) return { newStreak: 1, isExtended: true }

    const lastDate = profile.last_completion_date
      ? parseISO(profile.last_completion_date)
      : null

    let newStreak = profile.current_streak
    let isExtended = false

    if (!lastDate) {
      // 初回完了
      newStreak = 1
      isExtended = true
    } else if (isToday(lastDate)) {
      // 今日既に完了している → ストリークは変わらない
      newStreak = profile.current_streak
      isExtended = false
    } else if (isYesterday(lastDate)) {
      // 昨日完了している → ストリーク継続
      newStreak = profile.current_streak + 1
      isExtended = true
    } else {
      const daysDiff = differenceInDays(completionDate, lastDate)
      if (daysDiff === 0) {
        // 同日 → 変わらない
        newStreak = profile.current_streak
        isExtended = false
      } else if (daysDiff === 1) {
        // 翌日 → ストリーク継続
        newStreak = profile.current_streak + 1
        isExtended = true
      } else {
        // 2日以上空いた → ストリークリセット
        newStreak = 1
        isExtended = true
      }
    }

    return { newStreak, isExtended }
  },

  addXPForHabitCompletion: async (taskId: string) => {
    const supabase = createClient()
    const profile = get().profile

    if (!profile) {
      await get().fetchProfile()
      const newProfile = get().profile
      if (!newProfile) return null
    }

    const currentProfile = get().profile!

    try {
      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')

      // ストリーク更新
      const { newStreak, isExtended } = await get().updateStreak(now)

      // XP計算
      const baseXP = 1 // 習慣1回達成につき1XP
      const streakBonus = calculateStreakBonus(newStreak)
      const totalXP = baseXP + streakBonus

      // 新しい経験値
      const oldXP = currentProfile.total_experience_points
      const newXP = oldXP + totalXP

      // レベルアップチェック
      const leveledUp = shouldLevelUp(oldXP, newXP)
      const newLevelInfo = getLevelInfo(newXP)

      // レベルアップ時のテーマ解放チェック（循環参照回避のため動的インポート）
      if (leveledUp) {
        const unlockedTheme = getThemeUnlockAtLevel(newLevelInfo.level)
        if (unlockedTheme) {
          import('@/stores/themeStore').then(({ useThemeStore }) => {
            useThemeStore.getState().unlockTheme(unlockedTheme)
          })
        }
      }

      // 最長ストリーク更新
      const newLongestStreak = Math.max(currentProfile.longest_streak, newStreak)

      // データベース更新
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          total_experience_points: newXP,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_completion_date: today,
          total_habits_completed: currentProfile.total_habits_completed + 1,
          total_tasks_completed: currentProfile.total_tasks_completed + 1,
        })
        .eq('id', currentProfile.id)

      if (profileError) throw profileError

      // XP獲得履歴を記録
      const { error: transactionError } = await supabase
        .from('xp_transactions')
        .insert({
          user_id: currentProfile.user_id,
          amount: totalXP,
          source_type: 'habit_completion',
          source_id: taskId,
          streak_at_time: newStreak,
        })

      if (transactionError) {
        console.warn('XP履歴の記録に失敗:', transactionError)
        // 履歴記録の失敗は無視（メイン機能には影響しない）
      }

      const result: XPGainResult = {
        baseXP,
        streakBonus,
        totalXP,
        newStreak,
        isStreakExtended: isExtended,
        leveledUp,
        newLevel: leveledUp ? newLevelInfo.level : undefined,
      }

      // ローカル状態更新
      set({
        profile: {
          ...currentProfile,
          total_experience_points: newXP,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_completion_date: today,
          total_habits_completed: currentProfile.total_habits_completed + 1,
          total_tasks_completed: currentProfile.total_tasks_completed + 1,
        },
        lastXPGain: result,
      })

      return result
    } catch (error: any) {
      console.error('XP付与エラー:', error)
      set({ error: error.message })
      return null
    }
  },

  getLevelInfo: () => {
    const profile = get().profile
    if (!profile) {
      return getLevelInfo(0)
    }
    return getLevelInfo(profile.total_experience_points)
  },
}))
