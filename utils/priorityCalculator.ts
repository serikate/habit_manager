import { differenceInDays, startOfDay } from 'date-fns'

export interface PriorityCalculation {
  importance: number
  urgency: number
  priority: number
  label: string
  color: string
}

export function calculateUrgency(deadline: Date | string): number {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
  const today = startOfDay(new Date())
  const deadlineDay = startOfDay(deadlineDate)
  const daysUntilDeadline = differenceInDays(deadlineDay, today)

  if (daysUntilDeadline <= 0) return 3 // 当日中
  if (daysUntilDeadline <= 3) return 2 // 3日前から当日前まで
  return 1 // 4日以上前
}

export function calculatePriority(importance: 1 | 2 | 3, deadline: Date | string | null): PriorityCalculation {
  let urgency = 1

  if (deadline) {
    urgency = calculateUrgency(deadline)
  }

  const priority = importance * urgency

  // 優先度ラベルと色の決定
  let label = ''
  let color = ''

  switch (priority) {
    case 9:
      label = '最重要・緊急'
      color = 'bg-red-600 text-white'
      break
    case 6:
      label = '重要・緊急'
      color = 'bg-red-500 text-white'
      break
    case 8:
      label = '最重要・重要'
      color = 'bg-orange-500 text-white'
      break
    case 4:
      label = '重要・重要'
      color = 'bg-orange-400 text-white'
      break
    case 3:
      label = '緊急'
      color = 'bg-yellow-500 text-white'
      break
    case 7:
      label = '最重要'
      color = 'bg-blue-500 text-white'
      break
    case 2:
      label = '重要'
      color = 'bg-blue-400 text-white'
      break
    case 1:
    default:
      label = '通常'
      color = 'bg-gray-400 text-white'
      break
  }

  return {
    importance,
    urgency,
    priority,
    label,
    color
  }
}

export function getImportanceLabel(importance: 1 | 2 | 3): string {
  switch (importance) {
    case 3:
      return '高'
    case 2:
      return '中'
    case 1:
      return '低'
    default:
      return '不明'
  }
}

export function getUrgencyLabel(urgency: number): string {
  switch (urgency) {
    case 3:
      return '緊急'
    case 2:
      return '重要'
    case 1:
      return '通常'
    default:
      return '不明'
  }
}

export function sortTasksByPriority<T extends { importance: 1 | 2 | 3; deadline: string | null; is_recurring: boolean }>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    // 習慣タスクを別枠で優先配置
    if (a.is_recurring && !b.is_recurring) return -1
    if (!a.is_recurring && b.is_recurring) return 1

    // 単発タスクが緊急度3の場合のみ習慣タスクより優先
    if (!a.is_recurring && b.is_recurring) {
      const aUrgency = a.deadline ? calculateUrgency(a.deadline) : 1
      if (aUrgency === 3) return -1
    }
    if (a.is_recurring && !b.is_recurring) {
      const bUrgency = b.deadline ? calculateUrgency(b.deadline) : 1
      if (bUrgency === 3) return 1
    }

    // 優先度で比較
    const aPriority = calculatePriority(a.importance, a.deadline).priority
    const bPriority = calculatePriority(b.importance, b.deadline).priority

    if (aPriority !== bPriority) {
      return bPriority - aPriority // 優先度が高い順
    }

    // 優先度が同じ場合は作成日時順（実際のcreated_atがない場合は配列順）
    return 0
  })
}