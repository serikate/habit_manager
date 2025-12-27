'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import AchievementChart from '@/components/charts/AchievementChart'
import ProgressBar from '@/components/progress/ProgressBar'
import LevelDisplay from '@/components/progress/LevelDisplay'
import { useStatisticsStore } from '@/stores/statisticsStore'
import { useThemeStore } from '@/stores/themeStore'
import { TrendingUp, Target, Clock, Trophy } from 'lucide-react'

export default function StatisticsPage() {
  const { data, loading, error, fetchStatistics } = useStatisticsStore()
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    fetchStatistics(selectedPeriod)
  }, [fetchStatistics, selectedPeriod])

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className={`h-8 rounded w-1/3 mb-2 ${isDark ? 'bg-surface-700' : 'bg-surface-200'}`} />
            <div className={`h-4 rounded w-1/2 ${isDark ? 'bg-surface-700' : 'bg-surface-200'}`} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`rounded-2xl p-6 animate-pulse ${isDark ? 'bg-surface-800' : 'bg-white'}`}>
                <div className={`h-6 rounded mb-4 ${isDark ? 'bg-surface-700' : 'bg-surface-200'}`} />
                <div className={`h-64 rounded ${isDark ? 'bg-surface-700' : 'bg-surface-200'}`} />
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
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-danger-500/10 border border-danger-500/20' : 'bg-danger-50 border border-danger-200'}`}>
          <div className={isDark ? 'text-danger-400' : 'text-danger-700'}>
            <strong>エラーが発生しました:</strong> {error}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>統計・レポート</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              習慣の継続状況と達成率を確認しましょう
            </p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className={`px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isDark
                ? 'bg-surface-800 border-surface-700 text-white'
                : 'bg-white border-surface-200 text-surface-900'
            }`}
          >
            <option value={7}>過去7日間</option>
            <option value={30}>過去30日間</option>
            <option value={90}>過去90日間</option>
          </select>
        </div>

        {/* 全体統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                <Target className={`w-6 h-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>総習慣数</p>
                <p className={`text-2xl font-bold font-mono-nums ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {data?.overall.total_habits || 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-success-500/20' : 'bg-success-100'}`}>
                <TrendingUp className={`w-6 h-6 ${isDark ? 'text-success-400' : 'text-success-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>達成率</p>
                <p className={`text-2xl font-bold font-mono-nums ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {data?.overall.achievement_rate.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-accent-500/20' : 'bg-accent-100'}`}>
                <Trophy className={`w-6 h-6 ${isDark ? 'text-accent-400' : 'text-accent-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>平均レベル</p>
                <p className={`text-2xl font-bold font-mono-nums ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {data?.overall.average_level.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-warning-500/20' : 'bg-warning-100'}`}>
                <Clock className={`w-6 h-6 ${isDark ? 'text-warning-400' : 'text-warning-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>完了タスク</p>
                <p className={`text-2xl font-bold font-mono-nums ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {data?.overall.completed_tasks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 達成率チャート */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}>達成率の推移</h2>
            {data?.daily && data.daily.length > 0 ? (
              <AchievementChart data={data.daily} />
            ) : (
              <div className={`h-64 flex items-center justify-center ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                データがありません
              </div>
            )}
          </div>

          {/* 習慣別統計 */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}>習慣別パフォーマンス</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {data?.habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isDark ? 'text-surface-200' : 'text-surface-900'}`}>
                        {habit.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-mono-nums ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                          Lv.{habit.level}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isDark
                            ? 'bg-accent-500/20 text-accent-400'
                            : 'bg-accent-100 text-accent-800'
                        }`}>
                          {habit.streak}日連続
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={habit.achievement_rate}
                      max={100}
                      size="sm"
                      showPercentage={false}
                      color={habit.achievement_rate >= 80 ? 'success' : habit.achievement_rate >= 60 ? 'warning' : 'danger'}
                    />
                    <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                      <span className="font-mono-nums">{habit.completed_tasks}/{habit.total_tasks} 完了</span>
                      <span className="font-mono-nums">{habit.achievement_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )) || (
                <div className={`text-center py-8 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                  習慣データがありません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 週間進捗 */}
        {data?.weekly && data.weekly.length > 0 && (
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}>週間進捗</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.weekly.map((week, index) => (
                <div key={week.week} className={`text-center p-4 rounded-xl ${isDark ? 'bg-surface-700' : 'bg-surface-50'}`}>
                  <div className={`text-sm mb-2 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                    第{index + 1}週
                  </div>
                  <div className="text-2xl font-bold text-primary-500 mb-1 font-mono-nums">
                    {week.achievement.toFixed(1)}%
                  </div>
                  <div className={`text-xs font-mono-nums ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
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
