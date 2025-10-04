'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import AchievementChart from '@/components/charts/AchievementChart'
import ProgressBar from '@/components/progress/ProgressBar'
import LevelDisplay from '@/components/progress/LevelDisplay'
import { useStatisticsStore } from '@/stores/statisticsStore'
import { TrendingUp, Target, Clock, Trophy } from 'lucide-react'

export default function StatisticsPage() {
  const { data, loading, error, fetchStatistics } = useStatisticsStore()
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  useEffect(() => {
    fetchStatistics(selectedPeriod)
  }, [fetchStatistics, selectedPeriod])

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4" />
                <div className="h-64 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">
            <strong>エラーが発生しました:</strong> {error}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">統計・レポート</h1>
            <p className="mt-2 text-sm text-gray-700">
              習慣の継続状況と達成率を確認しましょう
            </p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={7}>過去7日間</option>
            <option value={30}>過去30日間</option>
            <option value={90}>過去90日間</option>
          </select>
        </div>

        {/* 全体統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">総習慣数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data?.overall.total_habits || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">達成率</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data?.overall.achievement_rate.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">平均レベル</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data?.overall.average_level.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">完了タスク</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data?.overall.completed_tasks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 達成率チャート */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">達成率の推移</h2>
            {data?.daily && data.daily.length > 0 ? (
              <AchievementChart data={data.daily} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                データがありません
              </div>
            )}
          </div>

          {/* 習慣別統計 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">習慣別パフォーマンス</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {data?.habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {habit.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          Lv.{habit.level}
                        </span>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          {habit.streak}日連続
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={habit.achievement_rate}
                      max={100}
                      size="sm"
                      showPercentage={false}
                      color={habit.achievement_rate >= 80 ? 'green' : habit.achievement_rate >= 60 ? 'yellow' : 'red'}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{habit.completed_tasks}/{habit.total_tasks} 完了</span>
                      <span>{habit.achievement_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-8">
                  習慣データがありません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 週間進捗 */}
        {data?.weekly && data.weekly.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">週間進捗</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.weekly.map((week, index) => (
                <div key={week.week} className="text-center">
                  <div className="text-sm text-gray-500 mb-2">
                    第{index + 1}週
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {week.achievement.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {week.completed}/{week.total} 完了
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}