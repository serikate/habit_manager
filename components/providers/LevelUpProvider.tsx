'use client'

import { useLevelUpStore } from '@/stores/levelUpStore'
import { LevelUpAnimation } from '@/components/levelup/LevelUpAnimation'

export function LevelUpProvider({ children }: { children: React.ReactNode }) {
  const { pendingLevelUp, clearLevelUp, selectedAnimation } = useLevelUpStore()

  return (
    <>
      {children}

      {/* Level up animation triggered by habit completion */}
      {pendingLevelUp && (
        <LevelUpAnimation
          newLevel={pendingLevelUp.newLevel}
          version={selectedAnimation}
          onComplete={clearLevelUp}
        />
      )}
    </>
  )
}
