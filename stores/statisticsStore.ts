import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface StatisticsData {
  daily: {
    date: string
    achievement: number
    completed: number
    total: number
  }[]
  weekly: {
    week: string
    achievement: number
    completed: number
    total: number
  }[]
  habits: {
    id: string
    name: string
    level: number
    experience_points: number
    total_tasks: number
    completed_tasks: number
    achievement_rate: number
    streak: number
  }[]
  overall: {
    total_habits: number
    total_tasks: number
    completed_tasks: number
    achievement_rate: number
    average_level: number
  }
}

interface StatisticsState {
  data: StatisticsData | null
  loading: boolean
  error: string | null

  fetchStatistics: (period?: number) => Promise<void>
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchStatistics: async (period = 30) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const endDate = new Date()
      const startDate = subDays(endDate, period)

      // 日別統計を取得
      const { data: dailyTasks, error: dailyError } = await supabase
        .from('daily_tasks')
        .select('date, status, estimated_duration')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))

      if (dailyError) throw dailyError

      // 習慣統計を取得
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select(`
          id,
          name,
          level,
          experience_points,
          daily_tasks!inner(
            id,
            status,
            date
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (habitsError) throw habitsError

      // 日別データの集計
      const dailyMap = new Map<string, { completed: number; total: number }>()

      dailyTasks?.forEach(task => {
        const key = task.date
        if (!dailyMap.has(key)) {
          dailyMap.set(key, { completed: 0, total: 0 })
        }
        const day = dailyMap.get(key)!
        day.total++
        if (task.status === 'completed') {
          day.completed++
        }
      })

      const daily = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        achievement: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        completed: stats.completed,
        total: stats.total,
      })).sort((a, b) => a.date.localeCompare(b.date))

      // 週別データの集計
      const weeklyMap = new Map<string, { completed: number; total: number }>()

      daily.forEach(day => {
        const date = new Date(day.date)
        const weekStart = startOfWeek(date)
        const weekKey = format(weekStart, 'yyyy-MM-dd')

        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, { completed: 0, total: 0 })
        }
        const week = weeklyMap.get(weekKey)!
        week.completed += day.completed
        week.total += day.total
      })

      const weekly = Array.from(weeklyMap.entries()).map(([week, stats]) => ({
        week,
        achievement: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        completed: stats.completed,
        total: stats.total,
      })).sort((a, b) => a.week.localeCompare(b.week))

      // 習慣統計の計算
      const habitStats = habits?.map(habit => {
        const habitTasks = (habit as any).daily_tasks || []
        const totalTasks = habitTasks.length
        const completedTasks = habitTasks.filter((task: any) => task.status === 'completed').length
        const achievementRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

        // 連続実行日数の計算（簡易版）
        let streak = 0
        const sortedTasks = habitTasks
          .filter((task: any) => task.status === 'completed')
          .sort((a: any, b: any) => b.date.localeCompare(a.date))

        for (let i = 0; i < sortedTasks.length; i++) {
          const taskDate = new Date(sortedTasks[i].date)
          const expectedDate = subDays(new Date(), i)

          if (format(taskDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
            streak++
          } else {
            break
          }
        }

        return {
          id: habit.id,
          name: habit.name,
          level: habit.level,
          experience_points: habit.experience_points,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          achievement_rate: achievementRate,
          streak,
        }
      }) || []

      // 全体統計の計算
      const totalHabits = habitStats.length
      const totalTasks = habitStats.reduce((sum, habit) => sum + habit.total_tasks, 0)
      const completedTasks = habitStats.reduce((sum, habit) => sum + habit.completed_tasks, 0)
      const achievementRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      const averageLevel = totalHabits > 0 ? habitStats.reduce((sum, habit) => sum + habit.level, 0) / totalHabits : 0

      const overall = {
        total_habits: totalHabits,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        achievement_rate: achievementRate,
        average_level: averageLevel,
      }

      set({
        data: {
          daily,
          weekly,
          habits: habitStats,
          overall,
        },
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
}))