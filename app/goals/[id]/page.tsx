'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGoalStore } from '@/stores/goalStore'
import { ShortTermGoalCard } from '@/components/goals/ShortTermGoalCard'
import { CreateShortTermGoalModal } from '@/components/goals/CreateShortTermGoalModal'
import MainLayout from '@/components/layout/MainLayout'
import type { LongTermGoal, ShortTermGoal } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getProgressColorClass } from '@/utils/goalProgressCalculator'

export default function LongTermGoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { longTermGoals, shortTermGoals, fetchLongTermGoals, fetchShortTermGoals, calculateLongTermGoalProgress } = useGoalStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  const goalId = params.id as string
  const longTermGoal = longTermGoals.find(g => g.id === goalId)

  useEffect(() => {
    if (!longTermGoals.length) {
      fetchLongTermGoals()
    }
    fetchShortTermGoals(goalId)
  }, [goalId, fetchLongTermGoals, fetchShortTermGoals, longTermGoals.length])

  useEffect(() => {
    if (goalId) {
      const fetchProgress = async () => {
        const progressValue = await calculateLongTermGoalProgress(goalId)
        setProgress(progressValue)
      }
      fetchProgress()
    }
  }, [goalId, calculateLongTermGoalProgress, shortTermGoals])

  // 月ごとに短期目標をグループ化
  const groupedByMonth = useMemo(() => {
    const relatedGoals = shortTermGoals.filter(g => g.long_term_goal_id === goalId)
    const grouped = new Map<string, ShortTermGoal[]>()

    for (const goal of relatedGoals) {
      const month = goal.target_month || goal.created_at.slice(0, 7) + '-01'
      if (!grouped.has(month)) {
        grouped.set(month, [])
      }
      grouped.get(month)!.push(goal)
    }

    // 月でソート
    return new Map([...grouped.entries()].sort())
  }, [shortTermGoals, goalId])

  const handleRefresh = () => {
    fetchShortTermGoals(goalId)
    fetchLongTermGoals()
  }

  if (!longTermGoal) {
    return (
      <MainLayout>
        <div className="max-w-6xl">
          <div className="text-center py-12">
            <p className="text-gray-600">長期目標が見つかりません</p>
            <button
              onClick={() => router.push('/goals')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              目標一覧に戻る
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const relatedShortTermGoals = shortTermGoals.filter(g => g.long_term_goal_id === goalId)

  // 期間（period_monthsを優先、なければperiodを使用）
  const periodMonths = longTermGoal.period_months || longTermGoal.period

  return (
    <MainLayout>
      <div className="max-w-6xl">
      {/* 戻るボタン */}
      <button
        onClick={() => router.push('/goals')}
        className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-1"
      >
        ← 目標一覧に戻る
      </button>

      {/* 長期目標の詳細 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{longTermGoal.title}</h1>
            {longTermGoal.description && (
              <p className="text-gray-600">{longTermGoal.description}</p>
            )}
          </div>
          {longTermGoal.is_achieved && (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              達成済み
            </span>
          )}
        </div>

        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">全体の進捗</span>
            <span className="text-lg font-bold text-gray-900">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${getProgressColorClass(progress)}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* 目標情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 block">期間</span>
            <span className="font-medium">{periodMonths}ヶ月</span>
          </div>
          <div>
            <span className="text-gray-600 block">期限</span>
            <span className="font-medium">
              {format(new Date(longTermGoal.deadline), 'yyyy/MM/dd', { locale: ja })}
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">短期目標</span>
            <span className="font-medium">{relatedShortTermGoals.length}個</span>
          </div>
          <div>
            <span className="text-gray-600 block">達成済み</span>
            <span className="font-medium text-green-600">
              {relatedShortTermGoals.filter(g => g.is_achieved).length}個
            </span>
          </div>
        </div>
      </div>

      {/* 短期目標セクション */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">短期目標</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          + 短期目標を追加
        </button>
      </div>

      {/* 短期目標一覧 */}
      {relatedShortTermGoals.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">まだ短期目標がありません</p>
          <p className="text-gray-500 mt-2">「+ 短期目標を追加」ボタンから目標を作成しましょう</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 text-blue-600 hover:underline"
          >
            最初の短期目標を追加する
          </button>
        </div>
      )}

      {relatedShortTermGoals.length > 0 && (
        <div className="space-y-6">
          {Array.from(groupedByMonth.entries()).map(([month, goals]) => {
            const monthDate = new Date(month)
            const monthLabel = `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`
            const achievedCount = goals.filter(g => g.is_achieved).length
            return (
              <div key={month} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full" />
                  {monthLabel}
                  <span className="text-sm font-normal text-gray-500">
                    ({achievedCount}/{goals.length} 達成)
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.map(goal => (
                    <ShortTermGoalCard
                      key={goal.id}
                      goal={goal}
                      onGoalUpdated={handleRefresh}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 短期目標作成モーダル */}
      <CreateShortTermGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        longTermGoalId={goalId}
        longTermGoalDeadline={longTermGoal.deadline}
        onCreated={handleRefresh}
      />
      </div>
    </MainLayout>
  )
}
