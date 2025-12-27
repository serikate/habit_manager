'use client'

import { useState, useEffect } from 'react'
import { Vision, LongTermGoal } from '@/types'
import { useVisionStore } from '@/stores/visionStore'
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { LongTermGoalCard } from './LongTermGoalCard'
import { CreateLongTermGoalModal } from './CreateLongTermGoalModal'
import { getProgressColorClass } from '@/utils/goalProgressCalculator'

interface VisionCardProps {
  vision: Vision
  onUpdated?: () => void
}

export function VisionCard({ vision, onUpdated }: VisionCardProps) {
  const { calculateVisionProgress, deleteVision } = useVisionStore()
  const [progress, setProgress] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCreateLtgModal, setShowCreateLtgModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchProgress = async () => {
      const value = await calculateVisionProgress(vision.id)
      setProgress(value)
    }
    fetchProgress()
  }, [vision.id, vision.long_term_goals, calculateVisionProgress])

  const handleDelete = async () => {
    setDeleting(true)
    const success = await deleteVision(vision.id)
    if (success) {
      setShowDeleteConfirm(false)
      onUpdated?.()
    }
    setDeleting(false)
  }

  const longTermGoals = vision.long_term_goals || []

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* ヘッダー */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-bold">{vision.title}</h2>
              {vision.is_achieved && (
                <span className="px-2 py-1 bg-white/20 rounded-full text-sm">
                  達成!
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm mt-1">
              期間: {vision.period_months}ヶ月 |
              期限: {format(new Date(vision.deadline), 'yyyy年M月d日', { locale: ja })}
            </p>
            {vision.description && (
              <p className="text-white/70 text-sm mt-2">{vision.description}</p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* 進捗バー */}
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span>進捗</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColorClass(progress)}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 長期目標リスト */}
      {expanded && (
        <div className="p-4">
          {longTermGoals.length > 0 ? (
            <div className="space-y-3">
              {longTermGoals.map((ltg: LongTermGoal) => (
                <LongTermGoalCard
                  key={ltg.id}
                  goal={ltg}
                  {...(onUpdated ? { onUpdated } : {})}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-3">長期目標がありません</p>
              <button
                onClick={() => setShowCreateLtgModal(true)}
                className="text-blue-600 hover:underline text-sm"
              >
                最初の長期目標を追加する
              </button>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <button
              onClick={() => setShowCreateLtgModal(true)}
              data-tutorial="add-ltg-button"
              className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              長期目標を追加
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              削除
            </button>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">ビジョンを削除</h3>
            <p className="text-gray-600 mb-4">
              「{vision.title}」を削除しますか？
            </p>
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg mb-4">
              紐づく長期目標・短期目標も削除されます。
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

      {/* 長期目標作成モーダル */}
      <CreateLongTermGoalModal
        isOpen={showCreateLtgModal}
        onClose={() => setShowCreateLtgModal(false)}
        visionId={vision.id}
        visionPeriodMonths={vision.period_months}
        onCreated={() => {
          setShowCreateLtgModal(false)
          onUpdated?.()
        }}
      />
    </div>
  )
}
