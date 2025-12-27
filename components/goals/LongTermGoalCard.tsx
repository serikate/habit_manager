'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoalStore } from '@/stores/goalStore'
import { useTutorialStore } from '@/stores/tutorialStore'
import type { LongTermGoal, ShortTermGoal } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { ShortTermGoalCard } from './ShortTermGoalCard'
import { CreateShortTermGoalModal } from './CreateShortTermGoalModal'
import { getProgressColorClass } from '@/utils/goalProgressCalculator'

interface LongTermGoalCardProps {
  goal: LongTermGoal
  onUpdated?: () => void
}

export function LongTermGoalCard({ goal, onUpdated }: LongTermGoalCardProps) {
  const router = useRouter()
  const { calculateLongTermGoalProgress, deleteLongTermGoal, loading } = useGoalStore()
  const { isActive, getCurrentStep, currentStepIndex } = useTutorialStore()
  const [progress, setProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCreateStgModal, setShowCreateStgModal] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // チュートリアルで短期目標追加ステップの場合、自動的に展開
  useEffect(() => {
    if (isActive) {
      const currentStep = getCurrentStep()
      if (currentStep?.id === 'add-short-term-goal') {
        setExpanded(true)
      }
    }
  }, [isActive, currentStepIndex, getCurrentStep])

  useEffect(() => {
    const fetchProgress = async () => {
      const progressValue = await calculateLongTermGoalProgress(goal.id)
      setProgress(progressValue)
    }
    fetchProgress()
  }, [goal.id, goal.short_term_goals, calculateLongTermGoalProgress])

  const handleDelete = async () => {
    setDeleting(true)
    const success = await deleteLongTermGoal(goal.id)
    if (success) {
      setShowDeleteConfirm(false)
      onUpdated?.()
    }
    setDeleting(false)
  }

  const handleCardClick = () => {
    router.push(`/goals/${goal.id}`)
  }

  // 期間（period_monthsを優先、なければperiodを使用）
  const periodMonths = goal.period_months || goal.period

  // 期限までの残り日数を計算
  const getDaysRemaining = () => {
    const deadline = new Date(goal.deadline)
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()
  const shortTermGoals = goal.short_term_goals || []

  // 月ごとに短期目標をグループ化
  const groupByMonth = (goals: ShortTermGoal[]) => {
    const grouped = new Map<string, ShortTermGoal[]>()
    for (const g of goals) {
      const month = g.target_month || g.created_at.slice(0, 7) + '-01'
      if (!grouped.has(month)) {
        grouped.set(month, [])
      }
      grouped.get(month)!.push(g)
    }
    // 月でソート
    return new Map([...grouped.entries()].sort())
  }

  const groupedGoals = groupByMonth(shortTermGoals)

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">📎</span>
              <h3 className="font-bold text-gray-900">{goal.title}</h3>
              {goal.is_achieved && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  達成!
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>{periodMonths}ヶ月</span>
              <span>期限: {format(new Date(goal.deadline), 'yyyy/M/d', { locale: ja })}</span>
              <span className={daysRemaining < 30 ? 'text-red-500' : ''}>
                残り{daysRemaining > 0 ? `${daysRemaining}日` : '期限切れ'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-2">
              <span className="text-lg font-bold">{progress.toFixed(1)}%</span>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {/* 進捗バー */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColorClass(progress)}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* 短期目標サマリー */}
        <div className="mt-2 text-sm text-gray-600">
          短期目標: {shortTermGoals.filter(g => g.is_achieved).length} / {shortTermGoals.length} 達成
        </div>
      </div>

      {/* 展開時の短期目標リスト */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {shortTermGoals.length > 0 ? (
            <div className="mt-4 space-y-4">
              {Array.from(groupedGoals.entries()).map(([month, goals]) => {
                const monthDate = new Date(month)
                const monthLabel = `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`
                return (
                  <div key={month}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      {monthLabel}
                      <span className="text-gray-400">({goals.length}個)</span>
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {goals.map(stg => (
                        <ShortTermGoalCard
                          key={stg.id}
                          goal={stg}
                          {...(onUpdated ? { onGoalUpdated: onUpdated } : {})}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 text-center py-6 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 mb-2">短期目標がありません</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCreateStgModal(true)
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                最初の短期目標を追加する
              </button>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowCreateStgModal(true)
              }}
              data-tutorial="add-stg-button"
              className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              短期目標を追加
            </button>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCardClick()
                }}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                詳細
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">長期目標を削除</h3>
            <p className="text-gray-600 mb-4">
              「{goal.title}」を削除しますか？
            </p>
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg mb-4">
              紐づく短期目標も削除されます。
              習慣は削除されず、紐づけのみ解除されます。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 短期目標作成モーダル */}
      <CreateShortTermGoalModal
        isOpen={showCreateStgModal}
        onClose={() => setShowCreateStgModal(false)}
        longTermGoalId={goal.id}
        longTermGoalDeadline={goal.deadline}
        onCreated={() => {
          setShowCreateStgModal(false)
          onUpdated?.()
        }}
      />
    </div>
  )
}
