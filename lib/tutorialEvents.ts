export type TutorialEventType =
  | 'vision-created'
  | 'ltg-created'
  | 'stg-created'
  | 'habit-created'
  | 'open-sidebar'
  | 'close-sidebar'

type TutorialEventListener = (eventType: TutorialEventType) => void

class TutorialEventEmitter {
  private listeners: TutorialEventListener[] = []

  subscribe(listener: TutorialEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  emit(eventType: TutorialEventType): void {
    this.listeners.forEach(listener => listener(eventType))
  }
}

export const tutorialEvents = new TutorialEventEmitter()

// サイドバーターゲットかどうかを判定
export function isSidebarTarget(target: string | null): boolean {
  if (!target) return false
  return target.includes('sidebar-')
}

// モバイル画面かどうかを判定
export function isMobileScreen(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024 // lg breakpoint
}
