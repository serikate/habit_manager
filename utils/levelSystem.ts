export type TitleMode = 'business' | 'light'

export interface LevelInfo {
  level: number
  currentXP: number
  nextLevelXP: number
  progress: number
  title: string
}

export interface TitleConfig {
  level: number
  business: string
  light: string
}

export const TITLES: TitleConfig[] = [
  // Lv.1-10
  { level: 1, business: 'チャレンジャー', light: '習慣のたね' },
  { level: 2, business: 'ビギナー', light: '継続ひよこ' },
  { level: 5, business: 'スターター', light: '頑張る人' },

  // Lv.11-30
  { level: 11, business: 'プログレッサー', light: '継続の旅人' },
  { level: 21, business: 'アチーバー', light: '習慣育て人' },
  { level: 25, business: 'パフォーマー', light: 'コツコツ戦士' },

  // Lv.31-70
  { level: 31, business: 'エキスパート', light: '習慣の達人' },
  { level: 51, business: 'プロフェッショナル', light: '継続マスター' },
  { level: 61, business: 'スペシャリスト', light: '習慣王' },

  // Lv.71-100
  { level: 71, business: 'マスター', light: '習慣レジェンド' },
  { level: 85, business: 'エクセレンス', light: '継続の神' },
  { level: 95, business: 'レジェンド', light: '習慣仙人' },
]

export function calculateLevel(experiencePoints: number): number {
  // 簡単なレベル計算: 100XPごとに1レベル上昇
  return Math.floor(experiencePoints / 100) + 1
}

export function getNextLevelXP(level: number): number {
  return level * 100
}

export function getLevelInfo(experiencePoints: number): LevelInfo {
  const level = calculateLevel(experiencePoints)
  const currentLevelXP = (level - 1) * 100
  const nextLevelXP = level * 100
  const currentXP = experiencePoints - currentLevelXP
  const requiredXP = nextLevelXP - currentLevelXP
  const progress = (currentXP / requiredXP) * 100

  return {
    level,
    currentXP,
    nextLevelXP: requiredXP,
    progress,
    title: getTitle(level, 'business') // デフォルトはビジネスモード
  }
}

export function getTitle(level: number, mode: TitleMode): string {
  // レベルに対応する称号を探す（降順でチェック）
  const sortedTitles = [...TITLES].sort((a, b) => b.level - a.level)

  for (const titleConfig of sortedTitles) {
    if (level >= titleConfig.level) {
      return mode === 'business' ? titleConfig.business : titleConfig.light
    }
  }

  // 最低レベルの称号を返す
  return mode === 'business' ? TITLES[0]!.business : TITLES[0]!.light
}

export function calculateOverallLevel(habits: Array<{ level: number; experience_points: number }>): LevelInfo {
  if (habits.length === 0) {
    return getLevelInfo(0)
  }

  // 全習慣の平均レベルを計算
  const totalLevels = habits.reduce((sum, habit) => sum + habit.level, 0)
  const averageLevel = totalLevels / habits.length

  // 平均レベルから経験値を逆算
  const experiencePoints = Math.floor((averageLevel - 1) * 100)

  return getLevelInfo(experiencePoints)
}

export function addExperience(currentXP: number, achievementRate: number): number {
  // 達成率に基づいて経験値を追加
  // 100%達成で10XP、達成率に比例して減少
  const baseXP = 10
  const earnedXP = Math.floor(baseXP * (achievementRate / 100))
  return currentXP + Math.max(1, earnedXP) // 最低1XPは保証
}

export function shouldLevelUp(oldXP: number, newXP: number): boolean {
  const oldLevel = calculateLevel(oldXP)
  const newLevel = calculateLevel(newXP)
  return newLevel > oldLevel
}

export function getLevelUpAnimation(newLevel: number): {
  show: boolean
  level: number
  title: string
} {
  return {
    show: true,
    level: newLevel,
    title: getTitle(newLevel, 'business')
  }
}