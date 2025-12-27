'use client'

import { useEffect, useRef } from 'react'
import { X, ChevronRight, BarChart3 } from 'lucide-react'
import { useHabitReviewStore } from '@/stores/habitReviewStore'
import {
  QUESTION_LABELS,
  QUESTION_SHORT_LABELS,
  ANSWER_OPTIONS,
  getJudgmentLabel,
  type ReviewAnswers,
} from '@/utils/habitReviewCalculator'

export function HabitReviewModal() {
  const {
    isModalOpen,
    currentHabitIndex,
    habitsToReview,
    answers,
    result,
    showResult,
    isSubmitting,
    closeModal,
    setAnswer,
    calculateResult,
    submitReview,
    nextHabit,
  } = useHabitReviewStore()

  const scrollRef = useRef<HTMLDivElement>(null)

  const currentHabit = habitsToReview[currentHabitIndex]
  const isLastHabit = currentHabitIndex === habitsToReview.length - 1
  const allAnswered = Object.values(answers).every(v => v !== null)

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    if (isModalOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isModalOpen, closeModal])

  // 習慣が変わったらスクロールをトップに戻す
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [currentHabitIndex])

  if (!isModalOpen || !currentHabit) return null

  const handleSubmitAndNext = async () => {
    try {
      await submitReview()
      nextHabit()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleSetAnswer = (question: keyof ReviewAnswers, value: number) => {
    // スクロール位置を保存
    const scrollTop = scrollRef.current?.scrollTop || 0
    setAnswer(question, value)
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
        onClick={closeModal}
      />

      {/* モーダル */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 h-[85vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">習慣レビュー</h2>
              <p className="text-sm text-gray-500">
                {currentHabitIndex + 1} / {habitsToReview.length}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4">
          {!showResult ? (
            // 質問画面
            <>
              {/* 習慣情報 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{currentHabit.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">達成率</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {currentHabit.achievement_rate?.toFixed(0) || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">連続</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {currentHabit.streak_current || 0}日
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">継続期間</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {currentHabit.total_days || 0}日
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">レベル</span>
                    <span className="ml-2 font-medium text-gray-900">
                      Lv.{currentHabit.level || 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* 質問 */}
              <div className="space-y-6">
                {(Object.keys(QUESTION_LABELS) as Array<keyof typeof QUESTION_LABELS>).map((key, index) => (
                  <div key={key} className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      Q{index + 1}. {QUESTION_LABELS[key]}
                    </p>
                    <div className="space-y-1">
                      {ANSWER_OPTIONS.map((option) => {
                        const isSelected = answers[key] === option.value
                        return (
                          <div
                            key={option.value}
                            onClick={() => handleSetAnswer(key, option.value)}
                            className={`flex items-center gap-3 p-3 h-12 rounded-lg cursor-pointer border-2 ${
                              isSelected
                                ? 'bg-purple-100 border-purple-500'
                                : 'bg-gray-50 border-transparent hover:bg-gray-100'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              <div className={`w-2 h-2 bg-white rounded-full ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // 結果画面
            result && (
              <div className="text-center py-4">
                {/* スコア */}
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {result.totalScore} / {result.maxScore}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        result.percentage >= 80
                          ? 'bg-green-500'
                          : result.percentage >= 60
                          ? 'bg-yellow-500'
                          : result.percentage >= 40
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500">{result.percentage}%</div>
                </div>

                {/* 判定 */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${result.bgColor} mb-4`}>
                  <span className="text-xl">{result.icon}</span>
                  <span className={`font-semibold ${result.color}`}>
                    {getJudgmentLabel(result.judgment)}
                  </span>
                </div>

                <p className="text-gray-600 mb-6">{result.message}</p>

                {/* 回答内訳 */}
                <div className="bg-gray-50 rounded-xl p-4 text-left">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">回答内訳</h4>
                  <div className="space-y-2">
                    {(Object.keys(QUESTION_SHORT_LABELS) as Array<keyof typeof QUESTION_SHORT_LABELS>).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24 truncate">
                          {QUESTION_SHORT_LABELS[key]}
                        </span>
                        <div className="flex-1 flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              className={`h-2 flex-1 rounded-sm ${
                                n <= (answers[key] || 0)
                                  ? 'bg-purple-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-4">
                          {answers[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          {!showResult ? (
            <button
              onClick={calculateResult}
              disabled={!allAnswered}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                allAnswered
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              結果を見る
            </button>
          ) : (
            <button
              onClick={handleSubmitAndNext}
              disabled={isSubmitting}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                '保存中...'
              ) : isLastHabit ? (
                '完了'
              ) : (
                <>
                  次の習慣へ
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
