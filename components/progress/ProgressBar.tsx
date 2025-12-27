'use client'

import { useThemeStore } from '@/stores/themeStore'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent'
  showMilestones?: boolean
  animated?: boolean
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  size = 'md',
  showPercentage = true,
  color = 'primary',
  showMilestones = false,
  animated = true
}: ProgressBarProps) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  const percentage = Math.min((value / max) * 100, 100)
  const isComplete = percentage >= 100

  // グラデーションカラー
  const getGradientClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-gradient-to-r from-success-500 to-success-400'
      case 'warning':
        return 'bg-gradient-to-r from-warning-500 to-warning-400'
      case 'danger':
        return 'bg-gradient-to-r from-danger-500 to-danger-400'
      case 'accent':
        return 'bg-gradient-to-r from-accent-500 to-accent-400'
      default:
        return 'bg-gradient-to-r from-primary-500 to-primary-400'
    }
  }

  // テキストカラー
  const getTextColor = () => {
    switch (color) {
      case 'success':
        return isDark ? 'text-success-400' : 'text-success-600'
      case 'warning':
        return isDark ? 'text-warning-400' : 'text-warning-600'
      case 'danger':
        return isDark ? 'text-danger-400' : 'text-danger-600'
      case 'accent':
        return isDark ? 'text-accent-400' : 'text-accent-600'
      default:
        return isDark ? 'text-primary-400' : 'text-primary-600'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2'
      case 'lg':
        return 'h-4'
      default:
        return 'h-3'
    }
  }

  const getTrackColor = () => {
    return isDark ? 'bg-surface-700' : 'bg-surface-200'
  }

  return (
    <div className="w-full">
      {/* ラベルとパーセンテージ */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={`text-sm font-semibold font-mono-nums ${getTextColor()}`}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* プログレスバー本体 */}
      <div className={`relative w-full ${getTrackColor()} rounded-full ${getSizeClasses()} overflow-hidden`}>
        {/* 塗りつぶし部分 */}
        <div
          className={`
            ${getSizeClasses()} ${getGradientClasses()} rounded-full
            ${animated ? 'transition-all duration-700 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        >
          {/* シマーエフェクト（100%時） */}
          {isComplete && animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>

        {/* マイルストーンドット */}
        {showMilestones && size !== 'sm' && (
          <>
            <div className={`absolute top-1/2 left-1/4 w-1.5 h-1.5 rounded-full -translate-y-1/2 -translate-x-1/2 ${
              percentage >= 25 ? 'bg-white/50' : isDark ? 'bg-surface-600' : 'bg-surface-400'
            }`} />
            <div className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -translate-y-1/2 -translate-x-1/2 ${
              percentage >= 50 ? 'bg-white/50' : isDark ? 'bg-surface-600' : 'bg-surface-400'
            }`} />
            <div className={`absolute top-1/2 left-3/4 w-1.5 h-1.5 rounded-full -translate-y-1/2 -translate-x-1/2 ${
              percentage >= 75 ? 'bg-white/50' : isDark ? 'bg-surface-600' : 'bg-surface-400'
            }`} />
          </>
        )}
      </div>

      {/* 数値表示（lgサイズ時） */}
      {size === 'lg' && (
        <div className={`flex justify-between text-xs mt-1.5 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
          <span className="font-mono-nums">{value}</span>
          <span className="font-mono-nums">{max}</span>
        </div>
      )}
    </div>
  )
}
