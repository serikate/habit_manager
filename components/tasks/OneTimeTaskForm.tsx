'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTaskStore } from '@/stores/taskStore'
import { calculateUrgency } from '@/utils/priorityCalculator'
import { X } from 'lucide-react'
import type { CreateOneTimeTaskData } from '@/types'

const oneTimeTaskSchema = z.object({
  title: z.string().min(1, 'タスク名は必須です').max(100, 'タスク名は100文字以内で入力してください'),
  description: z.string().optional(),
  deadline: z.string().min(1, '期限は必須です'),
  estimated_duration: z.number().min(5, '最低5分は必要です').max(480, '最大8時間まで設定可能です'),
  importance: z.number().min(1).max(3),
  category: z.string().optional(),
})

interface OneTimeTaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function OneTimeTaskForm({ isOpen, onClose, onSuccess }: OneTimeTaskFormProps) {
  const { createOneTimeTask, loading } = useTaskStore()
  const [submitting, setSubmitting] = useState(false)
  const [calculatedUrgency, setCalculatedUrgency] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateOneTimeTaskData>({
    resolver: zodResolver(oneTimeTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      estimated_duration: 30,
      importance: 2,
      category: '',
    },
  })

  // 期限の変更を監視して緊急度を自動計算
  const deadline = watch('deadline')

  useEffect(() => {
    if (deadline) {
      const urgency = calculateUrgency(deadline)
      setCalculatedUrgency(urgency)
    } else {
      setCalculatedUrgency(null)
    }
  }, [deadline])

  const onSubmit = async (data: CreateOneTimeTaskData) => {
    setSubmitting(true)
    try {
      // datetime-localの値をローカルタイムゾーンのISO文字列に変換
      const localDate = new Date(data.deadline)
      const deadlineISO = localDate.toISOString()

      // 緊急度を自動計算して追加
      const urgency = calculateUrgency(deadlineISO)
      const taskData = {
        ...data,
        deadline: deadlineISO,
        urgency,
      }
      const result = await createOneTimeTask(taskData)
      if (result) {
        reset()
        setCalculatedUrgency(null)
        onSuccess?.()
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setCalculatedUrgency(null)
    onClose()
  }

  // 緊急度のラベルを取得
  const getUrgencyLabel = (urgency: number) => {
    switch (urgency) {
      case 3: return '🔴 高 (当日中)'
      case 2: return '🟡 中 (3日以内)'
      case 1: return '🟢 低 (4日以上先)'
      default: return '未設定'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">新しい単発タスクを追加</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タスク名 *
            </label>
            <input
              type="text"
              id="title"
              {...register('title')}
              placeholder="例: プレゼン資料作成、買い物"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              詳細説明
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="タスクの詳細や注意点を記述"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                期限 *
              </label>
              <input
                type="datetime-local"
                id="deadline"
                {...register('deadline')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
              )}
              {calculatedUrgency !== null && (
                <p className="mt-1 text-xs text-gray-600">
                  緊急度: {getUrgencyLabel(calculatedUrgency)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700 mb-1">
                予想所要時間（分）
              </label>
              <input
                type="number"
                id="estimated_duration"
                {...register('estimated_duration', { valueAsNumber: true })}
                min="5"
                max="480"
                step="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.estimated_duration && (
                <p className="mt-1 text-sm text-red-600">{errors.estimated_duration.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="importance" className="block text-sm font-medium text-gray-700 mb-1">
              重要度 *
            </label>
            <select
              id="importance"
              {...register('importance', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={1}>低 (1) - あまり重要ではない</option>
              <option value={2}>中 (2) - 重要</option>
              <option value={3}>高 (3) - とても重要</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <input
              type="text"
              id="category"
              {...register('category')}
              placeholder="例: 仕事、買い物、学習"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 優先度について</h3>
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>重要度:</strong> タスクの価値や成果への影響度（手動設定）</div>
              <div><strong>緊急度:</strong> 期限から自動計算
                <ul className="ml-4 mt-1 list-disc">
                  <li>当日中: 高 (3)</li>
                  <li>3日以内: 中 (2)</li>
                  <li>4日以上先: 低 (1)</li>
                </ul>
              </div>
              <div className="mt-2 text-blue-700">
                重要度×緊急度で優先順位が自動計算されます
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {submitting ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}