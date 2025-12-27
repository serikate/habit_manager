'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTutorialStore } from '@/stores/tutorialStore'
import { tutorialEvents } from '@/lib/tutorialEvents'
import { TutorialOverlay } from './TutorialOverlay'
import { TutorialConfetti } from './TutorialConfetti'

interface TutorialProviderProps {
  children: React.ReactNode
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isActive, handleNavigation, handleAction, getCurrentStep, selectedAnimation } = useTutorialStore()
  const currentStep = getCurrentStep()

  // ページ遷移の検知
  useEffect(() => {
    if (isActive) {
      handleNavigation(pathname)
    }
  }, [pathname, isActive, handleNavigation])

  // アクションイベントの購読
  useEffect(() => {
    const unsubscribe = tutorialEvents.subscribe((eventType) => {
      handleAction(eventType)
    })
    return unsubscribe
  }, [handleAction])

  // チュートリアル完了時にダッシュボードへ遷移
  useEffect(() => {
    if (currentStep?.id === 'complete' && currentStep?.showConfetti) {
      // 紙吹雪表示後、少し待ってからダッシュボードへ
      const timer = setTimeout(() => {
        // 何もしない - ユーザーがボタンをクリックするまで待つ
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, router])

  return (
    <>
      {children}
      <TutorialOverlay />
      {currentStep?.showConfetti && <TutorialConfetti version={selectedAnimation} />}
    </>
  )
}
