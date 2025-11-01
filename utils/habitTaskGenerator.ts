import { format, addDays, startOfDay } from 'date-fns'
import type { Habit, DailyTask, WeeklySchedule } from '@/types'

/**
 * 習慣タスクの自動生成ロジック
 */

// 曜日の対応表
const DAY_NAME_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
} as const

/**
 * 指定した日付の習慣タスクを生成
 * @param habit 習慣オブジェクト
 * @param targetDate 対象日付
 * @returns 生成されたタスクデータ（該当なしの場合はnull）
 */
export function generateHabitTaskForDate(
  habit: Habit,
  targetDate: Date
): Partial<DailyTask> | null {
  const dayOfWeek = targetDate.getDay() // 0=Sunday, 1=Monday, ...
  const dayName = DAY_NAME_MAP[dayOfWeek as keyof typeof DAY_NAME_MAP] as keyof WeeklySchedule

  const daySchedule = habit.schedule?.[dayName]

  if (!daySchedule?.enabled) {
    return null // この曜日は実行しない
  }

  return {
    habit_id: habit.id,
    date: format(targetDate, 'yyyy-MM-dd'),
    estimated_duration: habit.default_duration,
    importance: 2, // 習慣タスクのデフォルト重要度
    deadline: null, // 習慣タスクには期限なし
    is_recurring: true,
    status: 'pending',
    auto_generated: true,
    ...(daySchedule.time ? { scheduled_time: daySchedule.time } : {})
  }
}

/**
 * 複数の習慣について指定期間のタスクを一括生成
 * @param habits 習慣の配列
 * @param startDate 開始日
 * @param days 生成日数
 * @returns 生成されたタスクデータの配列
 */
export function generateHabitTasksForPeriod(
  habits: Habit[],
  startDate: Date,
  days: number = 7
): Partial<DailyTask>[] {
  const tasks: Partial<DailyTask>[] = []

  for (let i = 0; i < days; i++) {
    const targetDate = addDays(startDate, i)

    habits.forEach(habit => {
      if (habit.is_active) {
        const task = generateHabitTaskForDate(habit, targetDate)
        if (task) {
          tasks.push(task)
        }
      }
    })
  }

  return tasks
}

/**
 * 今日の習慣タスクを生成
 * @param habits 習慣の配列
 * @returns 今日生成すべき習慣タスクの配列
 */
export function generateTodayHabitTasks(habits: Habit[]): Partial<DailyTask>[] {
  const today = startOfDay(new Date())
  return generateHabitTasksForPeriod(habits, today, 1)
}

/**
 * 明日の習慣タスクを生成（前日夜の設定想定）
 * @param habits 習慣の配列
 * @returns 明日生成すべき習慣タスクの配列
 */
export function generateTomorrowHabitTasks(habits: Habit[]): Partial<DailyTask>[] {
  const tomorrow = addDays(startOfDay(new Date()), 1)
  return generateHabitTasksForPeriod(habits, tomorrow, 1)
}

/**
 * 来週分の習慣タスクを生成
 * @param habits 習慣の配列
 * @returns 来週分の習慣タスクの配列
 */
export function generateNextWeekHabitTasks(habits: Habit[]): Partial<DailyTask>[] {
  const nextWeekStart = addDays(startOfDay(new Date()), 7)
  return generateHabitTasksForPeriod(habits, nextWeekStart, 7)
}

/**
 * 習慣タスクが既に存在するかチェック
 * @param existingTasks 既存のタスク配列
 * @param habitId 習慣ID
 * @param date 日付
 * @returns 既に存在する場合はtrue
 */
export function isHabitTaskAlreadyExists(
  existingTasks: DailyTask[],
  habitId: string,
  date: string
): boolean {
  return existingTasks.some(
    task => task.habit_id === habitId &&
           task.date === date &&
           task.is_recurring === true
  )
}

/**
 * 重複を除いて新しい習慣タスクのみを抽出
 * @param newTasks 新しく生成されたタスク配列
 * @param existingTasks 既存のタスク配列
 * @returns 重複を除いた新しいタスクの配列
 */
export function filterNewHabitTasks(
  newTasks: Partial<DailyTask>[],
  existingTasks: DailyTask[]
): Partial<DailyTask>[] {
  return newTasks.filter(newTask => {
    if (!newTask.habit_id || !newTask.date) return false

    return !isHabitTaskAlreadyExists(
      existingTasks,
      newTask.habit_id,
      newTask.date
    )
  })
}

/**
 * デバッグ用: 生成されたタスクの情報を表示
 * @param tasks タスク配列
 * @param label ラベル
 */
export function debugGeneratedTasks(
  tasks: Partial<DailyTask>[],
  label: string = 'Generated Tasks'
) {
  console.group(`🔧 ${label}`);

  if (tasks.length === 0) {
    console.log('📭 No tasks generated');
  } else {
    tasks.forEach((task, index) => {
      console.log(`📋 Task ${index + 1}:`, {
        habit_id: task.habit_id,
        date: task.date,
        scheduled_time: task.scheduled_time,
        duration: task.estimated_duration,
        auto_generated: task.auto_generated
      });
    });
  }

  console.groupEnd();
}
