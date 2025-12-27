import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TUTORIAL_STEPS, type TutorialStep } from '@/components/tutorial/tutorialSteps'

// AnimationVersion type (duplicated to avoid circular dependency)
type AnimationVersion = 'fireworks' | 'aurora' | 'geometric' | 'cyber' | 'code' | 'sakura' | 'ocean' | 'galaxy' | 'stylish' | 'naruto' | 'mystic' | 'retro' | 'fantasy' | 'lightning' | 'slash' | 'phoenix' | 'royal' | 'shockwave' | 'royalPlus' | 'slashPlus' | 'shockwavePlus'

interface TutorialState {
  // 状態
  isActive: boolean
  currentStepIndex: number
  isCompleted: boolean
  wasSkipped: boolean
  selectedAnimation: AnimationVersion

  // アクション
  startTutorial: () => void
  setSelectedAnimation: (animation: AnimationVersion) => void
  startFromStep: (stepIndex: number) => void
  nextStep: () => void
  skipStep: () => void
  skipAll: () => void
  completeTutorial: () => void
  resetTutorial: () => void
  goToStep: (stepId: string) => void
  handleAction: (actionId: string) => void
  handleNavigation: (path: string) => void

  // ゲッター
  getCurrentStep: () => TutorialStep | null
  getTotalSteps: () => number
  getProgress: () => number
  getAllSteps: () => TutorialStep[]
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      // 初期状態
      isActive: false,
      currentStepIndex: 0,
      isCompleted: false,
      wasSkipped: false,
      selectedAnimation: 'fireworks',

      // アクション
      setSelectedAnimation: (animation: AnimationVersion) => {
        set({ selectedAnimation: animation })
      },

      startTutorial: () => {
        set({
          isActive: true,
          currentStepIndex: 0,
          isCompleted: false,
          wasSkipped: false
        })
      },

      startFromStep: (stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < TUTORIAL_STEPS.length) {
          set({
            isActive: true,
            currentStepIndex: stepIndex,
            isCompleted: false,
            wasSkipped: false
          })
        }
      },

      nextStep: () => {
        const { currentStepIndex } = get()
        const nextIndex = currentStepIndex + 1

        if (nextIndex >= TUTORIAL_STEPS.length) {
          get().completeTutorial()
        } else {
          set({ currentStepIndex: nextIndex })
        }
      },

      skipStep: () => {
        get().nextStep()
      },

      skipAll: () => {
        set({
          isActive: false,
          wasSkipped: true,
          isCompleted: true
        })
      },

      completeTutorial: () => {
        set({
          isActive: false,
          isCompleted: true
        })
      },

      resetTutorial: () => {
        set({
          isActive: false,
          currentStepIndex: 0,
          isCompleted: false,
          wasSkipped: false
        })
      },

      goToStep: (stepId: string) => {
        const index = TUTORIAL_STEPS.findIndex(s => s.id === stepId)
        if (index !== -1) {
          set({ currentStepIndex: index })
        }
      },

      handleAction: (actionId: string) => {
        const currentStep = get().getCurrentStep()
        if (currentStep?.waitForAction === actionId) {
          // 少し遅延させて次のステップへ
          setTimeout(() => {
            get().nextStep()
          }, 500)
        }
      },

      handleNavigation: (path: string) => {
        const currentStep = get().getCurrentStep()
        if (currentStep?.waitForNavigation === path) {
          // ページ遷移後に次のステップへ
          setTimeout(() => {
            get().nextStep()
          }, 300)
        }
      },

      // ゲッター
      getCurrentStep: () => {
        const { currentStepIndex, isActive } = get()
        if (!isActive) return null
        return TUTORIAL_STEPS[currentStepIndex] || null
      },

      getTotalSteps: () => {
        return TUTORIAL_STEPS.length
      },

      getProgress: () => {
        const { currentStepIndex } = get()
        return ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100
      },

      getAllSteps: () => {
        return TUTORIAL_STEPS
      }
    }),
    {
      name: 'tutorial-storage',
      partialize: (state) => ({
        currentStepIndex: state.currentStepIndex,
        isCompleted: state.isCompleted,
        wasSkipped: state.wasSkipped,
        isActive: state.isActive,
        selectedAnimation: state.selectedAnimation
      })
    }
  )
)
