'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useGoalStore } from '@/stores/goalStore'
import type { PeriodPattern } from '@/types'

interface CreateLongTermGoalModalProps {
  isOpen: boolean
  onClose: () => void
  visionId?: string
  visionPeriodMonths?: number
  onCreated?: () => void
}

export function CreateLongTermGoalModal({
  isOpen,
  onClose,
  visionId,
  visionPeriodMonths = 12,
  onCreated
}: CreateLongTermGoalModalProps) {
  const { createLongTermGoal, loading } = useGoalStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [periodPattern, setPeriodPattern] = useState<PeriodPattern>('exact_half')

  // 期間を計算
  const periodMonths = Math.floor(visionPeriodMonths / 2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    if (!visionId) {
      alert('ビジョンが指定されていません')
      return
    }

    const trimmedDescription = description.trim()
    const result = await createLongTermGoal({
      vision_id: visionId,
      title: title.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      period_pattern: periodPattern
    })

    if (result) {
      // フォームをリセット
      setTitle('')
      setDescription('')
      setPeriodPattern('exact_half')
      onCreated?.()
    }
  }

  const handleClose = () => {
    if (!loading) {
      setTitle('')
      setDescription('')
      setPeriodPattern('exact_half')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" data-tutorial-modal>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">長期目標を作成</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: TOEIC 800点達成"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              ビジョン達成のために{periodMonths}ヶ月後に達成すべき目標
            </p>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明（任意）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="目標の詳細を記入"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              disabled={loading}
              maxLength={500}
            />
          </div>

          {/* 期間パターン */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              期間パターン <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="periodPattern"
                  value="exact_half"
                  checked={periodPattern === 'exact_half'}
                  onChange={(e) => setPeriodPattern(e.target.value as PeriodPattern)}
                  className="mt-1"
                  disabled={loading}
                />
                <div>
                  <p className="font-medium">正確に半分</p>
                  <p className="text-sm text-gray-500">
                    ビジョン{visionPeriodMonths}ヶ月 → 長期目標{periodMonths}ヶ月
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="periodPattern"
                  value="half_month_end"
                  checked={periodPattern === 'half_month_end'}
                  onChange={(e) => setPeriodPattern(e.target.value as PeriodPattern)}
                  className="mt-1"
                  disabled={loading}
                />
                <div>
                  <p className="font-medium">半分の月の月末まで</p>
                  <p className="text-sm text-gray-500">
                    より自然な区切りで管理したい場合
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 期間情報 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">期間:</span> {periodMonths}ヶ月
            </p>
            <p className="text-xs text-gray-500 mt-1">
              この長期目標の下に、毎月最低1つの短期目標を設定します
            </p>
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
