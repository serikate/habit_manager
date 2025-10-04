'use client'

import { useState } from 'react'
import { Edit, Trash2, Clock, TrendingUp } from 'lucide-react'
import type { Habit } from '@/types'
import { useHabitStore } from '@/stores/habitStore'

interface HabitCardProps {
  habit: Habit
}

export default function HabitCard({ habit }: HabitCardProps) {
  const { deleteHabit } = useHabitStore()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`「${habit.name}」を削除しますか？`)) return

    setDeleting(true)
    try {
      await deleteHabit(habit.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {habit.category && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: habit.category.color }}
              />
            )}
            <h3 className="text-lg font-medium text-gray-900">{habit.name}</h3>
          </div>

          {habit.category && (
            <p className="text-sm text-gray-500 mb-2">{habit.category.name}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{habit.default_duration}分</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Lv.{habit.level}</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>経験値</span>
              <span>{habit.experience_points} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((habit.experience_points % 100), 100)}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="編集"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}