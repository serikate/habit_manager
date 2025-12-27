import { createClient } from '@/lib/supabase'
import type { DailyTask, ShortTermGoal, LongTermGoal, Vision } from '@/types'

// ============================================================
// クライアントサイド進捗計算ユーティリティ
// ============================================================

/**
 * 短期目標の進捗率を計算
 */
export function calculateShortTermProgress(goal: ShortTermGoal): number {
  if (goal.target_value <= 0) return 0
  return (goal.current_value / goal.target_value) * 100
}

/**
 * 長期目標の進捗率を計算（新方式：月ごとの重み付け）
 * @param goal 長期目標
 * @param shortTermGoals 紐づく短期目標の配列
 */
export function calculateLongTermProgressV2(
  goal: LongTermGoal,
  shortTermGoals: ShortTermGoal[]
): number {
  const periodMonths = goal.period_months || goal.period
  if (!periodMonths || periodMonths === 0) return 0
  if (shortTermGoals.length === 0) return 0

  // 月ごとにグループ化
  const goalsByMonth = new Map<string, ShortTermGoal[]>()
  for (const stg of shortTermGoals) {
    const month = stg.target_month || stg.created_at.slice(0, 7) + '-01'
    if (!goalsByMonth.has(month)) {
      goalsByMonth.set(month, [])
    }
    goalsByMonth.get(month)!.push(stg)
  }

  let totalProgress = 0

  for (const [, monthGoals] of goalsByMonth) {
    const goalCount = monthGoals.length
    const achievedCount = monthGoals.filter(g => g.is_achieved).length

    // この月の貢献度 = 達成数 × (100 / 期間月数 / この月の目標数)
    const monthContribution = achievedCount * (100 / periodMonths / goalCount)
    totalProgress += monthContribution
  }

  return totalProgress
}

/**
 * ビジョンの進捗率を計算
 * @param vision ビジョン
 * @param longTermGoals 紐づく長期目標の配列
 * @param shortTermGoalsByLtg 長期目標IDをキーとした短期目標のMap
 */
export function calculateVisionProgress(
  vision: Vision,
  longTermGoals: LongTermGoal[],
  shortTermGoalsByLtg: Map<string, ShortTermGoal[]>
): number {
  if (longTermGoals.length === 0) return 0

  let totalProgress = 0

  for (const ltg of longTermGoals) {
    const stgs = shortTermGoalsByLtg.get(ltg.id) || []
    totalProgress += calculateLongTermProgressV2(ltg, stgs)
  }

  return totalProgress / longTermGoals.length
}

/**
 * 進捗率に応じた色クラスを返す
 */
export function getProgressColorClass(rate: number): string {
  if (rate >= 100) return 'bg-blue-500'  // 達成
  if (rate >= 71) return 'bg-green-500'  // 良好
  if (rate >= 31) return 'bg-yellow-500' // 頑張ろう
  return 'bg-red-500' // 要注意
}

/**
 * 進捗率に応じたテキスト色クラスを返す
 */
export function getProgressTextColorClass(rate: number): string {
  if (rate >= 100) return 'text-blue-600'
  if (rate >= 71) return 'text-green-600'
  if (rate >= 31) return 'text-yellow-600'
  return 'text-red-600'
}

// ============================================================
// サーバーサイド進捗更新ユーティリティ
// ============================================================

/**
 * タスク完了時に短期目標の進捗を更新
 * @param task 完了したタスク
 */
export async function updateShortTermGoalProgress(task: DailyTask): Promise<boolean> {
  const supabase = createClient()
  try {
    // タスクに紐づく習慣を取得
    if (!task.habit_id) {
      console.log('習慣タスクではないため、進捗更新をスキップします')
      return true
    }

    // 習慣から短期目標IDを取得
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('short_term_goal_id')
      .eq('id', task.habit_id)
      .single()

    if (habitError) throw habitError
    if (!habit.short_term_goal_id) {
      console.log('短期目標に紐づいていない習慣のため、進捗更新をスキップします')
      return true
    }

    // 短期目標を取得
    const { data: goal, error: goalError } = await supabase
      .from('short_term_goals')
      .select('*')
      .eq('id', habit.short_term_goal_id)
      .single()

    if (goalError) throw goalError

    // 測定単位に応じて進捗を計算
    let incrementValue = 0

    switch (goal.measurement_unit) {
      case 'count':
        // 回数: タスク完了ごとに +1
        incrementValue = 1
        break

      case 'days':
        // 日数: その日初めての完了なら +1
        const today = new Date().toISOString().split('T')[0]
        const { data: todayTasks } = await supabase
          .from('daily_tasks')
          .select('id, status')
          .eq('habit_id', task.habit_id)
          .eq('date', today)
          .eq('status', 'completed')

        // 今日初めての完了なら +1
        if (todayTasks && todayTasks.length === 1) {
          incrementValue = 1
        }
        break

      case 'minutes':
        // 時間: 実際の実行時間を加算
        if (task.executions && task.executions.length > 0) {
          const latestExecution = task.executions[task.executions.length - 1]
          if (latestExecution) {
            incrementValue = latestExecution.actual_duration
          }
        }
        break

      default:
        console.error('未知の測定単位:', goal.measurement_unit)
        return false
    }

    if (incrementValue === 0) {
      console.log('進捗の増加がないため、更新をスキップします')
      return true
    }

    // 短期目標の current_value を更新（トリガーが自動的に is_achieved を更新）
    const newCurrentValue = goal.current_value + incrementValue

    const { error: updateError } = await supabase
      .from('short_term_goals')
      .update({ current_value: newCurrentValue })
      .eq('id', habit.short_term_goal_id)

    if (updateError) throw updateError

    console.log(`✅ 短期目標の進捗を更新: +${incrementValue} (${goal.current_value} → ${newCurrentValue})`)

    // 短期目標が達成された場合、長期目標の達成状態もチェック
    if (newCurrentValue >= goal.target_value) {
      await checkAndUpdateLongTermGoalAchievement(goal.long_term_goal_id)
    }

    return true
  } catch (error) {
    console.error('短期目標の進捗更新に失敗:', error)
    return false
  }
}

/**
 * 長期目標の達成状態をチェックして更新
 * @param longTermGoalId 長期目標のID
 */
export async function checkAndUpdateLongTermGoalAchievement(longTermGoalId: string): Promise<boolean> {
  const supabase = createClient()
  try {
    // 長期目標に紐づく全ての短期目標を取得
    const { data: shortTermGoals, error: goalsError } = await supabase
      .from('short_term_goals')
      .select('*')
      .eq('long_term_goal_id', longTermGoalId)

    if (goalsError) throw goalsError

    if (!shortTermGoals || shortTermGoals.length === 0) {
      console.log('短期目標が存在しないため、長期目標の達成チェックをスキップします')
      return true
    }

    // 全ての短期目標が達成されているかチェック
    const allAchieved = shortTermGoals.every(goal => goal.is_achieved)

    // 長期目標の is_achieved を更新
    const { error: updateError } = await supabase
      .from('long_term_goals')
      .update({ is_achieved: allAchieved })
      .eq('id', longTermGoalId)

    if (updateError) throw updateError

    if (allAchieved) {
      console.log('🎉 長期目標が達成されました！')
    }

    return true
  } catch (error) {
    console.error('長期目標の達成チェックに失敗:', error)
    return false
  }
}

/**
 * タスク完了取り消し時に短期目標の進捗を減算
 * @param task 取り消したタスク
 */
export async function decrementShortTermGoalProgress(task: DailyTask): Promise<boolean> {
  const supabase = createClient()
  try {
    // タスクに紐づく習慣を取得
    if (!task.habit_id) {
      return true
    }

    // 習慣から短期目標IDを取得
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('short_term_goal_id')
      .eq('id', task.habit_id)
      .single()

    if (habitError) throw habitError
    if (!habit.short_term_goal_id) {
      return true
    }

    // 短期目標を取得
    const { data: goal, error: goalError } = await supabase
      .from('short_term_goals')
      .select('*')
      .eq('id', habit.short_term_goal_id)
      .single()

    if (goalError) throw goalError

    // 測定単位に応じて減算値を計算
    let decrementValue = 0

    switch (goal.measurement_unit) {
      case 'count':
        decrementValue = 1
        break

      case 'days':
        // 日数の場合は同じ日の他の完了タスクをチェック
        const taskDate = task.date
        const { data: sameDayTasks } = await supabase
          .from('daily_tasks')
          .select('id, status')
          .eq('habit_id', task.habit_id)
          .eq('date', taskDate)
          .eq('status', 'completed')
          .neq('id', task.id)

        // 同じ日に他の完了タスクがなければ -1
        if (!sameDayTasks || sameDayTasks.length === 0) {
          decrementValue = 1
        }
        break

      case 'minutes':
        if (task.executions && task.executions.length > 0) {
          const latestExecution = task.executions[task.executions.length - 1]
          if (latestExecution) {
            decrementValue = latestExecution.actual_duration
          }
        }
        break

      default:
        return false
    }

    if (decrementValue === 0) {
      return true
    }

    // current_value を減算（最小値は0）
    const newCurrentValue = Math.max(0, goal.current_value - decrementValue)

    const { error: updateError } = await supabase
      .from('short_term_goals')
      .update({ current_value: newCurrentValue })
      .eq('id', habit.short_term_goal_id)

    if (updateError) throw updateError

    console.log(`⬇️ 短期目標の進捗を減算: -${decrementValue} (${goal.current_value} → ${newCurrentValue})`)

    // 長期目標の達成状態も再チェック
    await checkAndUpdateLongTermGoalAchievement(goal.long_term_goal_id)

    return true
  } catch (error) {
    console.error('短期目標の進捗減算に失敗:', error)
    return false
  }
}
