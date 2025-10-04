'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { X } from 'lucide-react'
import { format, addDays } from 'date-fns'
import type { CreateTaskData } from '@/types'

const taskSchema = z.object({
  habit_id: z.string().min(1, '習慣を選択してください'),
  date: z.string().min(1, '日付は必須です'),
  estimated_duration: z.number().min(5, '最低5分は必要です').max(480, '最大8時間まで設定可能です'),
  importance: z.number().min(1).max(3),
  deadline: z.string().nullable(),
  is_recurring: z.boolean(),
})

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function TaskForm({ isOpen, onClose, onSuccess }: TaskFormProps) {
  const { habits, fetchHabits } = useHabitStore()
  const { createTask, loading } = useTaskStore()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      habit_id: '',
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), // 翌日をデフォルト
      estimated_duration: 30,
      importance: 2,
      deadline: null,
      is_recurring: true,
    },
  })

  const selectedHabitId = watch('habit_id')
  const selectedHabit = habits.find(h => h.id === selectedHabitId)

  useEffect(() => {
    if (isOpen && habits.length === 0) {
      fetchHabits()
    }
  }, [isOpen, habits.length, fetchHabits])

  useEffect(() => {
    if (selectedHabit) {
      setValue('estimated_duration', selectedHabit.default_duration)
    }
  }, [selectedHabit, setValue])

  const onSubmit = async (data: CreateTaskData) => {
    setSubmitting(true)
    try {
      const result = await createTask(data)
      if (result) {
        reset()
        onSuccess?.()
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">新しいタスクを追加</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="habit_id" className="block text-sm font-medium text-gray-700 mb-1">
              習慣 *
            </label>
            <select
              id="habit_id"
              {...register('habit_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">習慣を選択</option>
              {habits.map((habit) => (
                <option key={habit.id} value={habit.id}>
                  {habit.name} ({habit.default_duration}分)
                </option>
              ))}
            </select>
            {errors.habit_id && (
              <p className="mt-1 text-sm text-red-600">{errors.habit_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              実行日 *
            </label>
            <input
              type="date"
              id="date"
              {...register('date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700 mb-1">
              予定時間（分）
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

          <div>
            <label htmlFor="importance" className="block text-sm font-medium text-gray-700 mb-1">
              重要度
            </label>
            <select
              id="importance"
              {...register('importance', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={1}>低（1）</option>
              <option value={2}>中（2）</option>
              <option value={3}>高（3）</option>
            </select>
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              期限（オプション）
            </label>
            <input
              type="datetime-local"
              id="deadline"
              {...register('deadline')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_recurring"
              {...register('is_recurring')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
              習慣タスク（繰り返しタスク）
            </label>
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