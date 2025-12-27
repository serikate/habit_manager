import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'
import { calculateReviewScore, type ReviewResult, type ReviewAnswers } from '@/utils/habitReviewCalculator'

// レビュー設定の型
export interface ReviewSettings {
  enabled: boolean
  dayOfWeek: number  // 0-6 (0=日曜)
  hour: number       // 0-23
  minute: number     // 0-59
  lastSkippedAt: string | null
  lastReviewedAt: string | null
}

// 習慣データの型（スナップショット用）
export interface HabitSnapshot {
  id: string
  name: string
  achievement_rate: number
  streak_current: number
  streak_max: number
  total_days: number
  level: number
}

// ストアの状態型
interface HabitReviewState {
  // レビューモーダル状態
  isModalOpen: boolean
  currentHabitIndex: number
  habitsToReview: HabitSnapshot[]
  answers: {
    q1: number | null
    q2: number | null
    q3: number | null
    q4: number | null
    q5: number | null
  }
  result: ReviewResult | null
  isSubmitting: boolean
  showResult: boolean

  // 週間レビューポップアップ状態
  isWeeklyPopupOpen: boolean
  selectedHabitIds: string[]

  // レビュー設定
  settings: ReviewSettings

  // アクション
  openModal: (habits: HabitSnapshot[]) => void
  closeModal: () => void
  setAnswer: (question: keyof ReviewAnswers, value: number) => void
  calculateResult: () => void
  submitReview: () => Promise<void>
  nextHabit: () => void
  resetAnswers: () => void

  // 週間レビューポップアップ
  openWeeklyPopup: () => void
  closeWeeklyPopup: () => void
  toggleHabitSelection: (habitId: string) => void
  selectAllHabits: (habitIds: string[]) => void
  startSelectedReviews: (habits: HabitSnapshot[]) => void
  skipWeeklyReview: () => void

  // 設定
  updateSettings: (settings: Partial<ReviewSettings>) => void
  shouldShowWeeklyPopup: () => boolean
  markReviewCompleted: () => void
}

// デフォルト設定
const DEFAULT_SETTINGS: ReviewSettings = {
  enabled: true,
  dayOfWeek: 0,  // 日曜日
  hour: 18,
  minute: 0,
  lastSkippedAt: null,
  lastReviewedAt: null,
}

export const useHabitReviewStore = create<HabitReviewState>()(
  persist(
    (set, get) => ({
      // 初期状態
      isModalOpen: false,
      currentHabitIndex: 0,
      habitsToReview: [],
      answers: { q1: null, q2: null, q3: null, q4: null, q5: null },
      result: null,
      isSubmitting: false,
      showResult: false,

      isWeeklyPopupOpen: false,
      selectedHabitIds: [],

      settings: DEFAULT_SETTINGS,

      // レビューモーダルを開く
      openModal: (habits) => {
        set({
          isModalOpen: true,
          currentHabitIndex: 0,
          habitsToReview: habits,
          answers: { q1: null, q2: null, q3: null, q4: null, q5: null },
          result: null,
          showResult: false,
        })
      },

      // レビューモーダルを閉じる
      closeModal: () => {
        set({ isModalOpen: false })
        setTimeout(() => {
          set({
            currentHabitIndex: 0,
            habitsToReview: [],
            answers: { q1: null, q2: null, q3: null, q4: null, q5: null },
            result: null,
            showResult: false,
          })
        }, 300)
      },

      // 回答をセット
      setAnswer: (question, value) => {
        set((state) => ({
          answers: { ...state.answers, [question]: value }
        }))
      },

      // 結果を計算
      calculateResult: () => {
        const { answers } = get()
        if (
          answers.q1 !== null &&
          answers.q2 !== null &&
          answers.q3 !== null &&
          answers.q4 !== null &&
          answers.q5 !== null
        ) {
          const result = calculateReviewScore({
            q1: answers.q1,
            q2: answers.q2,
            q3: answers.q3,
            q4: answers.q4,
            q5: answers.q5,
          })
          set({ result, showResult: true })
        }
      },

      // レビュー結果を保存
      submitReview: async () => {
        const { habitsToReview, currentHabitIndex, answers, result } = get()
        const currentHabit = habitsToReview[currentHabitIndex]
        if (!currentHabit || !result) return

        set({ isSubmitting: true })

        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not found')

          const { error } = await supabase.from('habit_reviews').insert({
            habit_id: currentHabit.id,
            user_id: user.id,
            q1_score: answers.q1,
            q2_score: answers.q2,
            q3_score: answers.q3,
            q4_score: answers.q4,
            q5_score: answers.q5,
            total_score: result.totalScore,
            percentage: result.percentage,
            judgment: result.judgment,
            snapshot: currentHabit,
          })

          if (error) throw error
        } catch (error) {
          console.error('Failed to submit review:', error)
          throw error
        } finally {
          set({ isSubmitting: false })
        }
      },

      // 次の習慣へ
      nextHabit: () => {
        const { currentHabitIndex, habitsToReview } = get()
        if (currentHabitIndex < habitsToReview.length - 1) {
          set({
            currentHabitIndex: currentHabitIndex + 1,
            answers: { q1: null, q2: null, q3: null, q4: null, q5: null },
            result: null,
            showResult: false,
          })
        } else {
          // 全習慣のレビュー完了
          get().markReviewCompleted()
          get().closeModal()
        }
      },

      // 回答をリセット
      resetAnswers: () => {
        set({
          answers: { q1: null, q2: null, q3: null, q4: null, q5: null },
          result: null,
          showResult: false,
        })
      },

      // 週間レビューポップアップを開く
      openWeeklyPopup: () => {
        set({ isWeeklyPopupOpen: true })
      },

      // 週間レビューポップアップを閉じる
      closeWeeklyPopup: () => {
        set({ isWeeklyPopupOpen: false, selectedHabitIds: [] })
      },

      // 習慣の選択をトグル
      toggleHabitSelection: (habitId) => {
        set((state) => {
          const isSelected = state.selectedHabitIds.includes(habitId)
          return {
            selectedHabitIds: isSelected
              ? state.selectedHabitIds.filter(id => id !== habitId)
              : [...state.selectedHabitIds, habitId]
          }
        })
      },

      // 全習慣を選択
      selectAllHabits: (habitIds) => {
        set({ selectedHabitIds: habitIds })
      },

      // 選択した習慣のレビューを開始
      startSelectedReviews: (habits) => {
        const { selectedHabitIds } = get()
        const selectedHabits = habits.filter(h => selectedHabitIds.includes(h.id))
        if (selectedHabits.length > 0) {
          get().closeWeeklyPopup()
          get().openModal(selectedHabits)
        }
      },

      // 週間レビューをスキップ
      skipWeeklyReview: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            lastSkippedAt: new Date().toISOString(),
          },
          isWeeklyPopupOpen: false,
          selectedHabitIds: [],
        }))
      },

      // 設定を更新
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      // 週間ポップアップを表示すべきか判定
      shouldShowWeeklyPopup: () => {
        const { settings } = get()
        if (!settings.enabled) return false

        const now = new Date()
        const currentDay = now.getDay()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()

        // 設定された曜日・時刻を過ぎているか
        const isPastScheduledTime =
          currentDay === settings.dayOfWeek &&
          (currentHour > settings.hour ||
            (currentHour === settings.hour && currentMinute >= settings.minute))

        // または設定曜日より後の曜日か
        const isPastScheduledDay = currentDay > settings.dayOfWeek

        if (!isPastScheduledTime && !isPastScheduledDay) return false

        // 今週既にレビューまたはスキップしたか
        const lastAction = settings.lastReviewedAt || settings.lastSkippedAt
        if (lastAction) {
          const lastActionDate = new Date(lastAction)
          const weekStart = getWeekStart(now, settings.dayOfWeek)
          if (lastActionDate >= weekStart) return false
        }

        return true
      },

      // レビュー完了をマーク
      markReviewCompleted: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            lastReviewedAt: new Date().toISOString(),
          }
        }))
      },
    }),
    {
      name: 'habit-review-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
)

// 週の開始日を取得（設定された曜日を基準）
function getWeekStart(date: Date, dayOfWeek: number): Date {
  const result = new Date(date)
  const currentDay = result.getDay()
  const diff = currentDay >= dayOfWeek
    ? currentDay - dayOfWeek
    : 7 - (dayOfWeek - currentDay)
  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}
