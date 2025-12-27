'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import TaskList from '@/components/tasks/TaskList'
import FutureTasksPanel from '@/components/tasks/FutureTasksPanel'
import LevelDisplay from '@/components/progress/LevelDisplay'
import ProgressBar from '@/components/progress/ProgressBar'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { useStatisticsStore } from '@/stores/statisticsStore'
import { useVisionStore } from '@/stores/visionStore'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUserProfileStore } from '@/stores/userProfileStore'
import { useDailyTaskAutoGenerator } from '@/hooks/useDailyTaskAutoGenerator'
import { useTaskDisplaySettings } from '@/hooks/useTaskDisplaySettings'
import { calculateOverallLevel, getStreakInfo, calculateStreakBonus } from '@/utils/levelSystem'
import { Plus, BarChart3, Target, Settings, Clock, X, TrendingUp, Zap, CheckCircle, Flame } from 'lucide-react'
import { format, addDays, parseISO, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { VisionReminder } from '@/components/goals/VisionReminder'

export default function DashboardPage() {
  // 自動タスク生成
  const { notification, closeNotification } = useDailyTaskAutoGenerator()

  // 表示日数設定
  const { daysToShow, updateDaysToShow } = useTaskDisplaySettings()

  const { todayTasks, oneTimeTasks, fetchTodayTasks, fetchOneTimeTasks } = useTaskStore()
  const { habits, fetchHabits, generateHabitTasks } = useHabitStore()
  const { data: stats, fetchStatistics } = useStatisticsStore()
  const { visions, fetchVisions, loading: visionsLoading } = useVisionStore()
  const { isActive, isCompleted, wasSkipped, startTutorial } = useTutorialStore()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const { profile, fetchProfile, lastXPGain } = useUserProfileStore()

  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    fetchTodayTasks()
    fetchHabits()
    fetchStatistics(7) // 過去7日間の統計
    fetchOneTimeTasks()
    fetchVisions()
    fetchProfile()
  }, [fetchTodayTasks, fetchHabits, fetchStatistics, fetchOneTimeTasks, fetchVisions, fetchProfile])

  // 初回ユーザー判定：ビジョンも習慣も0件の場合にチュートリアルを発動
  useEffect(() => {
    if (visionsLoading) return // ロード中は判定しない

    const isFirstTimeUser = visions.length === 0 && habits.length === 0
    const shouldStartTutorial = isFirstTimeUser && !isCompleted && !wasSkipped && !isActive

    if (shouldStartTutorial) {
      // 少し遅延させてUIが落ち着いてから発動
      const timer = setTimeout(() => {
        startTutorial()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [visions.length, habits.length, isCompleted, wasSkipped, isActive, startTutorial, visionsLoading])

  // 手動タスク生成（フォールバック）
  const handleManualGenerate = async () => {
    try {
      const tasks = await generateHabitTasks('today')
      await fetchTodayTasks()
      console.log(`✅ 手動でタスクを${tasks.length}件生成しました`)
    } catch (error) {
      console.error('❌ 手動タスク生成エラー:', error)
    }
  }

  // 単発タスクのフィルタリング
  const today = startOfDay(new Date())
  const maxDate = addDays(today, daysToShow)

  // 明日〜設定日数後までの単発タスク
  const futureOneTimeTasks = oneTimeTasks.filter((task) => {
    if (task.status === 'completed') return false
    if (!task.deadline) return false

    const deadline = parseISO(task.deadline)
    return deadline > today && deadline <= maxDate
  })

  const overallLevel = calculateOverallLevel(habits)
  const todayProgress = {
    completed: todayTasks.filter(t => t.status === 'completed').length,
    total: todayTasks.length,
    rate: todayTasks.length > 0 ? (todayTasks.filter(t => t.status === 'completed').length / todayTasks.length) * 100 : 0
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* 通知バナー */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between animate-fade-in-up ${
              notification.type === 'success'
                ? isDark ? 'bg-success-500/20 text-success-300 border border-success-500/30' : 'bg-success-50 text-success-800 border border-success-200'
                : notification.type === 'error'
                ? isDark ? 'bg-danger-500/20 text-danger-300 border border-danger-500/30' : 'bg-danger-50 text-danger-800 border border-danger-200'
                : isDark ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-primary-50 text-primary-800 border border-primary-200'
            }`}
          >
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={closeNotification}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ヘッダー */}
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>
            ダッシュボード
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
            今日も素晴らしい一日にしましょう
          </p>
        </div>

        {/* 1年後ビジョン */}
        <VisionReminder />

        {/* 今日の概要 - 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 今日のタスク */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'} card-hover`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                <Target className={`w-6 h-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>今日のタスク</p>
                <p className={`text-2xl font-bold font-mono-nums ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {todayProgress.completed}<span className={`text-lg ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>/{todayProgress.total}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 今日の達成率 */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'} card-hover`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-success-500/20' : 'bg-success-100'}`}>
                <CheckCircle className={`w-6 h-6 ${isDark ? 'text-success-400' : 'text-success-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>今日の達成率</p>
                <p className={`text-2xl font-bold font-mono-nums ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {todayProgress.rate.toFixed(0)}<span className={`text-lg ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>%</span>
                </p>
              </div>
            </div>
          </div>

          {/* アクティブ習慣 */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'} card-hover`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-accent-500/20' : 'bg-accent-100'}`}>
                <Zap className={`w-6 h-6 ${isDark ? 'text-accent-400' : 'text-accent-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>アクティブ習慣</p>
                <p className={`text-2xl font-bold font-mono-nums ${isDark ? 'text-white' : 'text-surface-900'}`}>
                  {habits.length}<span className={`text-lg ${isDark ? 'text-surface-500' : 'text-surface-400'}`}>件</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 今日のスケジュール */}
          <div className="lg:col-span-2 space-y-8">
            <div className={`rounded-2xl border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'}`}>
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                    今日のスケジュール
                  </h2>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                    {format(new Date(), 'M月d日（E）', { locale: ja })}
                  </p>
                </div>
                <button
                  onClick={handleManualGenerate}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                    isDark
                      ? 'text-primary-300 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30'
                      : 'text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>タスクを生成</span>
                </button>
              </div>
              <div className="p-6">
                <TaskList showTitle={false} />
              </div>
            </div>

            {/* 今週の予定 */}
            <FutureTasksPanel
              tasks={futureOneTimeTasks}
              daysToShow={daysToShow}
              onDaysChange={updateDaysToShow}
            />
          </div>

          {/* 右サイドバー */}
          <div className="space-y-6">
            {/* 全体レベル・称号 */}
            <div>
              <h2 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                全体レベル
              </h2>
              <LevelDisplay
                experiencePoints={profile?.total_experience_points ?? 0}
                size="md"
              />
            </div>

            {/* ストリーク情報 */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'}`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-5 flex items-center gap-2 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                <Flame className="w-4 h-4 text-accent-500" />
                連続達成
              </h3>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                  (profile?.current_streak ?? 0) >= 7
                    ? 'bg-gradient-to-br from-accent-400 to-accent-600'
                    : (profile?.current_streak ?? 0) >= 3
                    ? 'bg-gradient-to-br from-warning-400 to-warning-600'
                    : isDark
                    ? 'bg-surface-700'
                    : 'bg-surface-100'
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-mono-nums ${
                      (profile?.current_streak ?? 0) >= 3 ? 'text-white' : isDark ? 'text-surface-300' : 'text-surface-700'
                    }`}>
                      {profile?.current_streak ?? 0}
                    </div>
                    <div className={`text-xs ${
                      (profile?.current_streak ?? 0) >= 3 ? 'text-white/80' : isDark ? 'text-surface-500' : 'text-surface-500'
                    }`}>日連続</div>
                  </div>
                </div>

                {/* ストリークボーナス表示 */}
                <div className={`text-sm mb-4 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
                  {(profile?.current_streak ?? 0) > 0 && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                      isDark ? 'bg-accent-500/20 text-accent-400' : 'bg-accent-100 text-accent-700'
                    }`}>
                      <Zap className="w-3 h-3" />
                      +{calculateStreakBonus(profile?.current_streak ?? 0)} ボーナスXP
                    </span>
                  )}
                </div>

                {/* 次のマイルストーン */}
                {(() => {
                  const streakInfo = getStreakInfo(profile?.current_streak ?? 0)
                  return (
                    <div className={`text-xs ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                      <span>次のマイルストーン: </span>
                      <span className="font-mono-nums font-semibold">{streakInfo.nextMilestone}日</span>
                      <span className="mx-1">（あと</span>
                      <span className="font-mono-nums font-semibold">{streakInfo.daysUntilNextMilestone}日</span>
                      <span>）</span>
                    </div>
                  )
                })()}

                {/* 最長記録 */}
                {(profile?.longest_streak ?? 0) > (profile?.current_streak ?? 0) && (
                  <div className={`mt-3 pt-3 border-t text-xs ${isDark ? 'border-surface-700 text-surface-500' : 'border-surface-200 text-surface-500'}`}>
                    最長記録: <span className="font-mono-nums font-semibold">{profile?.longest_streak ?? 0}日</span>
                  </div>
                )}
              </div>
            </div>

            {/* 今週の進捗 */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'}`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-5 flex items-center gap-2 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                <TrendingUp className="w-4 h-4" />
                今週の進捗
              </h3>
              <div className="space-y-5">
                <ProgressBar
                  value={stats?.overall.achievement_rate || 0}
                  max={100}
                  label="週間達成率"
                  color="success"
                  showMilestones
                />
                <div className="grid grid-cols-2 gap-4 text-center pt-2">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-surface-700' : 'bg-surface-50'}`}>
                    <div className={`text-xl font-bold font-mono-nums ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                      {stats?.overall.completed_tasks || 0}
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>完了タスク</div>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-surface-700' : 'bg-surface-50'}`}>
                    <div className={`text-xl font-bold font-mono-nums ${isDark ? 'text-accent-400' : 'text-accent-600'}`}>
                      {stats?.overall.average_level.toFixed(1) || 0}
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>平均レベル</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 習慣レベル上位 */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'}`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                レベル上位習慣
              </h3>
              <div className="space-y-4">
                {habits
                  .sort((a, b) => b.level - a.level)
                  .slice(0, 3)
                  .map((habit, index) => (
                    <div key={habit.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-accent-500 text-white'
                            : index === 1
                            ? isDark ? 'bg-surface-600 text-surface-300' : 'bg-surface-300 text-surface-700'
                            : isDark ? 'bg-surface-700 text-surface-400' : 'bg-surface-200 text-surface-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {habit.category && (
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: habit.category.color }}
                            />
                          )}
                          <span className={`text-sm font-medium ${isDark ? 'text-surface-200' : 'text-surface-900'}`}>
                            {habit.name}
                          </span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold font-mono-nums ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                        Lv.{habit.level}
                      </span>
                    </div>
                  ))}
                {habits.length === 0 && (
                  <div className={`text-center py-6 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">習慣を追加してレベルアップを始めましょう！</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200'}`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider mb-5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/habits"
              className={`p-5 border-2 border-dashed rounded-2xl text-center transition-all duration-200 group ${
                isDark
                  ? 'border-surface-600 hover:border-primary-500/50 hover:bg-primary-500/10'
                  : 'border-surface-300 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                isDark ? 'bg-primary-500/20' : 'bg-primary-100'
              }`}>
                <Plus className={`w-6 h-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>習慣を追加</div>
            </Link>
            <Link
              href="/tasks"
              className={`p-5 border-2 border-dashed rounded-2xl text-center transition-all duration-200 group ${
                isDark
                  ? 'border-surface-600 hover:border-success-500/50 hover:bg-success-500/10'
                  : 'border-surface-300 hover:border-success-300 hover:bg-success-50'
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                isDark ? 'bg-success-500/20' : 'bg-success-100'
              }`}>
                <Target className={`w-6 h-6 ${isDark ? 'text-success-400' : 'text-success-600'}`} />
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>タスクを追加</div>
            </Link>
            <Link
              href="/statistics"
              className={`p-5 border-2 border-dashed rounded-2xl text-center transition-all duration-200 group ${
                isDark
                  ? 'border-surface-600 hover:border-accent-500/50 hover:bg-accent-500/10'
                  : 'border-surface-300 hover:border-accent-300 hover:bg-accent-50'
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                isDark ? 'bg-accent-500/20' : 'bg-accent-100'
              }`}>
                <BarChart3 className={`w-6 h-6 ${isDark ? 'text-accent-400' : 'text-accent-600'}`} />
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>統計を確認</div>
            </Link>
            <Link
              href="/settings"
              className={`p-5 border-2 border-dashed rounded-2xl text-center transition-all duration-200 group ${
                isDark
                  ? 'border-surface-600 hover:border-info-500/50 hover:bg-info-500/10'
                  : 'border-surface-300 hover:border-info-300 hover:bg-info-50'
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                isDark ? 'bg-info-500/20' : 'bg-info-100'
              }`}>
                <Settings className={`w-6 h-6 ${isDark ? 'text-info-400' : 'text-info-600'}`} />
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>設定</div>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
