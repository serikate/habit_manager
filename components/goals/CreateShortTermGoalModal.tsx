'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { useGoalStore } from '@/stores/goalStore'
import { useCustomUnitStore } from '@/stores/customUnitStore'
import { PRESET_UNITS, MeasurementUnit } from '@/types'
import { format, addMonths, startOfMonth, isBefore, isAfter } from 'date-fns'
import { ja } from 'date-fns/locale'

const shortTermGoalSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
  measurement_unit: z.string().min(1, '測定単位を選択してください'),
  target_value: z.number().positive('目標値は0より大きい値で設定してください'),
  target_month: z.string().min(1, '対象月を選択してください'),
  deadline: z.string().optional(),
  show_after_achieved: z.boolean().optional()
})

type ShortTermGoalFormData = z.infer<typeof shortTermGoalSchema>

interface CreateShortTermGoalModalProps {
  isOpen: boolean
  onClose: () => void
  longTermGoalId: string
  longTermGoalDeadline?: string
  onCreated?: () => void
}

export function CreateShortTermGoalModal({
  isOpen,
  onClose,
  longTermGoalId,
  longTermGoalDeadline,
  onCreated
}: CreateShortTermGoalModalProps) {
  const { createShortTermGoal } = useGoalStore()
  const { customUnits, fetchCustomUnits, createCustomUnit } = useCustomUnitStore()

  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false)
  const [newCustomUnitName, setNewCustomUnitName] = useState('')
  const [customUnitError, setCustomUnitError] = useState('')

  // 対象月の選択肢を生成（現在月から長期目標の期限まで）
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []
    const now = new Date()
    const currentMonth = startOfMonth(now)

    // 長期目標の期限がある場合はそこまで、なければ12ヶ月先まで
    const deadlineDate = longTermGoalDeadline
      ? new Date(longTermGoalDeadline)
      : addMonths(now, 12)

    let month = currentMonth
    while (isBefore(month, deadlineDate) || month.getTime() === startOfMonth(deadlineDate).getTime()) {
      const value = format(month, 'yyyy-MM-dd')
      const label = format(month, 'yyyy年M月', { locale: ja })
      options.push({ value, label })
      month = addMonths(month, 1)
    }

    return options
  }, [longTermGoalDeadline])

  // 今月をデフォルトに
  const defaultTargetMonth = useMemo(() => {
    const now = new Date()
    return format(startOfMonth(now), 'yyyy-MM-dd')
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<ShortTermGoalFormData>({
    resolver: zodResolver(shortTermGoalSchema),
    defaultValues: {
      title: '',
      measurement_unit: 'count',
      target_value: 1,
      target_month: defaultTargetMonth,
      deadline: '',
      show_after_achieved: true
    }
  })

  const measurementUnit = watch('measurement_unit')

  // カスタム単位を取得
  useEffect(() => {
    if (isOpen) {
      fetchCustomUnits()
    }
  }, [isOpen, fetchCustomUnits])

  const onSubmit = async (data: ShortTermGoalFormData) => {
    const result = await createShortTermGoal({
      long_term_goal_id: longTermGoalId,
      title: data.title,
      measurement_unit: data.measurement_unit as MeasurementUnit,
      target_value: data.target_value,
      target_month: data.target_month,
      ...(data.deadline ? { deadline: data.deadline } : {}),
      ...(typeof data.show_after_achieved === 'boolean' ? { show_after_achieved: data.show_after_achieved } : {})
    })

    if (result) {
      reset()
      onCreated?.()
      onClose()
    }
  }

  const handleClose = () => {
    reset()
    setShowCustomUnitInput(false)
    setNewCustomUnitName('')
    setCustomUnitError('')
    onClose()
  }

  // カスタム単位を追加
  const handleAddCustomUnit = async () => {
    if (!newCustomUnitName.trim()) {
      setCustomUnitError('単位名を入力してください')
      return
    }

    const result = await createCustomUnit(newCustomUnitName.trim())
    if (result) {
      setValue('measurement_unit', `custom_${result.name}`)
      setShowCustomUnitInput(false)
      setNewCustomUnitName('')
      setCustomUnitError('')
    } else {
      setCustomUnitError('この単位名は既に存在します')
    }
  }

  // 測定単位のラベルを取得
  const getUnitLabel = (): string => {
    // プリセット単位の場合
    const preset = PRESET_UNITS.find(u => u.key === measurementUnit)
    if (preset) {
      return preset.suffix
    }

    // カスタム単位の場合
    if (measurementUnit.startsWith('custom_')) {
      return measurementUnit.replace('custom_', '')
    }

    return ''
  }

  // 測定単位の説明を取得
  const getUnitDescription = (): string => {
    const preset = PRESET_UNITS.find(u => u.key === measurementUnit)
    if (preset) {
      switch (preset.key) {
        case 'count':
          return '例: 30回達成する'
        case 'days':
          return '例: 30日間継続する'
        case 'minutes':
          return '例: 合計1800分（30時間）実行する'
        case 'words':
          return '例: 単語を1000語覚える'
        case 'yen':
          return '例: 10万円貯める'
        case 'books':
          return '例: 本を10冊読む'
        default:
          return ''
      }
    }

    if (measurementUnit.startsWith('custom_')) {
      return 'カスタム単位: タスク完了時に手動で入力'
    }

    return ''
  }

  // 入力方法の説明を取得
  const getInputMethodDescription = (): string => {
    const preset = PRESET_UNITS.find(u => u.key === measurementUnit)
    if (preset) {
      switch (preset.inputMethod) {
        case 'auto_increment':
          return 'タスク完了で自動的に+1'
        case 'auto_time':
          return '実行時間から自動計算（編集可）'
        case 'manual':
          return 'タスク完了時に手動入力'
        default:
          return ''
      }
    }

    if (measurementUnit.startsWith('custom_')) {
      return 'タスク完了時に手動入力'
    }

    return ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" data-tutorial-modal>
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">短期目標を追加</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: 単語を1000個覚える"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* 対象月 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              対象月 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('target_month')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.target_month && (
              <p className="mt-1 text-sm text-red-500">{errors.target_month.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              この短期目標を達成する月を選択してください
            </p>
          </div>

          {/* 測定単位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              測定単位 <span className="text-red-500">*</span>
            </label>

            {!showCustomUnitInput ? (
              <>
                <select
                  {...register('measurement_unit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <optgroup label="プリセット単位">
                    {PRESET_UNITS.map((unit) => (
                      <option key={unit.key} value={unit.key}>
                        {unit.label}
                      </option>
                    ))}
                  </optgroup>
                  {customUnits.length > 0 && (
                    <optgroup label="カスタム単位">
                      {customUnits.map((unit) => (
                        <option key={unit.id} value={`custom_${unit.name}`}>
                          {unit.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <button
                  type="button"
                  onClick={() => setShowCustomUnitInput(true)}
                  className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>カスタム単位を追加</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomUnitName}
                    onChange={(e) => {
                      setNewCustomUnitName(e.target.value)
                      setCustomUnitError('')
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: ページ, km, kg"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomUnit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    追加
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomUnitInput(false)
                      setNewCustomUnitName('')
                      setCustomUnitError('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    戻る
                  </button>
                </div>
                {customUnitError && (
                  <p className="text-sm text-red-500">{customUnitError}</p>
                )}
              </div>
            )}

            {errors.measurement_unit && (
              <p className="mt-1 text-sm text-red-500">{errors.measurement_unit.message}</p>
            )}

            {/* 単位の説明 */}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">{getUnitDescription()}</p>
              <p className="text-xs text-blue-500">{getInputMethodDescription()}</p>
            </div>
          </div>

          {/* 目標値 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目標値 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                {...register('target_value', { valueAsNumber: true })}
                min={0.1}
                step={0.1}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
              <span className="text-gray-600 min-w-[40px]">{getUnitLabel()}</span>
            </div>
            {errors.target_value && (
              <p className="mt-1 text-sm text-red-500">{errors.target_value.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">小数点も入力可能です</p>
          </div>

          {/* 期限（任意） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期限（任意）
            </label>
            <input
              type="date"
              {...register('deadline')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.deadline && (
              <p className="mt-1 text-sm text-red-500">{errors.deadline.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              設定しない場合は長期目標の期限が適用されます
            </p>
          </div>

          {/* 達成後の表示設定 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('show_after_achieved')}
              id="show_after_achieved"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="show_after_achieved" className="text-sm text-gray-700">
              達成後も目標を表示し続ける
            </label>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
