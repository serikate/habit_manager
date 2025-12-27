'use client'

import { create } from 'zustand'

interface XPInfo {
  baseXP: number
  streakBonus: number
  totalXP: number
  newStreak: number
  isStreakExtended: boolean
  leveledUp: boolean
  newLevel: number | undefined
  // レベル進捗情報
  previousProgress: number  // 獲得前の進捗 (0-100)
  currentProgress: number   // 獲得後の進捗 (0-100)
  currentLevelXP: number    // 現在レベル内のXP
  requiredXP: number        // 次のレベルに必要なXP (100)
  currentLevel: number      // 現在のレベル
}

interface HabitCompletionState {
  // 完了した習慣の情報
  completedHabit: {
    id: string
    name: string
  } | null

  // XP情報
  xpInfo: XPInfo | null

  // ポップアップの表示制御
  isVisible: boolean

  // アクション
  showCompletion: (id: string, name: string, xpInfo?: XPInfo) => void
  hideCompletion: () => void
}

export const useHabitCompletionStore = create<HabitCompletionState>((set) => ({
  completedHabit: null,
  xpInfo: null,
  isVisible: false,

  showCompletion: (id: string, name: string, xpInfo?: XPInfo) => {
    set({
      completedHabit: { id, name },
      xpInfo: xpInfo || null,
      isVisible: true
    })
  },

  hideCompletion: () => {
    set({
      completedHabit: null,
      xpInfo: null,
      isVisible: false
    })
  }
}))
