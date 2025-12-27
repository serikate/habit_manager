/**
 * 分を「○時間○分」形式に変換
 * @param minutes 分数
 * @returns フォーマットされた文字列
 */
export function formatMinutesToHoursMinutes(minutes: number): string {
  if (minutes < 0) return '0分'

  if (minutes < 60) {
    return `${Math.round(minutes)}分`
  }

  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (mins === 0) {
    return `${hours}時間`
  }

  return `${hours}時間${mins}分`
}

/**
 * 「○時間○分」形式から分数に変換
 * @param formatted フォーマットされた文字列
 * @returns 分数
 */
export function parseHoursMinutesToMinutes(formatted: string): number {
  const hoursMatch = formatted.match(/(\d+)時間/)
  const minsMatch = formatted.match(/(\d+)分/)

  const hours = hoursMatch && hoursMatch[1] ? parseInt(hoursMatch[1], 10) : 0
  const mins = minsMatch && minsMatch[1] ? parseInt(minsMatch[1], 10) : 0

  return hours * 60 + mins
}

/**
 * 進捗値を単位に応じてフォーマット
 * @param value 値
 * @param unit 単位
 * @param suffix 接尾辞
 * @returns フォーマットされた文字列
 */
export function formatProgressValue(value: number, unit: string, suffix: string): string {
  if (unit === 'minutes') {
    return formatMinutesToHoursMinutes(value)
  }

  // 小数点がある場合は小数点以下1桁まで表示
  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1)
  return `${formattedValue}${suffix}`
}

/**
 * 進捗率を計算
 * @param currentValue 現在値
 * @param targetValue 目標値
 * @returns 進捗率（%）
 */
export function calculateProgressRate(currentValue: number, targetValue: number): number {
  if (targetValue <= 0) return 0
  return (currentValue / targetValue) * 100
}

/**
 * 進捗率に応じた色クラスを返す
 * @param rate 進捗率（%）
 * @returns Tailwind CSSクラス
 */
export function getProgressColorClass(rate: number): string {
  if (rate >= 100) return 'bg-blue-500'  // 達成
  if (rate >= 71) return 'bg-green-500'  // 良好
  if (rate >= 31) return 'bg-yellow-500' // 頑張ろう
  return 'bg-red-500' // 要注意
}

/**
 * 進捗率に応じたテキスト色クラスを返す
 * @param rate 進捗率（%）
 * @returns Tailwind CSSクラス
 */
export function getProgressTextColorClass(rate: number): string {
  if (rate >= 100) return 'text-blue-600'
  if (rate >= 71) return 'text-green-600'
  if (rate >= 31) return 'text-yellow-600'
  return 'text-red-600'
}
