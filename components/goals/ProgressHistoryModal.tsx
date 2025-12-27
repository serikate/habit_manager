'use client'

import { useState, useEffect } from 'react'
import { X, Edit2, Trash2, Save, XCircle } from 'lucide-react'
import { useProgressStore } from '@/stores/progressStore'
import { ProgressEntry, ShortTermGoal, PRESET_UNITS } from '@/types'
import { formatProgressValue } from '@/utils/timeFormatter'

interface ProgressHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  shortTermGoal: ShortTermGoal
  onProgressUpdated?: (() => void) | undefined
}

export function ProgressHistoryModal({
  isOpen,
  onClose,
  shortTermGoal,
  onProgressUpdated
}: ProgressHistoryModalProps) {
  const { fetchProgressEntries, updateProgressEntry, deleteProgressEntry, isLoading } = useProgressStore()
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // 単位情報を取得
  const getUnitSuffix = (): string => {
    const preset = PRESET_UNITS.find(u => u.key === shortTermGoal.measurement_unit)
    if (preset) return preset.suffix
    if (shortTermGoal.measurement_unit.startsWith('custom_')) {
      return shortTermGoal.measurement_unit.replace('custom_', '')
    }
    return ''
  }

  const unitSuffix = getUnitSuffix()

  // 履歴を取得
  useEffect(() => {
    if (isOpen) {
      loadEntries()
    }
  }, [isOpen, shortTermGoal.id])

  const loadEntries = async () => {
    setLoading(true)
    const data = await fetchProgressEntries(shortTermGoal.id)
    setEntries(data)
    setLoading(false)
  }

  // 編集開始
  const handleEditStart = (entry: ProgressEntry) => {
    setEditingId(entry.id)
    setEditValue(entry.value.toString())
  }

  // 編集キャンセル
  const handleEditCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  // 編集保存
  const handleEditSave = async (id: string) => {
    const value = parseFloat(editValue)
    if (isNaN(value) || value < 0) {
      alert('有効な数値を入力してください')
      return
    }

    const success = await updateProgressEntry(id, value)
    if (success) {
      setEditingId(null)
      setEditValue('')
      await loadEntries()
      onProgressUpdated?.()
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('この進捗記録を削除しますか？')) return

    const success = await deleteProgressEntry(id)
    if (success) {
      await loadEntries()
      onProgressUpdated?.()
    }
  }

  // 合計を計算
  const totalValue = entries.reduce((sum, entry) => sum + entry.value, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">進捗履歴</h2>
            <p className="text-sm text-gray-500">{shortTermGoal.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 合計表示 */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">現在の合計</span>
            <span className="text-xl font-bold text-blue-600">
              {formatProgressValue(totalValue, shortTermGoal.measurement_unit, unitSuffix)}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            目標: {formatProgressValue(shortTermGoal.target_value, shortTermGoal.measurement_unit, unitSuffix)}
          </div>
        </div>

        {/* 履歴リスト */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              進捗記録がありません
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border ${
                    entry.is_correction ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {entry.is_correction && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded">
                            修正済み
                          </span>
                        )}
                      </div>

                      {editingId === entry.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            step="0.1"
                            min="0"
                          />
                          <span className="text-gray-600">{unitSuffix}</span>
                        </div>
                      ) : (
                        <div className="text-lg font-medium text-gray-800 mt-1">
                          +{formatProgressValue(entry.value, shortTermGoal.measurement_unit, unitSuffix)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {editingId === entry.id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(entry.id)}
                            disabled={isLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="保存"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="キャンセル"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditStart(entry)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="編集"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
