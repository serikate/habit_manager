'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTutorialStore } from '@/stores/tutorialStore'
import { TutorialTooltip } from './TutorialTooltip'

export interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}

export function TutorialOverlay() {
  const { isActive, getCurrentStep } = useTutorialStore()
  const currentStep = getCurrentStep()
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // チュートリアル中はスクロールを無効化
  useEffect(() => {
    if (isActive) {
      // bodyのスクロールを無効化
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'

      // mainコンテンツエリアのスクロールも無効化
      const mainElement = document.querySelector('main')
      const originalMainOverflow = mainElement?.style.overflow ?? ''
      if (mainElement) {
        // 現在のスクロール位置をリセット
        mainElement.scrollTop = 0
        mainElement.style.overflow = 'hidden'
      }

      // wheel イベントを無効化
      const preventScroll = (e: WheelEvent) => {
        e.preventDefault()
      }
      window.addEventListener('wheel', preventScroll, { passive: false })

      return () => {
        // スクロールを復元
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        if (mainElement) {
          mainElement.style.overflow = originalMainOverflow
        }
        window.removeEventListener('wheel', preventScroll)
      }
    }
  }, [isActive])

  const updateHighlightRect = useCallback(() => {
    if (!currentStep?.target) {
      setHighlightRect(null)
      return
    }

    // waitForActionのステップでモーダルが開いている場合、モーダルをハイライト
    if (currentStep.waitForAction) {
      // data-tutorial-modal属性を持つモーダルを最優先で検索
      const modalContent = document.querySelector('[data-tutorial-modal]')

      if (modalContent) {
        const rect = modalContent.getBoundingClientRect()
        // 実際に表示されているモーダルかチェック（適切なサイズがある）
        if (rect.width > 100 && rect.height > 100) {
          const padding = 8
          setHighlightRect({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
          })
          return
        }
      }
    }

    // 同じdata-tutorial属性を持つ要素が複数ある場合（モバイル/デスクトップ）、
    // 可視状態の要素を選択する
    const elements = document.querySelectorAll(currentStep.target)
    let visibleElement: Element | null = null

    for (const el of elements) {
      const rect = el.getBoundingClientRect()
      // 要素が画面内に表示されているかチェック（幅と高さが0より大きい）
      if (rect.width > 0 && rect.height > 0) {
        visibleElement = el
        break
      }
    }

    if (visibleElement) {
      const rect = visibleElement.getBoundingClientRect()
      const padding = 8
      // チュートリアル中はスクロールがロックされているため、
      // getBoundingClientRect()の値をそのまま使用
      setHighlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      })
    } else {
      setHighlightRect(null)
    }
  }, [currentStep?.target, currentStep?.waitForAction])

  useEffect(() => {
    if (isActive && currentStep) {
      // 少し遅延させて要素が表示されてから計算
      const timer1 = setTimeout(() => {
        updateHighlightRect()
      }, 100)

      // 2回目のチェック（カード展開などのDOM更新を待つ）
      const timer2 = setTimeout(() => {
        updateHighlightRect()
      }, 300)

      // リサイズに対応（スクロールはロックされているため不要）
      window.addEventListener('resize', updateHighlightRect)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        window.removeEventListener('resize', updateHighlightRect)
      }
    }
  }, [isActive, currentStep, updateHighlightRect])

  // MutationObserverで動的な要素の変更を監視（デバウンス付き）
  useEffect(() => {
    if (!isActive || !currentStep?.target) return

    let debounceTimer: NodeJS.Timeout | null = null

    const observer = new MutationObserver(() => {
      // デバウンスして頻繁な更新を防ぐ
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        updateHighlightRect()
      }, 50)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    })

    return () => {
      observer.disconnect()
      if (debounceTimer) clearTimeout(debounceTimer)
    }
  }, [isActive, currentStep?.target, updateHighlightRect])

  if (!mounted || !isActive || !currentStep) return null

  // ナビゲーション待ちまたはアクション待ちの場合はクリックを通す
  const isWaitingForInteraction = !!currentStep.waitForNavigation || !!currentStep.waitForAction

  return createPortal(
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }}>
      {/* オーバーレイ背景（SVGでくり抜き） */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: isWaitingForInteraction ? 'none' : 'auto' }}
      >
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left}
                y={highlightRect.top}
                width={highlightRect.width}
                height={highlightRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* ハイライトの光彩エフェクト */}
      {highlightRect && (
        <div
          className="absolute rounded-lg"
          style={{
            pointerEvents: 'none',
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* ツールチップ */}
      <TutorialTooltip highlightRect={highlightRect} />

      {/* パルスアニメーション用のスタイル */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </div>,
    document.body
  )
}
