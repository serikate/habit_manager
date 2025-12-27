'use client'

import { Trophy, Star, Zap } from 'lucide-react'
import { getLevelInfo, getTitle } from '@/utils/levelSystem'
import type { TitleMode } from '@/utils/levelSystem'
import { useThemeStore } from '@/stores/themeStore'

interface LevelDisplayProps {
  experiencePoints: number
  titleMode?: TitleMode
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

export default function LevelDisplay({
  experiencePoints,
  titleMode = 'business',
  size = 'md',
  showTitle = true
}: LevelDisplayProps) {
  const levelInfo = getLevelInfo(experiencePoints)
  const title = getTitle(levelInfo.level, titleMode)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  const xpPercentage = (levelInfo.currentXP / levelInfo.nextLevelXP) * 100

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4',
          iconSize: 'w-12 h-12',
          iconInner: 'w-6 h-6',
          level: 'text-2xl',
          title: 'text-sm',
          subtitle: 'text-xs'
        }
      case 'lg':
        return {
          container: 'p-8',
          iconSize: 'w-20 h-20',
          iconInner: 'w-10 h-10',
          level: 'text-5xl',
          title: 'text-lg',
          subtitle: 'text-sm'
        }
      default:
        return {
          container: 'p-6',
          iconSize: 'w-16 h-16',
          iconInner: 'w-8 h-8',
          level: 'text-4xl',
          title: 'text-base',
          subtitle: 'text-sm'
        }
    }
  }

  const classes = getSizeClasses()

  return (
    <div className={`relative overflow-hidden rounded-2xl ${classes.container} ${
      isDark
        ? 'bg-gradient-to-br from-surface-800 via-surface-800 to-primary-900/50'
        : 'bg-gradient-to-br from-surface-900 via-surface-800 to-primary-900'
    }`}>
      {/* 背景グロー効果 */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent-500/15 rounded-full blur-2xl" />

      <div className="relative">
        {/* レベル情報 */}
        <div className="flex items-center gap-4 mb-6">
          {/* レベルバッジ */}
          <div className="relative">
            <div className={`${classes.iconSize} rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30`}>
              <Trophy className={`${classes.iconInner} text-white`} />
            </div>
            {/* レベル番号オーバーレイ */}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-white rounded-full text-xs font-bold text-accent-600 shadow-md">
              {levelInfo.level}
            </div>
          </div>

          {/* レベル情報テキスト */}
          <div className="flex-1">
            <div className="text-surface-400 text-xs font-medium mb-1">現在のレベル</div>
            <div className={`font-bold text-white tracking-tight font-mono-nums ${classes.level}`}>
              Lv.{levelInfo.level}
            </div>
            {showTitle && (
              <div className={`text-primary-300 font-semibold mt-1 ${classes.title}`}>
                {title}
              </div>
            )}
          </div>

          {/* スター表示 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(Math.min(levelInfo.level, 5))].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-accent-400 fill-current" />
              ))}
            </div>
            {levelInfo.level > 5 && (
              <span className="text-accent-400 text-xs font-semibold">
                +{levelInfo.level - 5}
              </span>
            )}
          </div>
        </div>

        {/* 経験値バー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent-400" />
              次のレベルまで
            </span>
            <span className="font-mono-nums text-white font-semibold">
              {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
            </span>
          </div>

          {/* カスタムプログレスバー */}
          <div className="relative h-3 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-accent-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${xpPercentage}%` }}
            />
            {/* マイルストーンドット */}
            <div className={`absolute top-1/2 left-1/4 w-1 h-1 rounded-full -translate-y-1/2 ${
              xpPercentage >= 25 ? 'bg-white/50' : 'bg-surface-600'
            }`} />
            <div className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full -translate-y-1/2 ${
              xpPercentage >= 50 ? 'bg-white/50' : 'bg-surface-600'
            }`} />
            <div className={`absolute top-1/2 left-3/4 w-1 h-1 rounded-full -translate-y-1/2 ${
              xpPercentage >= 75 ? 'bg-white/50' : 'bg-surface-600'
            }`} />
          </div>

          {/* 残りXP */}
          <div className="flex justify-between text-xs">
            <span className="text-surface-500">
              総獲得: <span className="font-mono-nums text-surface-400">{experiencePoints} XP</span>
            </span>
            <span className="text-primary-400 font-medium">
              あと <span className="font-mono-nums">{levelInfo.nextLevelXP - levelInfo.currentXP}</span> XP
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
