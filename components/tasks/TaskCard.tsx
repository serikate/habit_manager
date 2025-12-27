'use client'

import { useState, useEffect } from 'react'
import { Play, CheckCircle, Clock, Calendar, AlertTriangle, Trash2 } from 'lucide-react'
import type { DailyTask, ShortTermGoal } from '@/types'
import { useTaskStore } from '@/stores/taskStore'
import { useProgressStore } from '@/stores/progressStore'
import { useThemeStore } from '@/stores/themeStore'
import { calculatePriority } from '@/utils/priorityCalculator'
import { createClient } from '@/lib/supabase'
import ProgressInputModal from './ProgressInputModal'

interface TaskCardProps {
  task: DailyTask
}

export default function TaskCard({ task }: TaskCardProps) {
  const { startTask, completeTask, deleteTask } = useTaskStore()
  const { recordProgress } = useProgressStore()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const [executing, setExecuting] = useState(false)
  const [actualDuration, setActualDuration] = useState(task.estimated_duration)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [shortTermGoal, setShortTermGoal] = useState<ShortTermGoal | null>(null)
  const [taskStartTime, setTaskStartTime] = useState<Date | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)

  const priorityInfo = calculatePriority(task.importance, task.deadline)
  const isDark = resolvedTheme === 'dark'

  // 習慣タスクの場合、短期目標を取得
  useEffect(() => {
    const fetchShortTermGoal = async () => {
      if (!task.habit?.short_term_goal_id) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('short_term_goals')
        .select('*')
        .eq('id', task.habit.short_term_goal_id)
        .single()

      if (!error && data) {
        setShortTermGoal(data)
      }
    }

    fetchShortTermGoal()
  }, [task.habit?.short_term_goal_id])

  // 開始時刻を記録
  useEffect(() => {
    if (task.status === 'in_progress' && task.started_at) {
      setTaskStartTime(new Date(task.started_at))
    }
  }, [task.status, task.started_at])

  const handleStart = async () => {
    await startTask(task.id)
    setTaskStartTime(new Date())
  }

  // 完了ボタンクリック時
  const handleCompleteClick = () => {
    // 実行時間を計算
    if (taskStartTime) {
      const duration = Math.round((new Date().getTime() - taskStartTime.getTime()) / 60000)
      setActualDuration(duration > 0 ? duration : task.estimated_duration)
    }

    // 習慣タスクで短期目標がある場合は進捗入力モーダルを表示
    if (task.habit && shortTermGoal) {
      setShowProgressModal(true)
    } else {
      // それ以外は従来の完了フォームを表示
      setShowCompleteForm(true)
    }
  }

  // 進捗入力後の完了処理
  const handleProgressConfirm = async (progressValue: number) => {
    setExecuting(true)
    try {
      // 1. 進捗を記録
      if (shortTermGoal && progressValue > 0) {
        await recordProgress(shortTermGoal.id, task.id, progressValue)
      }

      // 2. タスクを完了
      const success = await completeTask(task.id)
      if (success) {
        setShowProgressModal(false)
        setJustCompleted(true)
        setTimeout(() => setJustCompleted(false), 600)
      }
    } finally {
      setExecuting(false)
    }
  }

  // 進捗なしで完了
  const handleProgressSkip = async () => {
    setExecuting(true)
    try {
      const success = await completeTask(task.id)
      if (success) {
        setShowProgressModal(false)
        setJustCompleted(true)
        setTimeout(() => setJustCompleted(false), 600)
      }
    } finally {
      setExecuting(false)
    }
  }

  const handleComplete = async () => {
    setExecuting(true)
    try {
      const success = await completeTask(task.id)
      if (success) {
        setShowCompleteForm(false)
        setJustCompleted(true)
        setTimeout(() => setJustCompleted(false), 600)
      }
    } finally {
      setExecuting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`「${task.habit?.name}」のタスクを削除しますか？`)) return
    await deleteTask(task.id)
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return (
          <div className={`${justCompleted ? 'animate-success-pulse' : ''}`}>
            <CheckCircle className="w-5 h-5 text-success-500" />
          </div>
        )
      case 'in_progress':
        return <Play className="w-5 h-5 text-primary-500" />
      default:
        return <Clock className={`w-5 h-5 ${isDark ? 'text-surface-500' : 'text-surface-400'}`} />
    }
  }

  const getStatusText = () => {
    switch (task.status) {
      case 'completed':
        return '完了'
      case 'in_progress':
        return '実行中'
      case 'skipped':
        return 'スキップ'
      default:
        return '未実行'
    }
  }

  // ステータスに応じたカードスタイル
  const getCardStyles = () => {
    const baseStyles = 'relative rounded-2xl transition-all duration-200'

    if (task.status === 'completed') {
      return `${baseStyles} ${isDark ? 'bg-success-500/10 border border-success-500/20' : 'bg-success-50 border border-success-200'}`
    }
    if (task.status === 'in_progress') {
      return `${baseStyles} ${isDark ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-primary-50 border border-primary-200'}`
    }
    return `${baseStyles} ${isDark ? 'bg-surface-800 border border-surface-700 hover:border-surface-600' : 'bg-white border border-surface-200 hover:border-surface-300 hover:shadow-lg hover:shadow-surface-900/5'} card-hover`
  }

  // ステータスインジケーターバーの色
  const getIndicatorColor = () => {
    if (task.status === 'completed') return 'bg-success-500'
    if (task.status === 'in_progress') return 'bg-primary-500'
    return isDark ? 'bg-surface-600' : 'bg-surface-300'
  }

  // 優先度バッジのスタイル
  const getPriorityBadgeStyles = () => {
    const priority = priorityInfo.priority
    if (priority >= 8) {
      return isDark
        ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
        : 'bg-danger-50 text-danger-700 border border-danger-200'
    }
    if (priority >= 5) {
      return isDark
        ? 'bg-warning-500/20 text-warning-400 border border-warning-500/30'
        : 'bg-warning-50 text-warning-700 border border-warning-200'
    }
    return isDark
      ? 'bg-surface-700 text-surface-300 border border-surface-600'
      : 'bg-surface-100 text-surface-600 border border-surface-200'
  }

  return (
    <>
      <div className={`${getCardStyles()} p-5`}>
        {/* ステータスインジケーターバー */}
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${getIndicatorColor()}`} />

        <div className="pl-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {/* タスク名とカテゴリ */}
              <div className="flex items-center gap-2 mb-2">
                {task.habit?.category && (
                  <div
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50"
                    style={{ backgroundColor: task.habit.category.color }}
                  />
                )}
                <h3 className={`text-base font-semibold tracking-tight ${
                  task.status === 'completed'
                    ? isDark ? 'text-surface-400 line-through' : 'text-surface-500 line-through'
                    : isDark ? 'text-white' : 'text-surface-900'
                }`}>
                  {task.habit?.name}
                </h3>
                {task.is_recurring && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    isDark
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    習慣
                  </span>
                )}
              </div>

              {/* メタ情報 */}
              <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono-nums">{task.estimated_duration}分</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(task.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadgeStyles()}`}>
                  優先度 {priorityInfo.priority}
                </span>
              </div>

              {/* 期限警告 */}
              {task.deadline && (
                <div className="flex items-center gap-1.5 text-sm text-warning-600 mt-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>期限: {new Date(task.deadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              {/* 短期目標への紐づけ表示 */}
              {shortTermGoal && (
                <div className={`text-xs mt-2 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                  🎯 {shortTermGoal.title}
                </div>
              )}

              {/* ステータス表示 */}
              <div className="flex items-center gap-2 mt-3">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${
                  task.status === 'completed' ? 'text-success-600' :
                  task.status === 'in_progress' ? 'text-primary-600' :
                  isDark ? 'text-surface-400' : 'text-surface-500'
                }`}>
                  {getStatusText()}
                </span>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-1 ml-4">
              {task.status === 'pending' && (
                <button
                  onClick={handleStart}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'text-primary-400 hover:bg-primary-500/20'
                      : 'text-primary-600 hover:bg-primary-50'
                  } icon-btn-hover`}
                  title="開始"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
              {(task.status === 'pending' || task.status === 'in_progress') && (
                <button
                  onClick={handleCompleteClick}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'text-success-400 hover:bg-success-500/20'
                      : 'text-success-600 hover:bg-success-50'
                  } icon-btn-hover`}
                  title="完了"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
              {task.status === 'pending' && (
                <button
                  onClick={handleDelete}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'text-danger-400 hover:bg-danger-500/20'
                      : 'text-danger-600 hover:bg-danger-50'
                  } icon-btn-hover`}
                  title="削除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* 従来の完了フォーム（習慣タスク以外用） */}
          {showCompleteForm && (
            <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-surface-700' : 'bg-surface-50'} animate-fade-in-up`}>
              <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-surface-900'}`}>
                タスク完了
              </h4>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm mb-1.5 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                    実際の実行時間（分）
                  </label>
                  <input
                    type="number"
                    value={actualDuration}
                    onChange={(e) => setActualDuration(Number(e.target.value))}
                    min="1"
                    max="480"
                    className={`w-full px-4 py-2.5 rounded-xl border transition-colors font-mono-nums ${
                      isDark
                        ? 'bg-surface-800 border-surface-600 text-white focus:border-primary-500'
                        : 'bg-white border-surface-300 text-surface-900 focus:border-primary-500'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleComplete}
                    disabled={executing}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-success-500 rounded-xl hover:bg-success-600 focus:outline-none focus:ring-2 focus:ring-success-500/50 disabled:opacity-50 transition-colors btn-hover"
                  >
                    {executing ? '完了中...' : '完了'}
                  </button>
                  <button
                    onClick={() => setShowCompleteForm(false)}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                      isDark
                        ? 'text-surface-300 bg-surface-600 hover:bg-surface-500'
                        : 'text-surface-700 bg-surface-200 hover:bg-surface-300'
                    }`}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 進捗入力モーダル */}
      <ProgressInputModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onConfirm={handleProgressConfirm}
        onSkip={handleProgressSkip}
        taskName={task.habit?.name || 'タスク'}
        shortTermGoal={shortTermGoal}
        actualDuration={actualDuration}
      />
    </>
  )
}
