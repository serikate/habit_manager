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
  title: string
  period: number // 3, 6, 12 months
  deadline: string
  created_at: string
}

export interface ShortTermGoal {
  id: string
  user_id: string
  long_term_goal_id: string
  title: string
  target_count: number
  created_at: string
  long_term_goal?: LongTermGoal
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
  default_duration: number
  avg_actual_duration: number
  level: number
  experience_points: number
  is_active: boolean
  created_at: string
  category?: Category
  // 🆕 曜日別スケジュール
  schedule: WeeklySchedule
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

// 🆕 習慣作成用の型定義
export interface CreateHabitData {
  name: string
  category_id: string | null
  default_duration: number
  schedule: WeeklySchedule
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