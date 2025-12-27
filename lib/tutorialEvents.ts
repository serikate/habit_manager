export type TutorialEventType =
  | 'vision-created'
  | 'ltg-created'
  | 'stg-created'
  | 'habit-created'

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
