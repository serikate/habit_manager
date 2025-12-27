'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLevelUpStore } from '@/stores/levelUpStore'

// ========================================
// Types
// ========================================

interface XPInfo {
  baseXP: number
  streakBonus: number
  totalXP: number
  newStreak: number
  isStreakExtended: boolean
  leveledUp: boolean
  newLevel: number | undefined
  previousProgress: number
  currentProgress: number
  currentLevelXP: number
  requiredXP: number
  currentLevel: number
}

interface HabitCompletionPopupProps {
  habitName: string
  xpInfo?: XPInfo | undefined
  onComplete?: () => void
}

// ========================================
// Utility Functions
// ========================================

const random = (min: number, max: number) => Math.random() * (max - min) + min
const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))
const toHexAlpha = (opacity: number) => Math.floor(clamp(opacity, 0, 1) * 255).toString(16).padStart(2, '0')
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const easeOutElastic = (t: number) => {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

// ========================================
// Aurora Canvas Animation
// ========================================

function AuroraPopupCanvas({
  canvasRef,
  onProgress,
  width,
  height
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onProgress: (p: number) => void
  width: number
  height: number
}) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height
    startTimeRef.current = performance.now()

    // Aurora waves configuration
    const waves = Array.from({ length: 4 }, (_, i) => ({
      y: height * 0.2 + i * 20,
      amplitude: 12 + i * 6,
      frequency: 0.01 + i * 0.003,
      speed: 0.04 + i * 0.015,
      phase: random(0, Math.PI * 2),
      color: ['#00ff87', '#60efff', '#ff61d8', '#ffaa00'][i] ?? '#00ff87'
    }))

    // Stars configuration
    const stars = Array.from({ length: 50 }, () => ({
      x: random(0, width),
      y: random(0, height * 0.5),
      size: random(0.5, 1.5),
      opacity: random(0.3, 0.9),
      twinkle: random(0, Math.PI * 2),
      speed: random(0.04, 0.12)
    }))

    // Floating orbs (coin-like)
    const orbs = Array.from({ length: 6 }, () => ({
      x: random(width * 0.1, width * 0.9),
      y: random(height * 0.15, height * 0.4),
      size: random(6, 14),
      phase: random(0, Math.PI * 2),
      speed: random(0.03, 0.06),
      floatY: 0,
      floatSpeed: random(0.03, 0.05),
      color: randomChoice(['#FFD700', '#FFC107', '#FFEB3B', '#00ff87', '#60efff'])
    }))

    // Rising sparkles (XP particles)
    interface Sparkle {
      x: number
      y: number
      vy: number
      vx: number
      size: number
      color: string
      life: number
      maxLife: number
      rotation: number
      rotationSpeed: number
    }
    const sparkles: Sparkle[] = []

    // Duration is longer if there's a level up animation
    const DURATION = 4500 // 4.5 seconds to accommodate level up animation

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / DURATION) * 100)
      onProgress(progress)

      // Fade in/out
      const fadeIn = Math.min(1, progress / 12)
      const fadeOut = progress > 80 ? 1 - (progress - 80) / 20 : 1
      const fadeOp = fadeIn * fadeOut

      // Clear with transparent
      ctx.clearRect(0, 0, width, height)

      // Background gradient with rounded corners
      ctx.save()
      ctx.beginPath()
      const radius = 20
      ctx.roundRect(0, 0, width, height, radius)
      ctx.clip()

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, `rgba(8, 0, 18, ${0.97 * fadeOp})`)
      bgGrad.addColorStop(0.4, `rgba(20, 0, 40, ${0.97 * fadeOp})`)
      bgGrad.addColorStop(1, `rgba(8, 0, 25, ${0.97 * fadeOp})`)
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Draw stars
      for (const s of stars) {
        s.twinkle += s.speed
        const tw = 0.5 + 0.5 * Math.sin(s.twinkle)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * tw, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * tw * fadeOp})`
        ctx.fill()
      }

      // Draw aurora waves
      for (const wave of waves) {
        wave.phase += wave.speed
        ctx.beginPath()
        for (let x = 0; x <= width; x += 3) {
          const y = wave.y +
            Math.sin(x * wave.frequency + wave.phase) * wave.amplitude +
            Math.sin(x * wave.frequency * 2 + wave.phase * 1.5) * wave.amplitude * 0.3
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
        ctx.closePath()

        const grad = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, wave.y + 80)
        grad.addColorStop(0, `${wave.color}${toHexAlpha(0.4 * fadeOp)}`)
        grad.addColorStop(0.5, `${wave.color}${toHexAlpha(0.15 * fadeOp)}`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Draw orbs (coin-like glow)
      for (const orb of orbs) {
        orb.phase += orb.speed
        orb.floatY += orb.floatSpeed
        const y = orb.y + Math.sin(orb.floatY) * 8
        const pulse = 0.8 + 0.2 * Math.sin(orb.phase)

        const grad = ctx.createRadialGradient(orb.x, y, 0, orb.x, y, orb.size * pulse)
        grad.addColorStop(0, `${orb.color}${toHexAlpha(0.9 * fadeOp)}`)
        grad.addColorStop(0.5, `${orb.color}${toHexAlpha(0.4 * fadeOp)}`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(orb.x, y, orb.size * pulse * 2, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Add rising sparkles during celebration phase
      if (progress > 15 && progress < 75 && sparkles.length < 40) {
        if (Math.random() < 0.4) {
          sparkles.push({
            x: random(width * 0.15, width * 0.85),
            y: height + 5,
            vy: random(-3, -5),
            vx: random(-0.5, 0.5),
            size: random(2, 5),
            color: randomChoice(['#FFD700', '#FFC107', '#00ff87', '#60efff', '#ff61d8', '#ffffff']),
            life: 1,
            maxLife: random(50, 80),
            rotation: random(0, Math.PI * 2),
            rotationSpeed: random(-0.1, 0.1)
          })
        }
      }

      // Update and draw sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const p = sparkles[i]
        if (!p) continue
        p.y += p.vy
        p.x += p.vx
        p.vy *= 0.98
        p.rotation += p.rotationSpeed
        p.life -= 1 / p.maxLife

        if (p.life <= 0 || p.y < 0) {
          sparkles.splice(i, 1)
          continue
        }

        const pOpacity = p.life * fadeOp
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        // Draw sparkle shape (4-pointed star)
        ctx.beginPath()
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2
          const r = j % 2 === 0 ? p.size : p.size * 0.4
          if (j === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
        }
        ctx.closePath()
        ctx.fillStyle = `${p.color}${toHexAlpha(pOpacity)}`
        ctx.fill()
        ctx.restore()
      }

      ctx.restore()

      if (progress < 100) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, width, height])

  return null
}

// ========================================
// Export Component
// ========================================

export function HabitCompletionPopup({
  habitName,
  xpInfo,
  onComplete
}: HabitCompletionPopupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0) // 0: initial, 1: xp show, 2: bar fill, 3: level up flash, 4: bar reset, 5: complete
  const [displayedXP, setDisplayedXP] = useState(0)
  const [barProgress, setBarProgress] = useState(xpInfo?.previousProgress || 0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [barFlashing, setBarFlashing] = useState(false)
  const [displayedLevel, setDisplayedLevel] = useState(xpInfo?.currentLevel ? xpInfo.currentLevel - (xpInfo.leveledUp ? 1 : 0) : 1)
  const [levelUpAnimationTriggered, setLevelUpAnimationTriggered] = useState(false)

  // Level up store for triggering the full level up animation
  const triggerLevelUp = useLevelUpStore((state) => state.triggerLevelUp)

  // Popup dimensions - larger to accommodate level up text
  const popupWidth = 400
  const popupHeight = 360

  useEffect(() => {
    setMounted(true)

    // Animation sequence
    const phase1 = setTimeout(() => setAnimationPhase(1), 300)  // Show XP text
    const phase2 = setTimeout(() => setAnimationPhase(2), 600)  // Start bar fill

    // If level up, add extra phases
    if (xpInfo?.leveledUp) {
      // Phase 3: Level up flash (triggered when bar reaches 100%)
      // Phase 4: Bar reset
      // Phase 5: Complete
    } else {
      const phase3 = setTimeout(() => setAnimationPhase(5), 1800) // Complete state (skip level up phases)
      return () => {
        setMounted(false)
        clearTimeout(phase1)
        clearTimeout(phase2)
        clearTimeout(phase3)
      }
    }

    return () => {
      setMounted(false)
      clearTimeout(phase1)
      clearTimeout(phase2)
    }
  }, [xpInfo?.leveledUp])

  // XP counter animation
  useEffect(() => {
    if (animationPhase >= 1 && xpInfo) {
      const targetXP = xpInfo.totalXP
      const duration = 600
      const startTime = performance.now()

      const animateCounter = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = easeOutExpo(progress)
        setDisplayedXP(Math.round(targetXP * eased))

        if (progress < 1) {
          requestAnimationFrame(animateCounter)
        }
      }
      requestAnimationFrame(animateCounter)
    }
  }, [animationPhase, xpInfo])

  // Progress bar animation
  useEffect(() => {
    if (animationPhase !== 2 || !xpInfo) return

    if (xpInfo.leveledUp) {
      // Level up case: animate to 100%, then flash, reset to 0, animate to final
      const startProgress = xpInfo.previousProgress
      const duration = 600
      const startTime = performance.now()

      const animateToMax = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = easeOutExpo(progress)
        setBarProgress(startProgress + (100 - startProgress) * eased)

        if (progress < 1) {
          requestAnimationFrame(animateToMax)
        } else {
          // Bar reached 100%, trigger level up effects
          setAnimationPhase(3)
          setShowLevelUp(true)
          setBarFlashing(true)

          // After flash animation, reset bar and animate to new progress
          setTimeout(() => {
            setBarFlashing(false)
            setDisplayedLevel(xpInfo.currentLevel)
            setBarProgress(0)
            setAnimationPhase(4)

            // Animate to new progress after reset
            setTimeout(() => {
              const resetStartTime = performance.now()
              const finalProgress = xpInfo.currentProgress

              const animateFromZero = (currentTime: number) => {
                const elapsed = currentTime - resetStartTime
                const progress = Math.min(1, elapsed / 600)
                const eased = easeOutExpo(progress)
                setBarProgress(finalProgress * eased)

                if (progress < 1) {
                  requestAnimationFrame(animateFromZero)
                } else {
                  setAnimationPhase(5)
                }
              }
              requestAnimationFrame(animateFromZero)
            }, 100)
          }, 1000) // Flash duration
        }
      }
      requestAnimationFrame(animateToMax)
    } else {
      // Normal case: just animate to final progress
      const startProgress = xpInfo.previousProgress
      const endProgress = xpInfo.currentProgress
      const duration = 800
      const startTime = performance.now()

      const animateBar = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = easeOutExpo(progress)
        setBarProgress(startProgress + (endProgress - startProgress) * eased)

        if (progress < 1) {
          requestAnimationFrame(animateBar)
        }
      }
      requestAnimationFrame(animateBar)
    }
  }, [animationPhase, xpInfo])

  const handleProgress = useCallback((p: number) => {
    setProgress(p)
    if (p >= 100 && onComplete) {
      // Trigger the full level-up animation BEFORE closing the popup
      // This ensures the animation is triggered even if the component unmounts
      if (xpInfo?.leveledUp && xpInfo.newLevel && !levelUpAnimationTriggered) {
        setLevelUpAnimationTriggered(true)
        // Trigger immediately - the level up store will queue the animation
        triggerLevelUp(xpInfo.newLevel, xpInfo.newLevel - 1)
      }

      // Then close the habit completion popup
      setTimeout(() => {
        onComplete()
      }, 100)
    }
  }, [onComplete, xpInfo, levelUpAnimationTriggered, triggerLevelUp])

  if (!mounted) return null

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
      onClick={() => onComplete?.()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: progress > 80 ? (100 - progress) / 20 : Math.min(1, progress / 12)
        }}
      />

      {/* Popup container */}
      <div
        className="relative"
        style={{
          width: popupWidth,
          height: popupHeight,
          transform: `scale(${progress < 15 ? easeOutBack(progress / 15) : progress > 85 ? 1 - (progress - 85) / 80 : 1})`,
          opacity: progress > 90 ? (100 - progress) / 10 : 1
        }}
      >
        {/* Canvas for aurora effect */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 rounded-3xl"
          style={{
            width: popupWidth,
            height: popupHeight,
            boxShadow: '0 0 50px rgba(0, 255, 135, 0.4), 0 0 100px rgba(96, 239, 255, 0.25), 0 0 150px rgba(255, 97, 216, 0.15)'
          }}
        />
        <AuroraPopupCanvas
          canvasRef={canvasRef}
          onProgress={handleProgress}
          width={popupWidth}
          height={popupHeight}
        />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-6">
          {/* Check icon with pulse */}
          <div
            className="mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 flex items-center justify-center"
            style={{
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(6, 182, 212, 0.3)',
              transform: `scale(${animationPhase >= 1 ? 1 : 0})`,
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: animationPhase >= 1 ? 'pulse 2s ease-in-out infinite' : 'none'
            }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Complete text */}
          <p
            className="text-emerald-300 text-sm font-semibold tracking-widest mb-1"
            style={{
              opacity: animationPhase >= 1 ? 1 : 0,
              transform: `translateY(${animationPhase >= 1 ? 0 : 10}px)`,
              transition: 'all 0.4s ease-out 0.1s',
              textShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
            }}
          >
            COMPLETE!
          </p>

          {/* Habit name */}
          <p
            className="text-white text-lg font-bold text-center leading-tight mb-5 max-w-[300px] truncate"
            style={{
              opacity: animationPhase >= 1 ? 1 : 0,
              transform: `translateY(${animationPhase >= 1 ? 0 : 10}px)`,
              transition: 'all 0.4s ease-out 0.15s',
              textShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
            }}
          >
            {habitName}
          </p>

          {/* XP Gained Section */}
          {xpInfo && (
            <div
              className="w-full max-w-[320px]"
              style={{
                opacity: animationPhase >= 1 ? 1 : 0,
                transform: `translateY(${animationPhase >= 1 ? 0 : 15}px)`,
                transition: 'all 0.5s ease-out 0.2s'
              }}
            >
              {/* XP Display */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30"
                  style={{
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
                    animation: animationPhase >= 1 ? 'glow 1.5s ease-in-out infinite alternate' : 'none'
                  }}
                >
                  <span className="text-amber-300 text-lg">+</span>
                  <span
                    className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent"
                    style={{
                      textShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
                    }}
                  >
                    {displayedXP}
                  </span>
                  <span className="text-amber-300 text-sm font-semibold">XP</span>
                </div>

                {/* Streak bonus */}
                {xpInfo.streakBonus > 0 && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-400/30"
                    style={{
                      opacity: animationPhase >= 2 ? 1 : 0,
                      transform: `scale(${animationPhase >= 2 ? 1 : 0.8})`,
                      transition: 'all 0.3s ease-out'
                    }}
                  >
                    <span className="text-orange-400 text-xs">🔥</span>
                    <span className="text-orange-300 text-xs font-semibold">+{xpInfo.streakBonus}</span>
                  </div>
                )}
              </div>

              {/* Level Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className="text-white/70 font-medium transition-all duration-300"
                    style={{
                      color: showLevelUp ? '#FFD700' : undefined,
                      textShadow: showLevelUp ? '0 0 10px rgba(255, 215, 0, 0.8)' : undefined
                    }}
                  >
                    Lv.{displayedLevel}
                  </span>
                  <span className="text-white/50">
                    {Math.round(barProgress)} / {xpInfo.requiredXP} XP
                  </span>
                </div>

                {/* Progress bar container */}
                <div
                  className="relative h-3 bg-white/10 rounded-full overflow-hidden border border-white/10 transition-all duration-300"
                  style={{
                    boxShadow: barFlashing
                      ? '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5), 0 0 90px rgba(255, 215, 0, 0.3)'
                      : 'none'
                  }}
                >
                  {/* Progress fill */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                    style={{
                      width: `${barProgress}%`,
                      background: barFlashing
                        ? 'linear-gradient(90deg, #FFD700 0%, #FFF8DC 50%, #FFD700 100%)'
                        : 'linear-gradient(90deg, #00ff87 0%, #60efff 50%, #ff61d8 100%)',
                      boxShadow: barFlashing
                        ? '0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.8)'
                        : '0 0 15px rgba(0, 255, 135, 0.5), 0 0 30px rgba(96, 239, 255, 0.3)'
                    }}
                  />

                  {/* Shimmer effect */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: barFlashing
                        ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)'
                        : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: animationPhase >= 2 ? (barFlashing ? 'shimmer 0.3s ease-in-out infinite' : 'shimmer 1.5s ease-in-out infinite') : 'none'
                    }}
                  />
                </div>

                {/* Level Up Text */}
                {showLevelUp && (
                  <div
                    className="flex items-center justify-center mt-3"
                    style={{
                      animation: 'levelUpPulse 0.5s ease-out'
                    }}
                  >
                    <div
                      className="px-5 py-2 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 165, 0, 0.3) 100%)',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 165, 0, 0.2)',
                        animation: barFlashing ? 'levelUpGlow 0.3s ease-in-out infinite alternate' : 'none'
                      }}
                    >
                      <span
                        className="text-lg font-bold tracking-wider"
                        style={{
                          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                        }}
                      >
                        LEVEL UP!
                      </span>
                    </div>
                  </div>
                )}

                {/* Streak display */}
                {xpInfo.newStreak > 1 && !showLevelUp && (
                  <div
                    className="flex items-center justify-center gap-1.5 mt-2"
                    style={{
                      opacity: animationPhase >= 5 ? 1 : 0,
                      transform: `scale(${animationPhase >= 5 ? 1 : 0.9})`,
                      transition: 'all 0.4s ease-out'
                    }}
                  >
                    <span className="text-orange-400">🔥</span>
                    <span className="text-orange-300 text-sm font-semibold">
                      {xpInfo.newStreak}日連続達成中!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback when no XP info */}
          {!xpInfo && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30"
              style={{
                opacity: animationPhase >= 1 ? 1 : 0,
                transition: 'opacity 0.4s ease-out 0.2s'
              }}
            >
              <span className="text-emerald-300 text-sm font-semibold">習慣を達成しました!</span>
            </div>
          )}
        </div>

        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2.5s ease-in-out infinite'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8), 0 0 80px rgba(6, 182, 212, 0.5); }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
          100% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.5), 0 0 40px rgba(251, 191, 36, 0.3); }
        }
        @keyframes levelUpPulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes levelUpGlow {
          0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 165, 0, 0.2); }
          100% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 165, 0, 0.4), 0 0 120px rgba(255, 215, 0, 0.2); }
        }
      `}</style>
    </div>
  )

  return createPortal(content, document.body)
}

export default HabitCompletionPopup
