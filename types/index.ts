// ============================================================
// 1年後ビジョン関連の型定義
// ============================================================

// 期間パターン
export type PeriodPattern = 'exact_half' | 'half_month_end'

// 1年後ビジョン
export interface Vision {
  id: string
  user_id: string
  title: string
  description?: string
  period_months: number  // 6-18
  deadline: string
  is_achieved: boolean
  created_at: string
  updated_at: string
  long_term_goals?: LongTermGoal[]  // 紐づく長期目標
}

// ビジョン作成用
export interface CreateVisionData {
  title: string
  description?: string
  period_months: number
}

// ビジョン更新用
export interface UpdateVisionData {
  title?: string
  description?: string
  period_months?: number
  is_achieved?: boolean
}

// ============================================================
// 測定単位関連の型定義
// ============================================================

// プリセット単位の型
export type PresetUnit = 'count' | 'days' | 'minutes' | 'words' | 'yen' | 'books'

// 測定単位の型（プリセット or カスタム）
export type MeasurementUnit = PresetUnit | `custom_${string}`

// 単位の入力方法
export type UnitInputMethod = 'auto_increment' | 'auto_time' | 'manual'

// 単位設定の型
export interface UnitConfig {
  key: PresetUnit
  label: string
  inputMethod: UnitInputMethod
  suffix: string
}

// プリセット単位の設定
export const PRESET_UNITS: UnitConfig[] = [
  { key: 'count', label: '回数', inputMethod: 'auto_increment', suffix: '回' },
  { key: 'days', label: '日数', inputMethod: 'auto_increment', suffix: '日' },
  { key: 'minutes', label: '時間（分）', inputMethod: 'auto_time', suffix: '分' },
  { key: 'words', label: '単語', inputMethod: 'manual', suffix: '語' },
  { key: 'yen', label: '円', inputMethod: 'manual', suffix: '円' },
  { key: 'books', label: '冊', inputMethod: 'manual', suffix: '冊' },
]

// カスタム単位
export interface CustomUnit {
  id: string
  user_id: string
  name: string
  created_at: string
}

// 進捗入力履歴
export interface ProgressEntry {
  id: string
  short_term_goal_id: string
  task_id: string | null
  value: number
  created_at: string
  updated_at: string
  is_correction: boolean
}

// ============================================================
// 基本的なエンティティ型
// ============================================================

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface LongTermGoal {
  id: string
  user_id: string
  vision_id: string  // 🆕 紐づくビジョン（必須）
  title: string
  description?: string
  period: number // 旧: 3, 6, 12 months（後方互換用）
  period_months: number  // 🆕 期間（月数）
  period_pattern: PeriodPattern  // 🆕 期間パターン
  deadline: string
  is_achieved: boolean
  created_at: string
  updated_at?: string
  vision?: Vision  // 🆕 紐づくビジョン
  short_term_goals?: ShortTermGoal[]
}

export interface ShortTermGoal {
  id: string
  user_id: string
  long_term_goal_id: string
  title: string
  measurement_unit: MeasurementUnit  // プリセット or カスタム単位
  target_value: number  // 目標値（小数点可）
  current_value: number  // 現在値（小数点可）
  target_month: string  // 🆕 対象月（YYYY-MM-DD形式、日は01固定）
  is_achieved: boolean  // 達成状態
  show_after_achieved: boolean  // 達成後も表示するか
  deadline?: string  // 期限（任意）
  created_at: string
  updated_at?: string
  long_term_goal?: LongTermGoal
  habits?: Habit[]  // 紐づく習慣
  progress_entries?: ProgressEntry[]  // 進捗履歴
}

// 曜日設定の型定義
export interface DaySchedule {
  enabled: boolean
  time?: string // "06:00" format
}

export interface WeeklySchedule {
  monday?: DaySchedule
  tuesday?: DaySchedule
  wednesday?: DaySchedule
  thursday?: DaySchedule
  friday?: DaySchedule
  saturday?: DaySchedule
  sunday?: DaySchedule
}

export interface Habit {
  id: string
  user_id: string
  name: string
  category_id: string | null
  short_term_goal_id: string | null  // 短期目標への紐づけ（目標削除時はnull）
  default_duration: number
  avg_actual_duration: number
  level: number
  experience_points: number
  is_active: boolean
  created_at: string
  category?: Category
  short_term_goal?: ShortTermGoal  // 紐づく短期目標
  schedule: WeeklySchedule  // 曜日別スケジュール
}

export interface HabitGoalRelation {
  id: string
  habit_id: string
  short_term_goal_id: string
  created_at: string
  habit?: Habit
  short_term_goal?: ShortTermGoal
}

export interface DailyTask {
  id: string
  user_id: string
  habit_id: string | null // 🆕 単発タスクの場合はnull
  date: string
  estimated_duration: number
  importance: 1 | 2 | 3
  deadline: string | null
  is_recurring: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  created_at: string
  habit?: Habit
  // 🆕 自動生成フラグ
  auto_generated?: boolean
  scheduled_time?: string
  started_at?: string  // 🆕 実際の開始日時
  executions?: TaskExecution[]  // 🆕 実行履歴
}

// 🆕 単発タスク専用型
export interface OneTimeTask {
  id: string
  user_id: string
  title: string
  description?: string
  estimated_duration: number
  importance: 1 | 2 | 3
  urgency: number
  deadline: string
  category?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  created_at: string
}

export interface TaskExecution {
  id: string
  task_id: string
  started_at: string  // 🆕 開始日時
  actual_duration: number
  achievement_rate: number
  completed_at: string
  task?: DailyTask
}

export interface WorkLimit {
  id: string
  user_id: string
  day_of_week: number // 0=Sunday
  max_minutes: number
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  title_mode: 'business' | 'light'
  notification_enabled: boolean
  theme_mode: 'light' | 'dark' | 'system'
  created_at: string
}

export interface HabitReview {
  id: string
  user_id: string
  habit_id: string
  review_date: string
  action: 'continue' | 'modify' | 'pause'
  notes: string | null
  created_at: string
  habit?: Habit
}

// Form types
export interface CreateCategoryData {
  name: string
  color: string
}

// 習慣作成用の型定義
export interface CreateHabitData {
  name: string
  category_id: string | null
  short_term_goal_id: string | null  // 短期目標への紐づけ（目標削除時はnull）
  default_duration: number
  schedule: WeeklySchedule
}

// 長期目標作成用の型定義
export interface CreateLongTermGoalData {
  vision_id: string
  title: string
  description?: string
  period_pattern: PeriodPattern
}

// 長期目標更新用の型定義
export interface UpdateLongTermGoalData {
  title?: string
  description?: string
  is_achieved?: boolean
}

// 短期目標作成用の型定義
export interface CreateShortTermGoalData {
  title: string
  long_term_goal_id: string
  measurement_unit: MeasurementUnit
  target_value: number
  target_month?: string  // 🆕 対象月（省略時は現在月）
  deadline?: string
  show_after_achieved?: boolean
}

// 短期目標更新用の型定義
export interface UpdateShortTermGoalData {
  title?: string
  measurement_unit?: MeasurementUnit
  target_value?: number
  current_value?: number
  deadline?: string
  is_achieved?: boolean
  show_after_achieved?: boolean
}

// 🆕 習慣スケジュール設定用の型
export interface HabitScheduleForm {
  quickPattern: 'weekdays' | 'everyday' | 'weekends' | 'custom'
  quickTime: string
  detailSchedule?: WeeklySchedule
  selectedPreset?: string
}

// 🆕 単発タスク作成用の型
export interface CreateOneTimeTaskData {
  title: string
  description?: string
  estimated_duration: number
  importance: 1 | 2 | 3
  urgency?: number
  deadline: string
  category?: string
}

export interface CreateTaskData {
  habit_id: string | null // 🆕 単発タスクの場合はnull
  date: string
  estimated_duration: number
  importance: 1 | 2 | 3
  deadline: string | null
  is_recurring: boolean
  title?: string // 🆕 単発タスクの場合に使用
}

// 🆕 タスク実行時間編集履歴
export interface TaskExecutionEdit {
  id: string
  execution_id: string
  old_started_at: string
  old_completed_at: string
  old_actual_duration: number
  old_achievement_rate: number
  new_started_at: string
  new_completed_at: string
  new_actual_duration: number
  new_achievement_rate: number
  edited_by: string
  edited_at: string
  edit_reason?: string
  created_at: string
}

// 🆕 実行時間編集用のフォームデータ
export interface EditExecutionData {
  started_at: string  // ISO 8601形式
  completed_at: string  // ISO 8601形式
  edit_reason?: string
}

// ============================================================
// ユーザープロファイル・グローバルレベル関連
// ============================================================

export interface UserProfile {
  id: string
  user_id: string
  total_experience_points: number
  current_streak: number
  longest_streak: number
  last_completion_date: string | null
  total_tasks_completed: number
  total_habits_completed: number
  created_at: string
  updated_at: string
}

export interface XPTransaction {
  id: string
  user_id: string
  amount: number
  source_type: 'habit_completion' | 'streak_bonus' | 'achievement' | 'other'
  source_id: string | null
  streak_at_time: number
  created_at: string
}