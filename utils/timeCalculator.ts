import { format, parseISO, addMinutes } from 'date-fns'
import type { DailyTask } from '@/types'

/**
 * タスクから予定開始時刻を取得する
 * scheduled_time が設定されている場合はそれを返し、
 * 設定されていない場合は習慣マスターの schedule から取得する
 * @param task タスクオブジェクト
 * @returns 予定開始時刻（"05:30" 形式）、または undefined
 */
export function getTaskScheduledTime(task: DailyTask): string | undefined {
  // タスクに scheduled_time が設定されている場合はそれを使う
  if (task.scheduled_time) {
    return task.scheduled_time
  }

  // 習慣タスクでない場合は undefined
  if (!task.habit || !task.habit.schedule) {
    return undefined
  }

  // タスクの日付から曜日を取得
  const taskDate = new Date(task.date)
  const dayOfWeek = taskDate.getDay() // 0=Sunday, 1=Monday, ...

  // 曜日名に変換
  const dayNames: Array<keyof typeof task.habit.schedule> = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]

  if (!dayName) {
    return undefined
  }

  // 習慣マスターの schedule から該当曜日の時間を取得
  const daySchedule = task.habit.schedule[dayName]

  return daySchedule?.time
}

/**
 * 予定時間帯を計算して表示用の文字列を返す
 * @param scheduledTime 開始時刻（"05:30" 形式）
 * @param estimatedDuration 予想所要時間（分）
 * @returns "5:30~6:30(60分)" 形式の文字列、または "時間未設定"
 */
export function getScheduledTimeRange(
  scheduledTime: string | undefined,
  estimatedDuration: number
): string {
  if (!scheduledTime) {
    return '時間未設定'
  }

  try {
    // 今日の日付で time を Date オブジェクトに変換
    const parts = scheduledTime.split(':')
    const hours = parseInt(parts[0] || '0', 10)
    const minutes = parseInt(parts[1] || '0', 10)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)

    // 終了時刻を計算
    const endDate = addMinutes(startDate, estimatedDuration)

    // フォーマット
    const startStr = format(startDate, 'H:mm')
    const endStr = format(endDate, 'H:mm')

    return `${startStr}~${endStr}(${estimatedDuration}分)`
  } catch (error) {
    console.error('Failed to parse scheduled time:', error)
    return '時間未設定'
  }
}

/**
 * 実績時間帯を計算して表示用の文字列を返す
 * @param startedAt 開始日時（ISO 8601形式）
 * @param completedAt 完了日時（ISO 8601形式）
 * @returns "5:32~6:42(70分)" 形式の文字列
 */
export function getActualTimeRange(
  startedAt: string,
  completedAt: string
): string {
  const startDate = parseISO(startedAt)
  const endDate = parseISO(completedAt)

  const startStr = format(startDate, 'H:mm')
  const endStr = format(endDate, 'H:mm')

  const duration = calculateDuration(startedAt, completedAt)

  return `${startStr}~${endStr}(${duration}分)`
}

/**
 * 2つの日時の差分を分単位で計算
 * @param startedAt 開始日時（ISO 8601形式）
 * @param completedAt 完了日時（ISO 8601形式）
 * @returns 所要時間（分）
 */
export function calculateDuration(
  startedAt: string,
  completedAt: string
): number {
  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  return Math.round((end - start) / 1000 / 60)
}

/**
 * 達成率を計算
 * @param actualDuration 実際の所要時間（分）
 * @param estimatedDuration 予想所要時間（分）
 * @returns 達成率（%、上限150%）
 */
export function calculateAchievementRate(
  actualDuration: number,
  estimatedDuration: number
): number {
  if (estimatedDuration === 0) return 0
  return Math.min((actualDuration / estimatedDuration) * 100, 150)
}

/**
 * 達成率に応じた色クラスを返す
 * @param rate 達成率（%）
 * @returns Tailwind CSS のテキスト色クラス
 */
export function getAchievementColor(rate: number): string {
  if (rate <= 100) return 'text-green-600'  // 予定内 ✅
  if (rate <= 120) return 'text-yellow-600' // 少し超過 ⚠️
  return 'text-red-600'                     // 大幅超過 ❌
}

/**
 * time input 用に ISO 8601 日時を HH:mm 形式に変換
 * @param isoString ISO 8601形式の日時文字列
 * @returns "05:30" 形式の時刻文字列
 */
export function isoToTimeInput(isoString: string): string {
  const date = parseISO(isoString)
  return format(date, 'HH:mm')
}

/**
 * HH:mm 形式の時刻を今日の日付の ISO 8601 形式に変換
 * @param timeString "05:30" 形式の時刻文字列
 * @param baseDate 基準日（デフォルト: 今日）
 * @returns ISO 8601形式の日時文字列
 */
export function timeInputToISO(
  timeString: string,
  baseDate: Date = new Date()
): string {
  const parts = timeString.split(':')
  const hours = parseInt(parts[0] || '0', 10)
  const minutes = parseInt(parts[1] || '0', 10)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

/**
 * 実行時間編集のバリデーション
 * @param startedAt 開始時刻
 * @param completedAt 完了時刻
 * @throws Error バリデーションエラー
 */
export function validateExecutionTime(
  startedAt: string,
  completedAt: string
): void {
  const start = new Date(startedAt)
  const end = new Date(completedAt)
  const now = new Date()

  // 1. 開始時刻 < 終了時刻
  if (start >= end) {
    throw new Error('終了時刻は開始時刻より後である必要があります')
  }

  // 2. 所要時間 ≤ 24時間
  const duration = calculateDuration(startedAt, completedAt)
  if (duration > 1440) {
    throw new Error('所要時間は24時間以内である必要があります')
  }

  // 3. 未来時刻の禁止
  if (end > now) {
    throw new Error('未来の時刻は入力できません')
  }

  // 4. 負の値の禁止（すでにチェック1でカバー）
  if (duration < 0) {
    throw new Error('所要時間が負の値になっています')
  }
}
