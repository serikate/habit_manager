'use client'

import { useEffect, useState } from 'react'
import { useGoalStore } from '@/stores/goalStore'
import type { ShortTermGoal } from '@/types'
import { PRESET_UNITS } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Edit2, Plus } from 'lucide-react'
import { formatProgressValue } from '@/utils/timeFormatter'
import { ProgressHistoryModal } from './ProgressHistoryModal'
import HabitForm from '@/components/habits/HabitForm'

interface ShortTermGoalCardProps {
  goal: ShortTermGoal
  onGoalUpdated?: () => void
}

export function ShortTermGoalCard({ goal, onGoalUpdated }: ShortTermGoalCardProps) {
  const { calculateShortTermGoalProgress, deleteShortTermGoal } = useGoalStore()
  const [progress, setProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showProgressHistory, setShowProgressHistory] = useState(false)
  const [showHabitForm, setShowHabitForm] = useState(false)

  useEffect(() => {
    const fetchProgress = async () => {
      const progressValue = await calculateShortTermGoalProgress(goal.id)
      setProgress(progressValue)
    }
    fetchProgress()
  }, [goal.id, goal.current_value, goal.target_value, calculateShortTermGoalProgress])

  const handleDelete = async () => {
    const success = await deleteShortTermGoal(goal.id)
    if (success) {
      setShowDeleteConfirm(false)
      onGoalUpdated?.()
    }
  }

  // 進捗率に基づいて色を決定
  const getProgressColor = () => {
    if (progress >= 100) return 'bg-blue-500'  // 達成
    if (progress >= 71) return 'bg-green-500'  // 良好
    if (progress >= 31) return 'bg-yellow-500' // 頑張ろう
    return 'bg-red-500'  // 要注意
  }

  // 測定単位のラベルを取得
  const getUnitLabel = (): string => {
    const preset = PRESET_UNITS.find(u => u.key === goal.measurement_unit)
    if (preset) {
      return preset.label
    }
    if (goal.measurement_unit.startsWith('custom_')) {
      return goal.measurement_unit.replace('custom_', '')
    }
    return ''
  }

  // 測定単位の接尾辞を取得
  const getUnitSuffix = (): string => {
    const preset = PRESET_UNITS.find(u => u.key === goal.measurement_unit)
    if (preset) {
      return preset.suffix
    }
    if (goal.measurement_unit.startsWith('custom_')) {
      return goal.measurement_unit.replace('custom_', '')
    }
    return ''
  }

  const unitSuffix = getUnitSuffix()

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition relative">
        {/* 達成バッジ */}
        {goal.is_achieved && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            達成!
          </div>
        )}

        {/* タイトル */}
        <h3 className="text-lg font-bold mb-3 pr-16">{goal.title}</h3>

        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">進捗</span>
            <span className={`text-sm font-bold ${progress >= 100 ? 'text-blue-600' : 'text-gray-900'}`}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          {progress > 100 && (
            <p className="text-xs text-blue-600 mt-1 text-center">目標達成!</p>
          )}
        </div>

        {/* 現在値 / 目標値 */}
        <div className="mb-4">
          <div className="text-center">
            <span className="text-3xl font-bold text-blue-600">
              {formatProgressValue(goal.current_value, goal.measurement_unit, unitSuffix)}
            </span>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-2xl font-medium text-gray-600">
              {formatProgressValue(goal.target_value, goal.measurement_unit, unitSuffix)}
            </span>
          </div>
        </div>

        {/* 測定単位 */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">測定単位</span>
            <span className="font-medium">{getUnitLabel()}</span>
          </div>
          {goal.deadline && (
            <div className="flex justify-between">
              <span className="text-gray-600">期限</span>
              <span className="font-medium">
                {format(new Date(goal.deadline), 'yyyy/MM/dd', { locale: ja })}
              </span>
            </div>
          )}
        </div>

        {/* 紐づく習慣数 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">紐づく習慣</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{goal.habits?.length || 0}個</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowHabitForm(true)
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                <Plus className="w-3 h-3" />
                <span>習慣を追加</span>
              </button>
            </div>
          </div>
        </div>

        {/* ボタン群 */}
        <div className="mt-4 flex justify-between items-center">
          {/* 進捗修正ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowProgressHistory(true)
            }}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            <Edit2 className="w-4 h-4" />
            <span>進捗を修正</span>
          </button>

          {/* 削除ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            削除
          </button>
        </div>

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white p-4 rounded-lg shadow-xl max-w-xs">
              <p className="text-center mb-4">この短期目標を削除しますか？</p>
              <p className="text-xs text-gray-500 text-center mb-4">
                ※習慣は削除されず、紐づけのみ解除されます
              </p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(false)
                  }}
                  className="flex-1 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 進捗履歴モーダル */}
      <ProgressHistoryModal
        isOpen={showProgressHistory}
        onClose={() => setShowProgressHistory(false)}
        shortTermGoal={goal}
        onProgressUpdated={onGoalUpdated}
      />

      {/* 習慣追加モーダル */}
      <HabitForm
        isOpen={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSuccess={() => {
          setShowHabitForm(false)
          onGoalUpdated?.()
        }}
        preSelectedShortTermGoalId={goal.id}
      />
    </>
  )
}
