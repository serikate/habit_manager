'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore, type UIThemeDefinition } from '@/stores/themeStore'

export function ThemeUnlockPopup() {
  const { newlyUnlockedTheme, clearNewlyUnlockedTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (newlyUnlockedTheme) {
      setIsVisible(true)
      setIsClosing(false)
    }
  }, [newlyUnlockedTheme])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      clearNewlyUnlockedTheme()
    }, 300)
  }

  if (!mounted || !isVisible || !newlyUnlockedTheme) return null

  const content = (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop with sparkle effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float-up"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
              background: `linear-gradient(135deg, ${newlyUnlockedTheme.previewColors.primary}, ${newlyUnlockedTheme.previewColors.secondary})`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Popup card */}
      <div
        className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 max-w-sm mx-4 shadow-2xl transform transition-all duration-500 ${
          isClosing ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          animation: isClosing ? 'none' : 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-3xl opacity-50 blur-xl -z-10"
          style={{
            background: `linear-gradient(135deg, ${newlyUnlockedTheme.previewColors.primary}40, ${newlyUnlockedTheme.previewColors.secondary}40)`
          }}
        />

        {/* Border gradient */}
        <div
          className="absolute inset-0 rounded-3xl p-[2px] -z-10"
          style={{
            background: `linear-gradient(135deg, ${newlyUnlockedTheme.previewColors.primary}, ${newlyUnlockedTheme.previewColors.secondary}, ${newlyUnlockedTheme.previewColors.accent})`
          }}
        >
          <div className="w-full h-full bg-gray-900 rounded-3xl" />
        </div>

        {/* Crown/unlock icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: `linear-gradient(135deg, ${newlyUnlockedTheme.previewColors.primary}30, ${newlyUnlockedTheme.previewColors.secondary}30)`,
              boxShadow: `0 0 30px ${newlyUnlockedTheme.previewColors.primary}40`
            }}
          >
            🎨
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-white mb-2">
          新テーマ解放！
        </h2>

        {/* Theme name with gradient */}
        <div className="text-center mb-4">
          <span
            className="text-3xl font-black bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${newlyUnlockedTheme.previewColors.primary}, ${newlyUnlockedTheme.previewColors.secondary})`
            }}
          >
            {newlyUnlockedTheme.name}
          </span>
        </div>

        {/* Theme preview colors */}
        <div className="flex justify-center gap-3 mb-4">
          {Object.values(newlyUnlockedTheme.previewColors).map((color, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full shadow-lg"
              style={{
                backgroundColor: color,
                boxShadow: `0 4px 15px ${color}60`
              }}
            />
          ))}
        </div>

        {/* Description */}
        <p className="text-center text-gray-400 text-sm mb-6">
          {newlyUnlockedTheme.description}
        </p>

        {/* Unlock level badge */}
        <div className="flex justify-center mb-6">
          <div className="px-4 py-1.5 bg-white/10 rounded-full text-sm text-white/80">
            Lv.{newlyUnlockedTheme.unlockLevel} で解放
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleClose}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${newlyUnlockedTheme.previewColors.primary}, ${newlyUnlockedTheme.previewColors.secondary})`
          }}
        >
          設定で適用する
        </button>

        {/* Tap to close hint */}
        <p className="text-center text-gray-500 text-xs mt-4">
          タップして閉じる
        </p>
      </div>

      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 4s ease-out infinite;
        }
      `}</style>
    </div>
  )

  return createPortal(content, document.body)
}
