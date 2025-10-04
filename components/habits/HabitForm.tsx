'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useHabitStore } from '@/stores/habitStore'
import { X } from 'lucide-react'
import type { CreateHabitData, WeeklySchedule } from '@/types'
import HabitScheduleForm from './HabitScheduleForm'

const habitSchema = z.object({
  name: z.string().min(1, '習慣名は必須です').max(100, '習慣名は100文字以内で入力してください'),
  category_id: z.string().nullable(),
  default_duration: z.number().min(5, '最低5分は必要です').max(480, '最大8時間まで設定可能です'),
  schedule: z.object({
    monday: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
    tuesday: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
    wednesday: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
    thursday: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
    friday: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
    saturday: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
    sunday: z.object({ enabled: z.boolean(), time: z.string().optional() }).optional(),
  })
})

interface HabitFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function HabitForm({ isOpen, onClose, onSuccess }: HabitFormProps) {
  const { categories, loading, createHabit, fetchCategories } = useHabitStore()
  const [submitting, setSubmitting] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule>({})

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateHabitData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      category_id: null,
      default_duration: 30,
      schedule: {}
    },
  })

  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetchCategories()
    }
  }, [isOpen, categories.length, fetchCategories])

  const onSubmit = async (data: CreateHabitData) => {
    setSubmitting(true)
    try {
      // スケジュールが空の場合はバリデーションエラー
      if (!currentSchedule || Object.keys(currentSchedule).length === 0) {
        alert('実行スケジュールを設定してください')
        setSubmitting(false)
        return
      }

      const result = await createHabit({
        ...data,
        schedule: currentSchedule
      })
      if (result) {
        reset()
        setCurrentSchedule({})
        onSuccess?.()
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setCurrentSchedule({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">新しい習慣を追加</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              習慣名 *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              placeholder="例: 朝の読書、ランニング"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              id="category_id"
              {...register('category_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">カテゴリを選択</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="default_duration" className="block text-sm font-medium text-gray-700 mb-1">
              デフォルト所要時間（分）
            </label>
            <input
              type="number"
              id="default_duration"
              {...register('default_duration', { valueAsNumber: true })}
              min="5"
              max="480"
              step="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.default_duration && (
              <p className="mt-1 text-sm text-red-600">{errors.default_duration.message}</p>
            )}
          </div>

          {/* 🆕 スケジュール設定 */}
          <div className="border-t pt-6">
            <HabitScheduleForm
              initialSchedule={currentSchedule}
              onScheduleChange={setCurrentSchedule}
            />
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