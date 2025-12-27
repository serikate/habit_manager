export interface TutorialStep {
  id: string
  page: string
  target: string | null
  title: string
  content: string
  position: 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center'
  waitForNavigation?: string
  waitForAction?: string
  showConfetti?: boolean
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // === Phase 1: サイドバー説明（ダッシュボード） ===
  {
    id: 'welcome',
    page: '/dashboard',
    target: null,
    title: 'アプリへようこそ！',
    content: 'このアプリは「1年後のビジョン」を達成するための習慣管理アプリです。使い方を説明します。',
    position: 'center'
  },
  {
    id: 'sidebar-dashboard',
    page: '/dashboard',
    target: '[data-tutorial="sidebar-dashboard"]',
    title: 'ダッシュボード',
    content: '毎日のタスク確認と進捗チェックはここで行います。',
    position: 'right'
  },
  {
    id: 'sidebar-goals',
    page: '/dashboard',
    target: '[data-tutorial="sidebar-goals"]',
    title: '目標管理',
    content: 'ビジョン・長期目標・短期目標を設定します。',
    position: 'right'
  },
  {
    id: 'sidebar-habits',
    page: '/dashboard',
    target: '[data-tutorial="sidebar-habits"]',
    title: '習慣管理',
    content: '毎日実行する習慣を登録・編集します。',
    position: 'right'
  },
  {
    id: 'sidebar-tasks',
    page: '/dashboard',
    target: '[data-tutorial="sidebar-tasks"]',
    title: 'タスク管理',
    content: '単発のタスクを管理します。',
    position: 'right'
  },
  {
    id: 'sidebar-stats',
    page: '/dashboard',
    target: '[data-tutorial="sidebar-stats"]',
    title: '統計',
    content: '達成率や継続日数などの統計を確認できます。',
    position: 'right'
  },
  {
    id: 'go-to-goals',
    page: '/dashboard',
    target: '[data-tutorial="sidebar-goals"]',
    title: '目標管理へ移動',
    content: 'では、まず1年後のビジョンを設定しましょう！クリックして移動してください。',
    position: 'right',
    waitForNavigation: '/goals'
  },

  // === Phase 2: 目標管理ページ ===
  {
    id: 'vision-section',
    page: '/goals',
    target: '[data-tutorial="vision-section"]',
    title: '1年後ビジョン',
    content: 'まず、1年後になりたい自分の姿を設定します。これがすべての目標の出発点です。',
    position: 'bottom'
  },
  {
    id: 'add-vision',
    page: '/goals',
    target: '[data-tutorial="add-vision-button"]',
    title: 'ビジョンを追加',
    content: 'このボタンをクリックしてビジョンを作成しましょう！',
    position: 'bottom',
    waitForAction: 'vision-created'
  },
  {
    id: 'vision-created',
    page: '/goals',
    target: null,
    title: 'ビジョン作成完了！',
    content: '素晴らしい！次は6ヶ月の長期目標を設定しましょう。',
    position: 'center'
  },
  {
    id: 'add-long-term-goal',
    page: '/goals',
    target: '[data-tutorial="add-ltg-button"]',
    title: '長期目標を追加',
    content: 'ビジョン達成のため、6ヶ月で達成する中間目標を設定します。',
    position: 'bottom',
    waitForAction: 'ltg-created'
  },
  {
    id: 'ltg-created',
    page: '/goals',
    target: null,
    title: '長期目標作成完了！',
    content: '順調です！次は今月の短期目標を設定しましょう。',
    position: 'center'
  },
  {
    id: 'add-short-term-goal',
    page: '/goals',
    target: '[data-tutorial="add-stg-button"]',
    title: '短期目標を追加',
    content: '長期目標を月単位に分解した、測定可能な目標を設定します。',
    position: 'bottom',
    waitForAction: 'stg-created'
  },
  {
    id: 'stg-created',
    page: '/goals',
    target: null,
    title: '短期目標作成完了！',
    content: '最後に、毎日実行する習慣を設定しましょう！',
    position: 'center'
  },
  {
    id: 'go-to-habits',
    page: '/goals',
    target: '[data-tutorial="sidebar-habits"]',
    title: '習慣管理へ移動',
    content: '習慣管理ページへ移動してください。',
    position: 'right',
    waitForNavigation: '/habits'
  },

  // === Phase 3: 習慣管理ページ ===
  {
    id: 'habits-section',
    page: '/habits',
    target: '[data-tutorial="habits-section"]',
    title: '習慣管理',
    content: 'ここで毎日実行する習慣を登録します。習慣は短期目標に紐づけることで、目標達成に貢献します。',
    position: 'bottom'
  },
  {
    id: 'add-habit',
    page: '/habits',
    target: '[data-tutorial="add-habit-button"]',
    title: '習慣を追加',
    content: '先ほど作成した短期目標に紐づく習慣を作成しましょう！',
    position: 'bottom',
    waitForAction: 'habit-created'
  },

  // === Phase 4: 完了 ===
  {
    id: 'complete',
    page: '/habits',
    target: null,
    title: '🎉 チュートリアル完了！',
    content: 'おめでとうございます！これで準備完了です。ダッシュボードで毎日の習慣をチェックして、ビジョン達成を目指しましょう！',
    position: 'center',
    showConfetti: true
  }
]

export const TOTAL_STEPS = TUTORIAL_STEPS.length
