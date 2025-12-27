'use client'

import { useState, useEffect } from 'react'
import { X, Check, Clock } from 'lucide-react'
import { ShortTermGoal, PRESET_UNITS, MeasurementUnit, UnitInputMethod } from '@/types'
import { formatMinutesToHoursMinutes, formatProgressValue } from '@/utils/timeFormatter'

interface ProgressInputModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: number) => void
  onSkip: () => void
  taskName: string
  shortTermGoal: ShortTermGoal | null
  actualDuration?: number // タスクの実行時間（分）
}

export default function ProgressInputModal({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  taskName,
  shortTermGoal,
  actualDuration = 0
}: ProgressInputModalProps) {
  const [inputValue, setInputValue] = useState<string>('')

  // 単位情報を取得
  const getUnitInfo = (unit: MeasurementUnit): { inputMethod: UnitInputMethod; suffix: string; label: string } => {
    // プリセット単位の場合
    const preset = PRESET_UNITS.find(u => u.key === unit)
    if (preset) {
      return {
        inputMethod: preset.inputMethod,
        suffix: preset.suffix,
        label: preset.label
      }
    }

    // カスタム単位の場合
    if (unit.startsWith('custom_')) {
      const customName = unit.replace('custom_', '')
      return {
        inputMethod: 'manual',
        suffix: customName,
        label: customName
      }
    }

    // フォールバック
    return {
      inputMethod: 'auto_increment',
      suffix: '回',
      label: '回数'
    }
  }

  const unitInfo = shortTermGoal ? getUnitInfo(shortTermGoal.measurement_unit) : null

  // モーダルが開いた時に初期値を設定
  useEffect(() => {
    if (isOpen && unitInfo) {
      if (unitInfo.inputMethod === 'auto_time') {
        setInputValue(actualDuration.toString())
      } else if (unitInfo.inputMethod === 'auto_increment') {
        setInputValue('1')
      } else {
        setInputValue('')
      }
    }
  }, [isOpen, unitInfo, actualDuration])

  if (!isOpen || !shortTermGoal || !unitInfo) return null

  const currentValue = shortTermGoal.current_value
  const targetValue = shortTermGoal.target_value
  const progressRate = targetValue > 0 ? (currentValue / targetValue) * 100 : 0

  // 入力値に基づく新しい進捗を計算
  const parsedValue = parseFloat(inputValue) || 0
  const newValue = currentValue + parsedValue
  const newProgressRate = targetValue > 0 ? (newValue / targetValue) * 100 : 0

  const handleConfirm = () => {
    const value = parseFloat(inputValue) || 0
    if (value > 0 || unitInfo.inputMethod === 'auto_increment') {
      onConfirm(value)
    }
  }

  const renderInputSection = () => {
    switch (unitInfo.inputMethod) {
      case 'auto_increment':
        // 自動+1（回数・日数）
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-lg">
              <span className="text-gray-600">進捗:</span>
              <span className="font-semibold text-green-600">+1{unitInfo.suffix}</span>
            </div>
            <div className="text-center text-gray-500">
              {formatProgressValue(currentValue, shortTermGoal.measurement_unit, unitInfo.suffix)}
              <span className="mx-2">→</span>
              <span className="font-semibold text-blue-600">
                {formatProgressValue(newValue, shortTermGoal.measurement_unit, unitInfo.suffix)}
              </span>
              <span className="text-gray-400 ml-1">/ {formatProgressValue(targetValue, shortTermGoal.measurement_unit, unitInfo.suffix)}</span>
            </div>
          </div>
        )

      case 'auto_time':
        // 自動計算（時間）+ 編集可能
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <label className="text-gray-600">実行時間:</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="1"
              />
              <span className="text-gray-600">分</span>
            </div>
            <div className="text-center text-gray-500">
              {formatMinutesToHoursMinutes(currentValue)}
              <span className="mx-2">→</span>
              <span className="font-semibold text-blue-600">
                {formatMinutesToHoursMinutes(newValue)}
              </span>
              <span className="text-gray-400 ml-1">/ {formatMinutesToHoursMinutes(targetValue)}</span>
            </div>
          </div>
        )

      case 'manual':
        // 手動入力（単語・円・冊・カスタム）
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <label className="text-gray-600">今回の成果:</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.1"
                placeholder="0"
              />
              <span className="text-gray-600">{unitInfo.suffix}</span>
            </div>
            <div className="text-center text-gray-500">
              {formatProgressValue(currentValue, shortTermGoal.measurement_unit, unitInfo.suffix)}
              <span className="mx-2">→</span>
              {parsedValue > 0 ? (
                <span className="font-semibold text-blue-600">
                  {formatProgressValue(newValue, shortTermGoal.measurement_unit, unitInfo.suffix)}
                </span>
              ) : (
                <span className="text-gray-400">?</span>
              )}
              <span className="text-gray-400 ml-1">/ {formatProgressValue(targetValue, shortTermGoal.measurement_unit, unitInfo.suffix)}</span>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b bg-green-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-green-700">タスク完了</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-green-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-5 space-y-5">
          {/* タスク名 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">{taskName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              目標: {shortTermGoal.title}
            </p>
          </div>

          {/* 進捗入力セクション */}
          <div className="bg-gray-50 rounded-lg p-4">
            {renderInputSection()}
          </div>

          {/* 進捗バー */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">進捗率</span>
              <span className="font-medium text-blue-600">
                {newProgressRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  newProgressRate >= 100 ? 'bg-blue-500' :
                  newProgressRate >= 71 ? 'bg-green-500' :
                  newProgressRate >= 31 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(newProgressRate, 100)}%` }}
              />
            </div>
            {newProgressRate > 100 && (
              <p className="text-center text-sm text-blue-600 font-medium">
                目標達成! ({newProgressRate.toFixed(1)}%)
              </p>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          {unitInfo.inputMethod === 'manual' && (
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              進捗なしで完了
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={unitInfo.inputMethod === 'manual' && parsedValue <= 0}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors ${
              unitInfo.inputMethod === 'manual' && parsedValue <= 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            完了
          </button>
        </div>
      </div>
    </div>
  )
}
