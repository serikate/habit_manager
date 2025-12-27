'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useVisionStore } from '@/stores/visionStore'

interface CreateVisionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateVisionModal({ isOpen, onClose, onCreated }: CreateVisionModalProps) {
  const { createVision, loading } = useVisionStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [periodMonths, setPeriodMonths] = useState(12)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    const trimmedDescription = description.trim()
    const result = await createVision({
      title: title.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      period_months: periodMonths
    })

    if (result) {
      // フォームをリセット
      setTitle('')
      setDescription('')
      setPeriodMonths(12)
      onCreated?.()
      onClose()
    }
  }

  const handleClose = () => {
    if (!loading) {
      setTitle('')
      setDescription('')
      setPeriodMonths(12)
      onClose()
    }
  }

  if (!isOpen) return null

  // 期間選択肢を生成
  const periodOptions = []
  for (let i = 6; i <= 18; i++) {
    let label = `${i}ヶ月`
    if (i === 12) label = '12ヶ月（1年）'
    if (i === 18) label = '18ヶ月（1年半）'
    periodOptions.push({ value: i, label })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" data-tutorial-modal>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">1年後ビジョンを作成</h2>
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
              placeholder="例: 英語でビジネス会話ができるようになる"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              1年後に達成したい大きな目標やなりたい姿
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
              placeholder="ビジョンの詳細やモチベーションを記入"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              disabled={loading}
              maxLength={500}
            />
          </div>

          {/* 期間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期間 <span className="text-red-500">*</span>
            </label>
            <select
              value={periodMonths}
              onChange={(e) => setPeriodMonths(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              長期目標の期間は自動的にこの半分（{Math.floor(periodMonths / 2)}ヶ月）になります
            </p>
          </div>

          {/* 階層説明 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">目標階層</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>🎯 1年後ビジョン（{periodMonths}ヶ月）</p>
              <p className="pl-4">📎 長期目標（{Math.floor(periodMonths / 2)}ヶ月）</p>
              <p className="pl-8">📋 短期目標（1ヶ月）</p>
              <p className="pl-12">✅ 習慣</p>
            </div>
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
