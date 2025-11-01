'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import {
  isoToTimeInput,
  timeInputToISO,
  calculateDuration,
  calculateAchievementRate
} from '@/utils/timeCalculator'
import type { TaskExecution, DailyTask } from '@/types'

const editExecutionSchema = z.object({
  started_at: z.string().min(1, '開始時刻は必須です'),
  completed_at: z.string().min(1, '終了時刻は必須です'),
  edit_reason: z.string().optional(),
})

type EditExecutionFormData = z.infer<typeof editExecutionSchema>

interface EditExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  execution: TaskExecution
  task: DailyTask
}

export default function EditExecutionModal({
  isOpen,
  onClose,
  execution,
  task
}: EditExecutionModalProps) {
  const { editExecution } = useTaskStore()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<EditExecutionFormData>({
    resolver: zodResolver(editExecutionSchema) as any,
    defaultValues: {
      started_at: isoToTimeInput(execution.started_at),
      completed_at: isoToTimeInput(execution.completed_at),
      edit_reason: '',
    },
  })

  // 時刻が変更されたらリアルタイムで再計算
  const watchStartTime = watch('started_at')
  const watchEndTime = watch('completed_at')

  const calculatedDuration = watchStartTime && watchEndTime
    ? (() => {
        try {
          const startISO = timeInputToISO(watchStartTime, new Date(execution.started_at))
          const endISO = timeInputToISO(watchEndTime, new Date(execution.completed_at))
          return calculateDuration(startISO, endISO)
        } catch {
          return null
        }
      })()
    : null

  const calculatedRate = calculatedDuration !== null
    ? calculateAchievementRate(calculatedDuration, task.estimated_duration)
    : null

  const onSubmit = async (data: EditExecutionFormData) => {
    setSubmitting(true)
    setError(null)

    try {
      // time input を ISO 8601 に変換
      const startedAtISO = timeInputToISO(data.started_at, new Date(execution.started_at))
      const completedAtISO = timeInputToISO(data.completed_at, new Date(execution.completed_at))

      await editExecution(execution.id, {
        started_at: startedAtISO,
        completed_at: completedAtISO,
        ...(data.edit_reason ? { edit_reason: data.edit_reason } : {})
      })

      // 成功したら閉じる
      reset()
      onClose()

      // タスクリストを再取得
      await useTaskStore.getState().fetchTodayTasks()
    } catch (err: any) {
      setError(err.message || '編集に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">実行時間を編集</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 開始時刻 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始時刻 *
            </label>
            <input
              type="time"
              {...register('started_at')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.started_at && (
              <p className="mt-1 text-sm text-red-600">{errors.started_at.message}</p>
            )}
          </div>

          {/* 終了時刻 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了時刻 *
            </label>
            <input
              type="time"
              {...register('completed_at')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.completed_at && (
              <p className="mt-1 text-sm text-red-600">{errors.completed_at.message}</p>
            )}
          </div>

          {/* 計算結果表示 */}
          <div className="p-4 bg-gray-50 rounded-md space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">所要時間:</span>
              <span className="font-medium text-gray-900">
                {calculatedDuration !== null ? `${calculatedDuration}分` : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">達成率:</span>
              <span className="font-medium text-gray-900">
                {calculatedRate !== null ? `${calculatedRate.toFixed(0)}%` : '---'}
              </span>
            </div>
          </div>

          {/* 編集理由 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              編集理由（任意）
            </label>
            <textarea
              {...register('edit_reason')}
              rows={3}
              placeholder="例: 実際より10分早く終了しました"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
