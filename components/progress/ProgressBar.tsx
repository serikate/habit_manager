'use client'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  size = 'md',
  showPercentage = true,
  color = 'blue'
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-600'
      case 'yellow':
        return 'bg-yellow-500'
      case 'red':
        return 'bg-red-600'
      case 'purple':
        return 'bg-purple-600'
      default:
        return 'bg-blue-600'
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

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${getSizeClasses()}`}>
        <div
          className={`${getSizeClasses()} ${getColorClasses()} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {size === 'lg' && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}