'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useThemeStore, UI_THEMES, type UITheme } from '@/stores/themeStore'
import { useUserProfileStore } from '@/stores/userProfileStore'
import { TutorialConfetti, type AnimationVersion } from '@/components/tutorial/TutorialConfetti'
import { LevelUpAnimation, type LevelUpAnimationVersion } from '@/components/levelup/LevelUpAnimation'
import { useLevelUpStore, LEVELUP_ANIMATIONS } from '@/stores/levelUpStore'
import { BookOpen, RefreshCw, Settings2, Play, ChevronDown, ChevronUp, Sparkles, Flame, Stars, Hexagon, Zap, Code2, Cherry, Waves, Moon, Minimize2, Wind, Eye, Radio, Wand2, CloudLightning, Sword, Bird, Crown, CircleDot, Check, Sun, Monitor, PanelLeft, Lock, Palette, ClipboardList, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { MinimalProgressiveAnimation } from '@/components/levelup/MinimalProgressiveAnimation'
import { MinimalProgressiveAnimationV2 } from '@/components/levelup/MinimalProgressiveAnimationV2'
import { LuxuryLevelUpAnimation } from '@/components/levelup/LuxuryLevelUpAnimation'
import { AuroraLevelUpAnimation } from '@/components/levelup/AuroraLevelUpAnimation'
import { useHabitReviewStore } from '@/stores/habitReviewStore'

const ANIMATION_VERSIONS: { id: AnimationVersion; name: string; description: string; icon: React.ReactNode; gradient: string }[] = [
  {
    id: 'fireworks',
    name: 'Fireworks',
    description: 'エレガントなゴールド花火',
    icon: <Flame className="w-5 h-5" />,
    gradient: 'from-amber-400 to-orange-500'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'コズミック・オーロラ',
    icon: <Stars className="w-5 h-5" />,
    gradient: 'from-emerald-400 to-cyan-500'
  },
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'モダン・ジオメトリック',
    icon: <Hexagon className="w-5 h-5" />,
    gradient: 'from-indigo-400 to-purple-500'
  },
  {
    id: 'cyber',
    name: 'Cyber',
    description: '未来的ネオン・サイバー',
    icon: <Zap className="w-5 h-5" />,
    gradient: 'from-cyan-400 to-fuchsia-500'
  },
  {
    id: 'code',
    name: 'Code',
    description: 'プログラミング・ターミナル',
    icon: <Code2 className="w-5 h-5" />,
    gradient: 'from-blue-400 to-violet-500'
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: '舞い散る桜の花びら',
    icon: <Cherry className="w-5 h-5" />,
    gradient: 'from-pink-300 to-rose-400'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: '深海のバブルと光',
    icon: <Waves className="w-5 h-5" />,
    gradient: 'from-sky-400 to-blue-600'
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: '銀河・星雲・流れ星',
    icon: <Moon className="w-5 h-5" />,
    gradient: 'from-violet-500 to-purple-700'
  },
  {
    id: 'stylish',
    name: 'Stylish',
    description: 'モノクロ・ミニマル',
    icon: <Minimize2 className="w-5 h-5" />,
    gradient: 'from-gray-600 to-gray-900'
  },
  {
    id: 'naruto',
    name: 'Naruto',
    description: '螺旋丸・手裏剣・忍術',
    icon: <Wind className="w-5 h-5" />,
    gradient: 'from-orange-500 to-blue-500'
  },
  {
    id: 'mystic',
    name: 'Mystic',
    description: '魔法陣・ルーン文字',
    icon: <Eye className="w-5 h-5" />,
    gradient: 'from-amber-500 to-yellow-600'
  },
  {
    id: 'retro',
    name: 'Retro',
    description: '80年代・ネオン・グリッド',
    icon: <Radio className="w-5 h-5" />,
    gradient: 'from-fuchsia-500 to-cyan-400'
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: '妖精・魔法の光・グリッター',
    icon: <Wand2 className="w-5 h-5" />,
    gradient: 'from-purple-400 to-pink-400'
  },
  {
    id: 'lightning',
    name: 'Lightning',
    description: '稲妻・雷鳴・電撃',
    icon: <CloudLightning className="w-5 h-5" />,
    gradient: 'from-sky-300 to-blue-600'
  },
  {
    id: 'slash',
    name: 'Slash',
    description: '斬撃・剣閃・火花',
    icon: <Sword className="w-5 h-5" />,
    gradient: 'from-slate-300 to-slate-600'
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    description: '不死鳥・炎・羽根',
    icon: <Bird className="w-5 h-5" />,
    gradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'royal',
    name: 'Royal',
    description: '王冠・紋章・ゴールド',
    icon: <Crown className="w-5 h-5" />,
    gradient: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'shockwave',
    name: 'Shockwave',
    description: '衝撃波・エネルギー波動',
    icon: <CircleDot className="w-5 h-5" />,
    gradient: 'from-cyan-400 to-blue-600'
  },
  {
    id: 'royalPlus',
    name: 'Royal+',
    description: '豪華絢爛な王者の祝福',
    icon: <Crown className="w-5 h-5" />,
    gradient: 'from-yellow-400 via-amber-500 to-purple-600'
  },
  {
    id: 'slashPlus',
    name: 'Slash+',
    description: '連撃コンボ・残像・衝撃',
    icon: <Sword className="w-5 h-5" />,
    gradient: 'from-slate-200 via-orange-400 to-red-600'
  },
  {
    id: 'shockwavePlus',
    name: 'Shockwave+',
    description: 'チャージ爆発・多重波動',
    icon: <CircleDot className="w-5 h-5" />,
    gradient: 'from-cyan-400 via-purple-500 to-pink-500'
  }
]

export default function SettingsPage() {
  const router = useRouter()
  const {
    isCompleted,
    wasSkipped,
    resetTutorial,
    startTutorial,
    startFromStep,
    getAllSteps,
    selectedAnimation,
    setSelectedAnimation
  } = useTutorialStore()

  const { theme, sidebarTheme, resolvedTheme, setTheme, setSidebarTheme, uiTheme, setUITheme, isThemeUnlocked, unlockTheme } = useThemeStore()
  const { getLevelInfo } = useUserProfileStore()
  const { settings: reviewSettings, updateSettings: updateReviewSettings } = useHabitReviewStore()
  const {
    selectedAnimation: selectedLevelUpAnimation,
    setSelectedAnimation: setSelectedLevelUpAnimation
  } = useLevelUpStore()
  const levelInfo = getLevelInfo()
  const isDark = resolvedTheme === 'dark'

  const [showAdminMode, setShowAdminMode] = useState(false)
  const [showThemeAdminMode, setShowThemeAdminMode] = useState(false)
  const [showAnimationPreview, setShowAnimationPreview] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<AnimationVersion>('fireworks')
  const [showLevelUpPreview, setShowLevelUpPreview] = useState(false)
  const [levelUpPreviewVersion, setLevelUpPreviewVersion] = useState<LevelUpAnimationVersion>('gold')
  const [progressivePreviewLevel, setProgressivePreviewLevel] = useState(5)
  const [showProgressivePreview, setShowProgressivePreview] = useState(false)
  const allSteps = getAllSteps()

  const handleRestartTutorial = () => {
    resetTutorial()
    startTutorial()
    router.push('/dashboard')
  }

  const handleStartFromStep = (stepIndex: number) => {
    const step = allSteps[stepIndex]
    if (step) {
      startFromStep(stepIndex)
      router.push(step.page)
    }
  }

  const handleSelectAnimation = (version: AnimationVersion) => {
    setSelectedAnimation(version)
  }

  const handlePreviewAnimation = (version: AnimationVersion, e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewVersion(version)
    setShowAnimationPreview(true)
  }

  const handleSelectLevelUpAnimation = (version: LevelUpAnimationVersion) => {
    setSelectedLevelUpAnimation(version)
  }

  const handlePreviewLevelUpAnimation = (version: LevelUpAnimationVersion, e: React.MouseEvent) => {
    e.stopPropagation()
    if (version === 'minimal-progressive' || version === 'progressive-v2' || version === 'luxury' || version === 'aurora-progressive') {
      // Progressive / Luxury / Aurora の場合は専用プレビューを使用
      setShowProgressivePreview(true)
    } else {
      setLevelUpPreviewVersion(version)
      setShowLevelUpPreview(true)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-surface-900'}`}>設定</h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
            アプリの設定をカスタマイズできます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* テーマ設定 */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
              <Sun className="w-5 h-5 text-accent-500" />
              外観テーマ
            </h2>
            <div className="space-y-6">
              {/* メインテーマ */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                  カラーモード
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'ライト', icon: Sun },
                    { value: 'dark', label: 'ダーク', icon: Moon },
                    { value: 'system', label: 'システム', icon: Monitor }
                  ].map((option) => {
                    const Icon = option.icon
                    const isSelected = theme === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10'
                            : isDark
                              ? 'border-surface-600 hover:border-surface-500 bg-surface-700/50'
                              : 'border-surface-200 hover:border-surface-300 bg-surface-50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-500' : isDark ? 'text-surface-400' : 'text-surface-500'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-primary-500' : isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* サイドバーテーマ */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                  サイドバーの外観
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'dark', label: 'ダーク', description: '落ち着いた印象' },
                    { value: 'light', label: 'ライト', description: '明るく軽やかに' }
                  ].map((option) => {
                    const isSelected = sidebarTheme === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSidebarTheme(option.value as 'light' | 'dark')}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10'
                            : isDark
                              ? 'border-surface-600 hover:border-surface-500 bg-surface-700/50'
                              : 'border-surface-200 hover:border-surface-300 bg-surface-50'
                        }`}
                      >
                        <PanelLeft className={`w-5 h-5 ${isSelected ? 'text-primary-500' : isDark ? 'text-surface-400' : 'text-surface-500'}`} />
                        <div className="text-left">
                          <span className={`block text-sm font-medium ${isSelected ? 'text-primary-500' : isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                            {option.label}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                            {option.description}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* UIテーマ設定 */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
              <Palette className="w-5 h-5 text-primary-500" />
              UIテーマ
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              レベルアップで新しいテーマが解放されます（現在 Lv.{levelInfo.level}）
            </p>
            <div className="grid grid-cols-2 gap-3">
              {UI_THEMES.map((themeOption) => {
                const isUnlocked = isThemeUnlocked(themeOption.id) || showThemeAdminMode
                const isSelected = uiTheme === themeOption.id
                const canSelect = isUnlocked

                return (
                  <button
                    key={themeOption.id}
                    onClick={() => canSelect && setUITheme(themeOption.id)}
                    disabled={!canSelect}
                    className={`relative overflow-hidden rounded-xl p-4 transition-all duration-200 ${
                      !canSelect
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02] active:scale-[0.98]'
                    } ${
                      isSelected
                        ? 'ring-2 ring-primary-500 ring-offset-2 ' + (isDark ? 'ring-offset-surface-800' : 'ring-offset-white')
                        : ''
                    }`}
                  >
                    {/* グラデーション背景 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${themeOption.gradient} opacity-20`} />

                    {/* ロックアイコン */}
                    {!isThemeUnlocked(themeOption.id) && !showThemeAdminMode && (
                      <div className="absolute top-2 right-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-surface-700' : 'bg-surface-200'
                        }`}>
                          <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`} />
                        </div>
                      </div>
                    )}

                    {/* 管理者モードでのテスト表示バッジ */}
                    {!isThemeUnlocked(themeOption.id) && showThemeAdminMode && (
                      <div className="absolute top-2 right-2">
                        <div className="px-1.5 py-0.5 rounded bg-warning-500 text-white text-[10px] font-bold">
                          TEST
                        </div>
                      </div>
                    )}

                    {/* 選択済みチェック */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      {/* カラープレビュー */}
                      <div className="flex gap-1.5 mb-3">
                        <div
                          className="w-6 h-6 rounded-full shadow-sm"
                          style={{ backgroundColor: themeOption.previewColors.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded-full shadow-sm"
                          style={{ backgroundColor: themeOption.previewColors.secondary }}
                        />
                        <div
                          className="w-6 h-6 rounded-full shadow-sm"
                          style={{ backgroundColor: themeOption.previewColors.accent }}
                        />
                      </div>

                      {/* テーマ名と説明 */}
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-surface-900'}`}>
                        {themeOption.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                        {themeOption.description}
                      </div>

                      {/* 解放条件 */}
                      {!isThemeUnlocked(themeOption.id) && !showThemeAdminMode && (
                        <div className={`mt-2 text-xs font-medium ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                          Lv.{themeOption.unlockLevel}で解放
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 管理者モード（テスト用） */}
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
              <button
                onClick={() => setShowThemeAdminMode(!showThemeAdminMode)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-colors ${
                  isDark ? 'text-surface-400 hover:bg-surface-700' : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                <span className="flex items-center gap-2 text-sm">
                  <Settings2 className="w-4 h-4" />
                  管理者モード（テスト用）
                </span>
                {showThemeAdminMode ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showThemeAdminMode && (
                <div className={`mt-3 p-3 rounded-xl ${isDark ? 'bg-surface-700' : 'bg-surface-50'}`}>
                  <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                    ロックを無視して全テーマをプレビューできます
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {UI_THEMES.filter(t => !isThemeUnlocked(t.id)).map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => {
                          unlockTheme(themeOption.id)
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isDark
                            ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                            : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {themeOption.name}を解放
                      </button>
                    ))}
                    {UI_THEMES.every(t => isThemeUnlocked(t.id)) && (
                      <p className={`text-sm ${isDark ? 'text-success-400' : 'text-success-600'}`}>
                        ✓ 全テーマ解放済み
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* チュートリアル設定 */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
              <BookOpen className="w-5 h-5 text-primary-500" />
              チュートリアル
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>ステータス</span>
                  <p className={`text-xs mt-1 ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                    {isCompleted
                      ? wasSkipped
                        ? 'スキップ済み'
                        : '完了済み'
                      : '未完了'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isCompleted
                      ? isDark ? 'bg-success-500/20 text-success-400' : 'bg-success-100 text-success-700'
                      : isDark ? 'bg-warning-500/20 text-warning-400' : 'bg-warning-100 text-warning-700'
                  }`}
                >
                  {isCompleted ? '完了' : '進行中'}
                </span>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                <button
                  onClick={handleRestartTutorial}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  チュートリアルを再実行
                </button>
                <p className={`text-xs mt-2 text-center ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                  アプリの使い方を最初から確認できます
                </p>
              </div>

              {/* 管理者モード */}
              <div className={`pt-4 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                <button
                  onClick={() => setShowAdminMode(!showAdminMode)}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-colors ${
                    isDark ? 'text-surface-400 hover:bg-surface-700' : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Settings2 className="w-4 h-4" />
                    管理者モード（テスト用）
                  </span>
                  {showAdminMode ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showAdminMode && (
                  <div className={`mt-3 p-3 rounded-xl ${isDark ? 'bg-surface-700' : 'bg-surface-50'}`}>
                    <p className={`text-xs mb-3 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                      任意のステップからチュートリアルを開始できます
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {allSteps.map((step, index) => (
                        <button
                          key={step.id}
                          onClick={() => handleStartFromStep(index)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors group ${
                            isDark ? 'hover:bg-surface-600' : 'hover:bg-white'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs font-medium ${
                            isDark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isDark ? 'text-surface-200' : 'text-surface-900'}`}>
                              {step.title}
                            </div>
                            <div className={`text-xs truncate ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                              {step.page} {step.waitForAction && `• ${step.waitForAction}`}
                            </div>
                          </div>
                          <Play className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-surface-400' : 'text-surface-400'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* アニメーション設定 */}
          <div className={`rounded-2xl p-6 lg:row-span-2 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
              <Sparkles className="w-5 h-5 text-accent-500" />
              完了アニメーション
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              チュートリアル完了時のアニメーションを選択できます。▶をクリックでプレビュー
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ANIMATION_VERSIONS.map((version) => {
                const isSelected = selectedAnimation === version.id
                return (
                <button
                  key={version.id}
                  onClick={() => handleSelectAnimation(version.id)}
                  className="group"
                >
                  <div className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-r ${version.gradient} text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${isSelected ? `ring-4 ring-white ring-offset-2 ${isDark ? 'ring-offset-surface-800' : 'ring-offset-white'}` : ''}`}>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-success-600" />
                      </div>
                    )}

                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                    </div>

                    <div className="relative flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        {version.icon}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm">{version.name}</div>
                        <div className="text-xs text-white/80 truncate">{version.description}</div>
                      </div>
                      <div
                        onClick={(e) => handlePreviewAnimation(version.id, e)}
                        className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/40 transition-colors flex-shrink-0"
                      >
                        <Play className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              )
              })}
            </div>

            <p className={`text-xs mt-4 text-center ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
              カードをクリックで選択、▶でプレビュー
            </p>
          </div>

          {/* レベルアップアニメーション設定 */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
              <TrendingUp className="w-5 h-5 text-amber-500" />
              レベルアップアニメーション
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              レベルアップ時のアニメーションを選択できます。▶をクリックでプレビュー
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LEVELUP_ANIMATIONS.map((animation) => {
                const isSelected = selectedLevelUpAnimation === animation.id
                return (
                  <button
                    key={animation.id}
                    onClick={() => handleSelectLevelUpAnimation(animation.id)}
                    className="group"
                  >
                    <div className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-r ${animation.gradient} text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${isSelected ? `ring-4 ring-white ring-offset-2 ${isDark ? 'ring-offset-surface-800' : 'ring-offset-white'}` : ''}`}>
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-success-600" />
                        </div>
                      )}

                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                      </div>

                      <div className="relative flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm text-xl">
                          {animation.icon}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-semibold text-sm">{animation.name}</div>
                          <div className="text-xs text-white/80 truncate">{animation.description}</div>
                        </div>
                        <div
                          onClick={(e) => handlePreviewLevelUpAnimation(animation.id, e)}
                          className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/40 transition-colors flex-shrink-0"
                        >
                          <Play className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <p className={`text-xs mt-4 text-center ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
              カードをクリックで選択、▶でプレビュー
            </p>

            {/* Progressive / Luxury / Aurora アニメーションのレベル別プレビュー */}
            {(selectedLevelUpAnimation === 'minimal-progressive' || selectedLevelUpAnimation === 'progressive-v2' || selectedLevelUpAnimation === 'luxury' || selectedLevelUpAnimation === 'aurora-progressive') && (
              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-surface-200' : 'text-surface-800'}`}>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  レベル別プレビュー
                </h3>
                <p className={`text-xs mb-4 ${isDark ? 'text-surface-400' : 'text-surface-500'}`}>
                  {selectedLevelUpAnimation === 'aurora-progressive'
                    ? 'Aurora+は神秘的なオーロラ演出。Dawn→Transcendenceへ、流れ星や光の柱と共に進化'
                    : selectedLevelUpAnimation === 'luxury'
                      ? 'Luxuryは洗練された大人向けの高貴な演出。プラチナ→シャンパン→ローズゴールド→インペリアルゴールドへ進化'
                      : selectedLevelUpAnimation === 'progressive-v2'
                        ? 'Progressive+は高品質なエフェクト（画面シェイク、レンズフレア、マイルストーン演出等）を搭載'
                        : 'Progressiveアニメーションは到達レベルに応じて演出が豪華になります'}
                </p>

                {/* レベルスライダー */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setProgressivePreviewLevel(prev => Math.max(1, prev - 1))}
                    disabled={progressivePreviewLevel <= 1}
                    className={`p-2 rounded-lg transition-colors ${
                      progressivePreviewLevel <= 1
                        ? 'opacity-30 cursor-not-allowed'
                        : isDark
                          ? 'bg-surface-700 hover:bg-surface-600 text-white'
                          : 'bg-surface-100 hover:bg-surface-200 text-surface-900'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 text-center">
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                      Lv.{progressivePreviewLevel}
                    </span>
                  </div>

                  <button
                    onClick={() => setProgressivePreviewLevel(prev => Math.min(10, prev + 1))}
                    disabled={progressivePreviewLevel >= 10}
                    className={`p-2 rounded-lg transition-colors ${
                      progressivePreviewLevel >= 10
                        ? 'opacity-30 cursor-not-allowed'
                        : isDark
                          ? 'bg-surface-700 hover:bg-surface-600 text-white'
                          : 'bg-surface-100 hover:bg-surface-200 text-surface-900'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* レベル数字ボタン */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      onClick={() => setProgressivePreviewLevel(level)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        progressivePreviewLevel === level
                          ? 'bg-primary-500 text-white shadow-md'
                          : isDark
                            ? 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                            : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                {/* レベル説明 */}
                <div className={`text-xs mb-4 p-3 rounded-lg ${isDark ? 'bg-surface-700' : 'bg-surface-50'}`}>
                  {selectedLevelUpAnimation === 'aurora-progressive' ? (
                    // Aurora の説明
                    <>
                      {progressivePreviewLevel === 1 && <span className="text-teal-400">Dawn — 静かな始まり</span>}
                      {progressivePreviewLevel === 2 && <span className="text-teal-300">Awakening — 目覚めの光</span>}
                      {progressivePreviewLevel === 3 && <span className="text-cyan-300">Rising — 成長の兆し</span>}
                      {progressivePreviewLevel === 4 && <span className="text-cyan-400">Ascending — 光柱の出現</span>}
                      {progressivePreviewLevel === 5 && <span className="text-purple-300 font-medium">✦ Breakthrough — New Horizon</span>}
                      {progressivePreviewLevel === 6 && <span className="text-purple-400">Radiance — 躍動する光</span>}
                      {progressivePreviewLevel === 7 && <span className="text-fuchsia-400">Brilliance — 輝きの極み</span>}
                      {progressivePreviewLevel === 8 && <span className="text-pink-400">Celestial — 天空の舞</span>}
                      {progressivePreviewLevel === 9 && <span className="text-pink-300">Ethereal — 昇華</span>}
                      {progressivePreviewLevel === 10 && <span className="text-white font-medium">✦ Transcendence — Beyond Limits</span>}
                    </>
                  ) : selectedLevelUpAnimation === 'luxury' ? (
                    // Luxury の説明
                    <>
                      {progressivePreviewLevel === 1 && <span className="text-gray-400">Platinum — 静謐なミニマリズム</span>}
                      {progressivePreviewLevel === 2 && <span className="text-gray-300">Platinum — オーブの目覚め</span>}
                      {progressivePreviewLevel === 3 && <span className="text-amber-200">Champagne — 温かな輝き</span>}
                      {progressivePreviewLevel === 4 && <span className="text-amber-300">Champagne — 光線の出現</span>}
                      {progressivePreviewLevel === 5 && <span className="text-rose-300 font-medium">◆ Rose Gold — Achievement</span>}
                      {progressivePreviewLevel === 6 && <span className="text-amber-400">Royal Navy & Gold — 威厳</span>}
                      {progressivePreviewLevel === 7 && <span className="text-amber-400">Royal — シマーリング</span>}
                      {progressivePreviewLevel === 8 && <span className="text-yellow-400">Pure Gold — ラグジュアリー</span>}
                      {progressivePreviewLevel === 9 && <span className="text-yellow-300">Imperial — 煌めき</span>}
                      {progressivePreviewLevel === 10 && <span className="text-yellow-200 font-medium">◆ Imperial Gold — Mastery</span>}
                    </>
                  ) : selectedLevelUpAnimation === 'progressive-v2' ? (
                    // Progressive+ の説明
                    <>
                      {progressivePreviewLevel === 1 && <span>ミニマル・クリーンフェード</span>}
                      {progressivePreviewLevel === 2 && <span>サークル + 軽量パーティクル</span>}
                      {progressivePreviewLevel === 3 && <span>スパークル + トレイル効果</span>}
                      {progressivePreviewLevel === 4 && <span>複数バースト + グロー開始</span>}
                      {progressivePreviewLevel === 5 && <span className="text-blue-400 font-medium">★ マイルストーン：ブルーグロー + 画面シェイク + ビネット</span>}
                      {progressivePreviewLevel === 6 && <span>グリッター + パルスグロー</span>}
                      {progressivePreviewLevel === 7 && <span>文字別アニメーション + 星エフェクト</span>}
                      {progressivePreviewLevel === 8 && <span>レンズフレア + ブルーム効果</span>}
                      {progressivePreviewLevel === 9 && <span>フルエフェクト + テキストシェイク</span>}
                      {progressivePreviewLevel === 10 && <span className="text-amber-400 font-medium">★ 究極マイルストーン：ゴールド演出 + 全エフェクト解放</span>}
                    </>
                  ) : (
                    // Progressive の説明
                    <>
                      {progressivePreviewLevel === 1 && <span>シンプルなテキストフェード</span>}
                      {progressivePreviewLevel === 2 && <span>サークル + テキスト（基本）</span>}
                      {progressivePreviewLevel === 3 && <span>微かなパーティクル追加</span>}
                      {progressivePreviewLevel === 4 && <span>複数サークル</span>}
                      {progressivePreviewLevel === 5 && <span>ソフトグロー効果</span>}
                      {progressivePreviewLevel === 6 && <span>パーティクル増加 + 色味</span>}
                      {progressivePreviewLevel === 7 && <span>シマーエフェクト</span>}
                      {progressivePreviewLevel === 8 && <span>複数グローレイヤー + 星</span>}
                      {progressivePreviewLevel === 9 && <span>バースト効果</span>}
                      {progressivePreviewLevel === 10 && <span>フル演出（ゴールドアクセント）</span>}
                    </>
                  )}
                </div>

                {/* プレビューボタン */}
                <button
                  onClick={() => setShowProgressivePreview(true)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors bg-gradient-to-r from-gray-500 via-blue-500 to-amber-500 text-white hover:opacity-90`}
                >
                  <Play className="w-4 h-4" />
                  Lv.{progressivePreviewLevel} のアニメーションをプレビュー
                </button>
              </div>
            )}
          </div>

          {/* 週間レビュー設定 */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900'}`}>
              <ClipboardList className="w-5 h-5 text-purple-500" />
              週間レビュー
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-surface-400' : 'text-surface-600'}`}>
              指定日時以降にアプリを開くとレビュー通知が表示されます
            </p>

            <div className="space-y-4">
              {/* 通知ON/OFF */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                  通知
                </span>
                <button
                  onClick={() => updateReviewSettings({ enabled: !reviewSettings.enabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    reviewSettings.enabled
                      ? 'bg-purple-500'
                      : isDark ? 'bg-surface-600' : 'bg-surface-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      reviewSettings.enabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* 曜日選択 */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                  曜日
                </span>
                <select
                  value={reviewSettings.dayOfWeek}
                  onChange={(e) => updateReviewSettings({ dayOfWeek: Number(e.target.value) })}
                  disabled={!reviewSettings.enabled}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    isDark
                      ? 'bg-surface-700 text-white border-surface-600'
                      : 'bg-white text-surface-900 border-surface-300'
                  } border disabled:opacity-50`}
                >
                  <option value={0}>日曜日</option>
                  <option value={1}>月曜日</option>
                  <option value={2}>火曜日</option>
                  <option value={3}>水曜日</option>
                  <option value={4}>木曜日</option>
                  <option value={5}>金曜日</option>
                  <option value={6}>土曜日</option>
                </select>
              </div>

              {/* 時間選択 */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
                  時間
                </span>
                <select
                  value={reviewSettings.hour}
                  onChange={(e) => updateReviewSettings({ hour: Number(e.target.value) })}
                  disabled={!reviewSettings.enabled}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    isDark
                      ? 'bg-surface-700 text-white border-surface-600'
                      : 'bg-white text-surface-900 border-surface-300'
                  } border disabled:opacity-50`}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}>作業時間上限設定</h2>
            <div className={`border-4 border-dashed rounded-xl h-32 flex items-center justify-center ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
              <div className={`text-center ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                <p className="text-lg mb-2">⏰</p>
                <p className="text-sm">曜日別時間上限設定を実装予定</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}>通知設定</h2>
            <div className={`border-4 border-dashed rounded-xl h-32 flex items-center justify-center ${isDark ? 'border-surface-700' : 'border-surface-200'}`}>
              <div className={`text-center ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                <p className="text-lg mb-2">🔔</p>
                <p className="text-sm">Web Push通知設定を実装予定</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${isDark ? 'bg-surface-800 border border-surface-700' : 'bg-white border border-surface-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}>称号モード</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>表示モード</span>
                <select className={`px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors ${
                  isDark
                    ? 'bg-surface-700 border-surface-600 text-white'
                    : 'bg-white border-surface-300 text-surface-900'
                }`}>
                  <option value="business">ビジネスモード</option>
                  <option value="light">ライトモード</option>
                </select>
              </div>
              <p className={`text-xs ${isDark ? 'text-surface-500' : 'text-surface-500'}`}>
                ビジネスモード: シンプルで成長志向の称号<br />
                ライトモード: 遊び心のある日本語の称号
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* アニメーションプレビュー */}
      {showAnimationPreview && (
        <TutorialConfetti
          standalone
          version={previewVersion}
          onComplete={() => setShowAnimationPreview(false)}
        />
      )}

      {/* レベルアップアニメーションプレビュー */}
      {showLevelUpPreview && (
        <LevelUpAnimation
          newLevel={levelInfo.level + 1}
          version={levelUpPreviewVersion}
          standalone
          onComplete={() => setShowLevelUpPreview(false)}
        />
      )}

      {/* Progressive アニメーションプレビュー */}
      {showProgressivePreview && selectedLevelUpAnimation === 'minimal-progressive' && (
        <MinimalProgressiveAnimation
          newLevel={progressivePreviewLevel}
          standalone
          onComplete={() => setShowProgressivePreview(false)}
        />
      )}

      {/* Progressive+ アニメーションプレビュー */}
      {showProgressivePreview && selectedLevelUpAnimation === 'progressive-v2' && (
        <MinimalProgressiveAnimationV2
          newLevel={progressivePreviewLevel}
          standalone
          onComplete={() => setShowProgressivePreview(false)}
        />
      )}

      {/* Luxury アニメーションプレビュー */}
      {showProgressivePreview && selectedLevelUpAnimation === 'luxury' && (
        <LuxuryLevelUpAnimation
          newLevel={progressivePreviewLevel}
          standalone
          onComplete={() => setShowProgressivePreview(false)}
        />
      )}

      {/* Aurora アニメーションプレビュー */}
      {showProgressivePreview && selectedLevelUpAnimation === 'aurora-progressive' && (
        <AuroraLevelUpAnimation
          newLevel={progressivePreviewLevel}
          standalone
          onComplete={() => setShowProgressivePreview(false)}
        />
      )}
    </MainLayout>
  )
}
