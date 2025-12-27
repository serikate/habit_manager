'use client'

import { useEffect, useRef } from 'react'
import { X, ClipboardList, Settings, AlertTriangle, Check } from 'lucide-react'
import { useHabitReviewStore, type HabitSnapshot } from '@/stores/habitReviewStore'

interface WeeklyReviewPopupProps {
  habits: HabitSnapshot[]
  onOpenSettings: () => void
}

export function WeeklyReviewPopup({ habits, onOpenSettings }: WeeklyReviewPopupProps) {
  const {
    isWeeklyPopupOpen,
    selectedHabitIds,
    closeWeeklyPopup,
    toggleHabitSelection,
    selectAllHabits,
    startSelectedReviews,
    skipWeeklyReview,
  } = useHabitReviewStore()

  const scrollRef = useRef<HTMLDivElement>(null)

  // 初期状態で全習慣を選択
  useEffect(() => {
    if (isWeeklyPopupOpen && habits.length > 0 && selectedHabitIds.length === 0) {
      selectAllHabits(habits.map(h => h.id))
    }
  }, [isWeeklyPopupOpen, habits, selectedHabitIds.length, selectAllHabits])

  if (!isWeeklyPopupOpen) return null

  const selectedCount = selectedHabitIds.length

  const handleStartReview = () => {
    startSelectedReviews(habits)
  }

  const handleOpenSettings = () => {
    closeWeeklyPopup()
    onOpenSettings()
  }

  const handleToggle = (habitId: string) => {
    // スクロール位置を保存
    const scrollTop = scrollRef.current?.scrollTop || 0
    toggleHabitSelection(habitId)
    // スクロール位置を復元
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollTop
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeWeeklyPopup}
      />

      {/* ポップアップ */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              <h2 className="text-lg font-semibold">週間レビューの時間です</h2>
            </div>
            <button
              onClick={closeWeeklyPopup}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-white/80">
            習慣の振り返りを行いましょう
          </p>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3">
            レビューする習慣を選択してください：
          </p>

          {/* 習慣リスト - 高さ固定でスクロール */}
          <div
            ref={scrollRef}
            className="h-72 overflow-y-auto overscroll-contain"
          >
            <div className="space-y-2 pr-1">
              {habits.map((habit) => {
                const isSelected = selectedHabitIds.includes(habit.id)
                const isLowAchievement = (habit.achievement_rate || 0) < 50

                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggle(habit.id)}
                    className={`flex items-center gap-3 p-3 h-14 rounded-xl cursor-pointer border-2 flex-shrink-0 ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500'
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {/* チェックボックス - 常に同じサイズ */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <Check className={`w-3 h-3 text-white ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>

                    {/* 習慣名 */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {habit.name}
                      </span>
                      {isLowAchievement && (
                        <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          要注意
                        </span>
                      )}
                    </div>

                    {/* 達成率 */}
                    <span
                      className={`text-sm font-medium flex-shrink-0 ${
                        isLowAchievement ? 'text-orange-600' : 'text-gray-600'
                      }`}
                    >
                      {(habit.achievement_rate || 0).toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {habits.some(h => (h.achievement_rate || 0) < 50) && (
            <p className="text-xs text-orange-600 mt-3 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              達成率50%未満の習慣はレビューを推奨します
            </p>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50 space-y-2">
          <button
            onClick={handleStartReview}
            disabled={selectedCount === 0}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              selectedCount > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            レビューを開始（{selectedCount}件）
          </button>

          <div className="flex gap-2">
            <button
              onClick={skipWeeklyReview}
              className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              スキップ
            </button>
            <button
              onClick={handleOpenSettings}
              className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Settings className="w-4 h-4" />
              通知設定
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
