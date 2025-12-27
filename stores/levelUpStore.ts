'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LevelUpAnimationVersion } from '@/components/levelup/LevelUpAnimation'

// アニメーション定義
export interface LevelUpAnimationDefinition {
  id: LevelUpAnimationVersion
  name: string
  description: string
  icon: string
  gradient: string
}

export const LEVELUP_ANIMATIONS: LevelUpAnimationDefinition[] = [
  {
    id: 'gold',
    name: 'Gold',
    description: 'ゴールドパーティクル爆発',
    icon: '✨',
    gradient: 'from-amber-400 to-yellow-500'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'オーロラの波とグロー',
    icon: '🌌',
    gradient: 'from-teal-400 via-purple-500 to-pink-500'
  },
  {
    id: 'epic',
    name: 'Epic',
    description: '衝撃波とパーティクル',
    icon: '💥',
    gradient: 'from-violet-500 via-fuchsia-500 to-cyan-400'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'シンプル・エレガント',
    icon: '◯',
    gradient: 'from-gray-400 to-gray-600'
  },
  {
    id: 'minimal-progressive',
    name: 'Progressive',
    description: 'レベル連動・段階的演出',
    icon: '📈',
    gradient: 'from-gray-500 via-blue-500 to-amber-500'
  },
  {
    id: 'progressive-v2',
    name: 'Progressive+',
    description: '高品質・フルエフェクト版',
    icon: '🌟',
    gradient: 'from-slate-600 via-blue-500 to-amber-400'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: '洗練された高貴な演出',
    icon: '💎',
    gradient: 'from-amber-200 via-yellow-400 to-amber-600'
  },
  {
    id: 'aurora-progressive',
    name: 'Aurora+',
    description: '神秘的なオーロラ演出',
    icon: '🌌',
    gradient: 'from-teal-400 via-purple-500 to-pink-500'
  },
  {
    id: 'rpg',
    name: 'RPG',
    description: 'クラシックRPGスタイル',
    icon: '⚔️',
    gradient: 'from-yellow-400 via-amber-500 to-orange-500'
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    description: '宇宙・銀河・星雲',
    icon: '🌠',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500'
  }
]

interface LevelUpState {
  // アニメーション設定
  selectedAnimation: LevelUpAnimationVersion
  setSelectedAnimation: (animation: LevelUpAnimationVersion) => void

  // レベルアップイベント
  pendingLevelUp: { newLevel: number; previousLevel: number } | null
  triggerLevelUp: (newLevel: number, previousLevel: number) => void
  clearLevelUp: () => void

  // プレビューモード
  isPreviewMode: boolean
  previewLevel: number
  startPreview: (animation: LevelUpAnimationVersion, level?: number) => void
  endPreview: () => void
}

export const useLevelUpStore = create<LevelUpState>()(
  persist(
    (set, get) => ({
      selectedAnimation: 'gold',
      pendingLevelUp: null,
      isPreviewMode: false,
      previewLevel: 5,

      setSelectedAnimation: (animation) => {
        set({ selectedAnimation: animation })
      },

      triggerLevelUp: (newLevel, previousLevel) => {
        set({ pendingLevelUp: { newLevel, previousLevel } })
      },

      clearLevelUp: () => {
        set({ pendingLevelUp: null })
      },

      startPreview: (animation, level = 5) => {
        set({
          isPreviewMode: true,
          previewLevel: level,
          selectedAnimation: animation
        })
      },

      endPreview: () => {
        set({ isPreviewMode: false })
      }
    }),
    {
      name: 'levelup-storage',
      partialize: (state) => ({
        selectedAnimation: state.selectedAnimation
      })
    }
  )
)
