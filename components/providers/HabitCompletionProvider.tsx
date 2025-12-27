'use client'

import { useHabitCompletionStore } from '@/stores/habitCompletionStore'
import { HabitCompletionPopup } from '@/components/habits/HabitCompletionPopup'

export function HabitCompletionProvider({ children }: { children: React.ReactNode }) {
  const { completedHabit, xpInfo, isVisible, hideCompletion } = useHabitCompletionStore()

  return (
    <>
      {children}
      {isVisible && completedHabit && (
        <HabitCompletionPopup
          habitName={completedHabit.name}
          xpInfo={xpInfo || undefined}
          onComplete={hideCompletion}
        />
      )}
    </>
  )
}
