'use client'

import { useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { WeeklyReviewPopup } from '@/components/habits/WeeklyReviewPopup'
import { HabitReviewModal } from '@/components/habits/HabitReviewModal'
import { useThemeStore } from '@/stores/themeStore'
import { useHabitStore } from '@/stores/habitStore'
import { useHabitReviewStore, type HabitSnapshot } from '@/stores/habitReviewStore'
import { useRouter } from 'next/navigation'
import { RefreshCw, Play, Settings, ClipboardList } from 'lucide-react'

export default function ReviewPage() {
  const router = useRouter()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  const { habits, fetchHabits } = useHabitStore()
  const { openWeeklyPopup, settings } = useHabitReviewStore()

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  // 習慣データをHabitSnapshot形式に変換
  const habitSnapshots: HabitSnapshot[] = habits.map((habit: any) => ({
    id: habit.id,
    name: habit.name,
    achievement_rate: habit.achievement_rate || 0,
    streak_current: habit.streak_current || 0,
    streak_max: habit.streak_max || 0,
    total_days: habit.total_days || 0,
    level: habit.level || 1,
  }))

  // 曜日ラベル
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土']

  const handleStartReview = () => {
    if (habitSnapshots.length === 0) {
      alert('レビューする習慣がありません。まず習慣を登録してください。')
      return
    }
    openWeeklyPopup()
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>習慣レビュー</h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
            定期的に習慣を見直して、目標達成に向けて最適化しましょう
          </p>
        </div>

        {/* レビュー開始カード */}
        <div className={`rounded-2xl p-8 ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`text-xl font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
                <ClipboardList className="w-5 h-5 text-purple-500" />
                週間レビュー
              </h2>
              <p className={`text-sm mb-4 ${isDark ? 'text-surface-300' : 'text-surface-600'}`}>
                習慣が目標達成に貢献しているか、5つの質問で評価します
              </p>

              {/* 現在の設定表示 */}
              <div className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                <span>通知設定: </span>
                {settings.enabled ? (
                  <span>毎週{dayLabels[settings.dayOfWeek]}曜日 {settings.hour}:{String(settings.minute).padStart(2, '0')}</span>
                ) : (
                  <span className="text-orange-500">オフ</span>
                )}
              </div>
            </div>

            <button
              onClick={handleStartReview}
              disabled={habitSnapshots.length === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                habitSnapshots.length > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              今週のレビューを始める
            </button>
          </div>

          {/* 習慣数表示 */}
          <div className={`mt-6 pt-6 border-t ${isDark ? 'border-purple-700/50' : 'border-purple-200'}`}>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {habitSnapshots.length}
                </div>
                <div className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                  登録習慣数
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  {habitSnapshots.filter(h => h.achievement_rate < 50).length}
                </div>
                <div className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                  要注意（50%未満）
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {habitSnapshots.filter(h => h.achievement_rate >= 80).length}
                </div>
                <div className={`text-xs ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                  好調（80%以上）
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* レビュー基準の説明 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
            <RefreshCw className="w-5 h-5 text-primary-500" />
            レビュー判定基準
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>継続推奨</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-600'}`}>スコア80%以上</p>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🔄</span>
                <span className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>調整推奨</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>スコア60-79%</p>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚠️</span>
                <span className={`font-medium ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>要検討</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>スコア40-59%</p>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">❌</span>
                <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>中止検討</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>スコア40%未満</p>
            </div>
          </div>
        </div>

        {/* 設定へのリンク */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/settings')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              isDark
                ? 'text-surface-400 hover:text-white hover:bg-surface-700'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            レビュー通知設定
          </button>
        </div>

        {/* 週間レビューポップアップ */}
        <WeeklyReviewPopup
          habits={habitSnapshots}
          onOpenSettings={() => router.push('/settings')}
        />

        {/* レビューモーダル */}
        <HabitReviewModal />
      </div>
    </MainLayout>
  )
}
