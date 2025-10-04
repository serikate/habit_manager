'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import TaskList from '@/components/tasks/TaskList'
import LevelDisplay from '@/components/progress/LevelDisplay'
import ProgressBar from '@/components/progress/ProgressBar'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { useStatisticsStore } from '@/stores/statisticsStore'
import { calculateOverallLevel } from '@/utils/levelSystem'
import { Plus, BarChart3, Target, Settings } from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { todayTasks, fetchTodayTasks } = useTaskStore()
  const { habits, fetchHabits } = useHabitStore()
  const { data: stats, fetchStatistics } = useStatisticsStore()

  useEffect(() => {
    fetchTodayTasks()
    fetchHabits()
    fetchStatistics(7) // 過去7日間の統計
  }, [fetchTodayTasks, fetchHabits, fetchStatistics])

  const overallLevel = calculateOverallLevel(habits)
  const todayProgress = {
    completed: todayTasks.filter(t => t.status === 'completed').length,
    total: todayTasks.length,
    rate: todayTasks.length > 0 ? (todayTasks.filter(t => t.status === 'completed').length / todayTasks.length) * 100 : 0
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-700">
            今日も素晴らしい一日にしましょう！ 🌟
          </p>
        </div>

        {/* 今日の概要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">今日のタスク</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {todayProgress.completed}/{todayProgress.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">今日の達成率</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {todayProgress.rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">アクティブ習慣</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {habits.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 今日のスケジュール */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  今日のスケジュール ({format(new Date(), 'M月d日')})
                </h2>
                <Link
                  href="/tasks"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  すべて見る →
                </Link>
              </div>
              <TaskList showTitle={false} />
            </div>
          </div>

          {/* 右サイドバー */}
          <div className="space-y-6">
            {/* 全体レベル・称号 */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">全体レベル</h2>
              </div>
              <div className="p-4">
                <LevelDisplay
                  experiencePoints={overallLevel.currentXP + (overallLevel.level - 1) * 100}
                  size="md"
                />
              </div>
            </div>

            {/* 今週の進捗 */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">今週の進捗</h3>
              <div className="space-y-3">
                <ProgressBar
                  value={stats?.overall.achievement_rate || 0}
                  max={100}
                  label="週間達成率"
                  color="green"
                />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {stats?.overall.completed_tasks || 0}
                    </div>
                    <div className="text-xs text-gray-600">完了タスク</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {stats?.overall.average_level.toFixed(1) || 0}
                    </div>
                    <div className="text-xs text-gray-600">平均レベル</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 習慣レベル上位 */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">レベル上位習慣</h3>
              <div className="space-y-3">
                {habits
                  .sort((a, b) => b.level - a.level)
                  .slice(0, 3)
                  .map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {habit.category && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: habit.category.color }}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {habit.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary-600">
                        Lv.{habit.level}
                      </span>
                    </div>
                  ))}
                {habits.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    習慣を追加してレベルアップを始めましょう！
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/habits"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">➕</div>
              <div className="text-sm font-medium">習慣を追加</div>
            </Link>
            <Link
              href="/tasks"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📝</div>
              <div className="text-sm font-medium">タスクを追加</div>
            </Link>
            <Link
              href="/statistics"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📈</div>
              <div className="text-sm font-medium">統計を確認</div>
            </Link>
            <Link
              href="/settings"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
              <div className="text-sm font-medium">設定</div>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}