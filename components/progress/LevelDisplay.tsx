'use client'

import { Trophy, Star } from 'lucide-react'
import { getLevelInfo, getTitle } from '@/utils/levelSystem'
import type { TitleMode } from '@/utils/levelSystem'
import ProgressBar from './ProgressBar'

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

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3',
          title: 'text-lg',
          level: 'text-2xl',
          subtitle: 'text-xs'
        }
      case 'lg':
        return {
          container: 'p-6',
          title: 'text-2xl',
          level: 'text-4xl',
          subtitle: 'text-sm'
        }
      default:
        return {
          container: 'p-4',
          title: 'text-xl',
          level: 'text-3xl',
          subtitle: 'text-sm'
        }
    }
  }

  const classes = getSizeClasses()

  return (
    <div className={`bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg ${classes.container}`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-shrink-0">
          <div className="p-2 bg-primary-600 rounded-full">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`font-bold text-primary-800 ${classes.level}`}>
              Lv.{levelInfo.level}
            </span>
            <div className="flex space-x-1">
              {[...Array(Math.min(levelInfo.level, 5))].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
              {levelInfo.level > 5 && (
                <span className={`text-yellow-600 font-medium ${classes.subtitle}`}>
                  +{levelInfo.level - 5}
                </span>
              )}
            </div>
          </div>
          {showTitle && (
            <h3 className={`font-semibold text-primary-700 ${classes.title}`}>
              {title}
            </h3>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <ProgressBar
          value={levelInfo.currentXP}
          max={levelInfo.nextLevelXP}
          label="次のレベルまで"
          size="md"
          color="purple"
        />
        <div className="flex justify-between text-xs text-primary-600">
          <span>{experiencePoints} XP</span>
          <span>次のレベル: {levelInfo.nextLevelXP - levelInfo.currentXP} XP</span>
        </div>
      </div>
    </div>
  )
}