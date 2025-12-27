'use client'

import { useMemo, useState } from 'react'
import { useTutorialStore } from '@/stores/tutorialStore'
import { TUTORIAL_STEPS } from './tutorialSteps'
import type { HighlightRect } from './TutorialOverlay'

interface TooltipProps {
  highlightRect: HighlightRect | null
}

export function TutorialTooltip({ highlightRect }: TooltipProps) {
  const {
    getCurrentStep,
    currentStepIndex,
    nextStep,
    skipAll
  } = useTutorialStore()
  const currentStep = getCurrentStep()
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  const tooltipPosition = useMemo(() => {
    if (!currentStep) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    if (currentStep.position === 'center' || !highlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    const padding = 16
    const tooltipWidth = 320
    const tooltipHeight = 200
    const sidebarMinLeft = 280 // サイドバーの右外側に配置するための最小左位置

    // ビューポートのサイズを取得
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // サイドバー要素かどうかを判定
    const isSidebarTarget = currentStep.target?.includes('sidebar')

    // モーダルがハイライトされているかを判定（waitForActionでハイライトが中央付近にある場合）
    const isModalHighlighted = currentStep.waitForAction &&
      highlightRect.left > 100 &&
      highlightRect.width > 200

    let position: React.CSSProperties = {}

    // モーダルがハイライトされている場合は右側に配置
    if (isModalHighlighted) {
      const modalRight = highlightRect.left + highlightRect.width
      const hasSpaceOnRight = modalRight + padding + tooltipWidth < viewportWidth

      if (hasSpaceOnRight) {
        position = {
          top: Math.min(
            Math.max(highlightRect.top, padding),
            viewportHeight - tooltipHeight - padding
          ),
          left: modalRight + padding
        }
      } else {
        // 右にスペースがない場合は左側に配置
        position = {
          top: Math.min(
            Math.max(highlightRect.top, padding),
            viewportHeight - tooltipHeight - padding
          ),
          left: Math.max(highlightRect.left - tooltipWidth - padding, padding)
        }
      }
      return position
    }

    switch (currentStep.position) {
      case 'bottom':
        position = {
          top: highlightRect.top + highlightRect.height + padding,
          left: Math.min(
            Math.max(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, padding),
            viewportWidth - tooltipWidth - padding
          )
        }
        break
      case 'top':
        position = {
          top: highlightRect.top - tooltipHeight - padding,
          left: Math.min(
            Math.max(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, padding),
            viewportWidth - tooltipWidth - padding
          )
        }
        break
      case 'right':
        // サイドバーの場合はサイドバーの右外側に配置
        const leftPosition = isSidebarTarget
          ? sidebarMinLeft
          : highlightRect.left + highlightRect.width + padding
        position = {
          top: Math.min(
            Math.max(highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2, padding),
            viewportHeight - tooltipHeight - padding
          ),
          left: Math.min(leftPosition, viewportWidth - tooltipWidth - padding)
        }
        break
      case 'left':
        position = {
          top: Math.min(
            Math.max(highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2, padding),
            viewportHeight - tooltipHeight - padding
          ),
          left: highlightRect.left - tooltipWidth - padding
        }
        break
      default:
        position = {
          top: highlightRect.top + highlightRect.height + padding,
          left: Math.min(
            Math.max(highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2, padding),
            viewportWidth - tooltipWidth - padding
          )
        }
    }

    return position
  }, [currentStep, highlightRect])

  if (!currentStep) return null

  const isWaitingForAction = !!currentStep.waitForAction
  const isWaitingForNavigation = !!currentStep.waitForNavigation
  const showNextButton = !isWaitingForAction && !isWaitingForNavigation
  const isLastStep = currentStep.id === 'complete'

  const handleSkipAll = () => {
    if (showSkipConfirm) {
      skipAll()
      setShowSkipConfirm(false)
    } else {
      setShowSkipConfirm(true)
    }
  }

  const getArrowClass = () => {
    if (!highlightRect || currentStep.position === 'center') return ''

    const baseClass = 'absolute w-3 h-3 bg-white transform rotate-45'

    switch (currentStep.position) {
      case 'bottom':
        return `${baseClass} -top-1.5 left-1/2 -translate-x-1/2 border-l border-t border-gray-200`
      case 'top':
        return `${baseClass} -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-gray-200`
      case 'right':
        return `${baseClass} top-1/2 -left-1.5 -translate-y-1/2 border-l border-b border-gray-200`
      case 'left':
        return `${baseClass} top-1/2 -right-1.5 -translate-y-1/2 border-r border-t border-gray-200`
      default:
        return ''
    }
  }

  return (
    <div
      className="absolute z-10"
      style={{
        ...tooltipPosition,
        width: 320,
        pointerEvents: 'auto'
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-5 border border-gray-200 relative">
        {/* 矢印 */}
        {highlightRect && currentStep.position !== 'center' && (
          <div className={getArrowClass()} />
        )}

        {/* タイトル */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {currentStep.title}
        </h3>

        {/* 説明 */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {currentStep.content}
        </p>

        {/* アクション待ちの場合のヒント */}
        {isWaitingForAction && (
          <p className="text-blue-600 text-xs mb-4 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            操作を完了してください
          </p>
        )}

        {isWaitingForNavigation && (
          <p className="text-blue-600 text-xs mb-4 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            クリックして移動してください
          </p>
        )}

        {/* スキップ確認 */}
        {showSkipConfirm && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              チュートリアルをスキップしますか？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSkipAll}
                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                スキップする
              </button>
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex items-center justify-between">
          {!isLastStep ? (
            <button
              onClick={handleSkipAll}
              className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              スキップ
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {/* ステップインジケーター */}
            <span className="text-xs text-gray-400">
              {currentStepIndex + 1} / {TUTORIAL_STEPS.length}
            </span>

            {showNextButton && (
              <button
                onClick={isLastStep ? skipAll : nextStep}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isLastStep ? 'ダッシュボードへ' : '次へ'}
              </button>
            )}
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
