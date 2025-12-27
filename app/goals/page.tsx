'use client'

import { useEffect, useState } from 'react'
import { useVisionStore } from '@/stores/visionStore'
import { useThemeStore } from '@/stores/themeStore'
import { VisionCard } from '@/components/goals/VisionCard'
import { CreateVisionModal } from '@/components/goals/CreateVisionModal'
import MainLayout from '@/components/layout/MainLayout'
import { Plus, Target, ArrowRight } from 'lucide-react'

export default function GoalsPage() {
  const { visions, loading, fetchVisions } = useVisionStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    fetchVisions()
  }, [fetchVisions])

  const handleRefresh = () => {
    fetchVisions()
  }

  return (
    <MainLayout>
      <div className="max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between" data-tutorial="vision-section">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>目標管理</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              1年後ビジョン → 長期目標 → 短期目標 → 習慣の階層で管理
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            data-tutorial="add-vision-button"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all duration-200 shadow-lg shadow-primary-500/25 font-semibold btn-hover"
          >
            <Plus className="w-4 h-4" />
            1年後ビジョンを追加
          </button>
        </div>

        {/* 階層説明 */}
        <div className={`mb-8 rounded-2xl p-5 ${isDark ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-primary-50 border border-primary-100'}`}>
          <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>
            <Target className="w-4 h-4" />
            目標管理の仕組み
          </p>
          <div className={`text-sm space-y-2 ${isDark ? 'text-primary-200' : 'text-primary-800'}`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">🎯 1年後ビジョン</span>
              <ArrowRight className="w-3 h-3 opacity-50" />
              <span className="opacity-80">6〜18ヶ月で達成したい大きな目標</span>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <span className="font-medium">📎 長期目標</span>
              <ArrowRight className="w-3 h-3 opacity-50" />
              <span className="opacity-80">ビジョン期間の半分で達成</span>
            </div>
            <div className="flex items-center gap-2 pl-8">
              <span className="font-medium">📋 短期目標</span>
              <ArrowRight className="w-3 h-3 opacity-50" />
              <span className="opacity-80">毎月最低1つ設定する月次目標</span>
            </div>
            <div className="flex items-center gap-2 pl-12">
              <span className="font-medium">✅ 習慣</span>
              <ArrowRight className="w-3 h-3 opacity-50" />
              <span className="opacity-80">短期目標達成のための日々のタスク</span>
            </div>
          </div>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            <p className={`mt-3 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>読み込み中...</p>
          </div>
        )}

        {/* ビジョン一覧 */}
        {!loading && visions.length === 0 && (
          <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-surface-50 border border-surface-200'}`}>
            <div className="text-6xl mb-4">🎯</div>
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>まだ1年後ビジョンがありません</p>
            <p className={`mb-6 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
              「+ 1年後ビジョンを追加」ボタンから大きな目標を設定しましょう
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-primary-500 hover:text-primary-600 font-medium hover:underline"
            >
              最初のビジョンを作成する →
            </button>
          </div>
        )}

        {!loading && visions.length > 0 && (
          <div className="space-y-6">
            {visions.map(vision => (
              <VisionCard
                key={vision.id}
                vision={vision}
                onUpdated={handleRefresh}
              />
            ))}
          </div>
        )}

        {/* ビジョン作成モーダル */}
        <CreateVisionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleRefresh}
        />
      </div>
    </MainLayout>
  )
}
