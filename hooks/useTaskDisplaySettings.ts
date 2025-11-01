'use client'

import { useState, useEffect } from 'react'

export function useTaskDisplaySettings() {
  const [daysToShow, setDaysToShow] = useState<number>(7)

  // 初期化時にlocalStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem('future_tasks_days')
    if (saved) {
      const days = parseInt(saved, 10)
      if (!isNaN(days)) {
        setDaysToShow(days)
      }
    }
  }, [])

  const updateDaysToShow = (days: number) => {
    setDaysToShow(days)
    localStorage.setItem('future_tasks_days', days.toString())
  }

  return { daysToShow, updateDaysToShow }
}
