'use client'

import { useEffect } from 'react'
import { useHabitStore } from '@/stores/habitStore'
import HabitCard from './HabitCard'

export default function HabitList() {
  const { habits, loading, error, fetchHabits } = useHabitStore()

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-2 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">
          <strong>エラーが発生しました:</strong> {error}
        </div>
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">習慣がまだありません</h3>
        <p className="text-gray-500 mb-6">最初の習慣を追加して、継続的な成長を始めましょう！</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  )
}