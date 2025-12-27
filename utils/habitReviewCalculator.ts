// 習慣レビュー スコア計算ユーティリティ

// 質問の重み設定
export const QUESTION_WEIGHTS = {
  q1: 1.5,  // 目標貢献度
  q2: 1.2,  // 目的意識
  q3: 1.0,  // 時間適切さ
  q4: 1.0,  // 生活との調和
  q5: 1.3,  // モチベーション
} as const

// 質問ラベル
export const QUESTION_LABELS = {
  q1: 'この習慣は短期目標の達成に貢献していますか？',
  q2: 'この習慣を目的意識を持って実行できていますか？',
  q3: 'この習慣にかけている時間は適切ですか？',
  q4: 'この習慣は生活リズムに無理なく組み込めていますか？',
  q5: 'この習慣へのモチベーションは維持できていますか？',
} as const

// 質問の短縮ラベル（結果表示用）
export const QUESTION_SHORT_LABELS = {
  q1: '目標貢献度',
  q2: '目的意識',
  q3: '時間適切さ',
  q4: '生活との調和',
  q5: 'モチベーション',
} as const

// 回答選択肢
export const ANSWER_OPTIONS = [
  { value: 5, label: '強くそう思う' },
  { value: 4, label: 'そう思う' },
  { value: 3, label: 'どちらでもない' },
  { value: 2, label: 'あまりそう思わない' },
  { value: 1, label: '全くそう思わない' },
] as const

// 判定タイプ
export type JudgmentType = 'continue' | 'adjust' | 'reconsider' | 'stop'

// 判定結果
export interface ReviewResult {
  totalScore: number
  maxScore: number
  percentage: number
  judgment: JudgmentType
  message: string
  color: string
  bgColor: string
  icon: string
}

// 回答の型
export interface ReviewAnswers {
  q1: number
  q2: number
  q3: number
  q4: number
  q5: number
}

// 満点計算
export const MAX_SCORE = 5 * (
  QUESTION_WEIGHTS.q1 +
  QUESTION_WEIGHTS.q2 +
  QUESTION_WEIGHTS.q3 +
  QUESTION_WEIGHTS.q4 +
  QUESTION_WEIGHTS.q5
) // = 30

// スコア計算
export function calculateReviewScore(answers: ReviewAnswers): ReviewResult {
  const totalScore =
    answers.q1 * QUESTION_WEIGHTS.q1 +
    answers.q2 * QUESTION_WEIGHTS.q2 +
    answers.q3 * QUESTION_WEIGHTS.q3 +
    answers.q4 * QUESTION_WEIGHTS.q4 +
    answers.q5 * QUESTION_WEIGHTS.q5

  const percentage = (totalScore / MAX_SCORE) * 100

  let judgment: JudgmentType
  let message: string
  let color: string
  let bgColor: string
  let icon: string

  if (percentage >= 80) {
    judgment = 'continue'
    message = 'この習慣は目標達成に貢献しています'
    color = 'text-green-600'
    bgColor = 'bg-green-100'
    icon = '✅'
  } else if (percentage >= 60) {
    judgment = 'adjust'
    message = '頻度や方法を見直してみましょう'
    color = 'text-yellow-600'
    bgColor = 'bg-yellow-100'
    icon = '🔄'
  } else if (percentage >= 40) {
    judgment = 'reconsider'
    message = '目標との関連を再確認しましょう'
    color = 'text-orange-600'
    bgColor = 'bg-orange-100'
    icon = '⚠️'
  } else {
    judgment = 'stop'
    message = '別の習慣への切り替えを検討しましょう'
    color = 'text-red-600'
    bgColor = 'bg-red-100'
    icon = '❌'
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    maxScore: MAX_SCORE,
    percentage: Math.round(percentage * 10) / 10,
    judgment,
    message,
    color,
    bgColor,
    icon,
  }
}

// 判定ラベルの取得
export function getJudgmentLabel(judgment: JudgmentType): string {
  switch (judgment) {
    case 'continue':
      return '継続推奨'
    case 'adjust':
      return '調整推奨'
    case 'reconsider':
      return '要検討'
    case 'stop':
      return '中止検討'
  }
}
