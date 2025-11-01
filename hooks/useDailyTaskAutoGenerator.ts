'use client'

import { useEffect, useState } from 'react'
import { useHabitStore } from '@/stores/habitStore'
import { useTaskStore } from '@/stores/taskStore'
import { format } from 'date-fns'

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
}

export function useDailyTaskAutoGenerator() {
  const [notification, setNotification] = useState<Notification | null>(null)
  const { generateHabitTasks } = useHabitStore()
  const { fetchTodayTasks, fetchOneTimeTasks } = useTaskStore()

  useEffect(() => {
    const autoGenerate = async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const lastGenerated = localStorage.getItem('last_task_generation_date')

      // 日付が変わっていたら生成
      if (lastGenerated !== today) {
        try {
          console.log('🔄 自動タスク生成を開始します...')

          // 1. 習慣タスク生成
          const tasks = await generateHabitTasks('today')

          // 2. タスク再取得
          await fetchTodayTasks()
          await fetchOneTimeTasks()

          // 3. 日付を記録
          localStorage.setItem('last_task_generation_date', today)

          // 4. 成功通知
          if (tasks.length > 0) {
            setNotification({
              type: 'success',
              message: `✅ 今日のタスクを${tasks.length}件生成しました`
            })

            // 3秒後に自動で消す
            setTimeout(() => {
              setNotification(null)
            }, 3000)
          }

          console.log(`✅ 自動タスク生成完了: ${tasks.length}件`)
        } catch (error) {
          console.error('❌ 自動タスク生成エラー:', error)

          // 失敗通知（手動で閉じるまで表示）
          setNotification({
            type: 'error',
            message: '❌ タスクの自動生成に失敗しました'
          })
        }
      } else {
        console.log('📋 今日のタスクは既に生成済みです')
      }
    }

    autoGenerate()
  }, [generateHabitTasks, fetchTodayTasks, fetchOneTimeTasks])

  const closeNotification = () => {
    setNotification(null)
  }

  return { notification, closeNotification }
}
