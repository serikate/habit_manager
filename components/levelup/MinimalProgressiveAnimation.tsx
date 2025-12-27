'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

// ========================================
// Types
// ========================================

interface MinimalProgressiveAnimationProps {
  newLevel: number
  onComplete?: (() => void) | undefined
  standalone?: boolean
}

// ========================================
// Utility Functions
// ========================================

const random = (min: number, max: number) => Math.random() * (max - min) + min
const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
const easeOutBack = (t: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5)
const clamp = (val: number, min: number, max: number): number => Math.min(max, Math.max(min, val))
const toHexAlpha = (opacity: number): string => Math.floor(clamp(opacity, 0, 1) * 255).toString(16).padStart(2, '0')

// ========================================
// レベル別パラメータ設定
// ========================================

interface LevelConfig {
  // 基本設定
  duration: number           // アニメーション時間(ms)
  bgColor: string           // 背景色

  // サークル設定
  circleCount: number       // 拡大するサークル数
  circleMaxRadius: number   // サークル最大半径
  circleColor: string       // サークル色

  // パーティクル設定
  particleCount: number     // パーティクル数
  particleSize: [number, number] // パーティクルサイズ範囲
  particleColors: string[]  // パーティクル色

  // グロー設定
  glowIntensity: number     // グロー強度 (0-1)
  glowColor: string         // グロー色
  glowLayers: number        // グローレイヤー数

  // テキスト設定
  textColor: string         // テキスト色
  textGlow: boolean         // テキストグロー有無
  textScale: number         // テキストスケール

  // 追加エフェクト
  hasShimmer: boolean       // シマー効果
  hasBurst: boolean         // バースト効果
  hasGoldenAccent: boolean  // ゴールドアクセント
  hasStars: boolean         // 星エフェクト
}

function getLevelConfig(level: number): LevelConfig {
  // レベルを1-10の範囲に制限
  const effectiveLevel = clamp(level, 1, 10)

  const configs: Record<number, LevelConfig> = {
    // Level 1: 超シンプル - テキストのフェードインのみ
    1: {
      duration: 2000,
      bgColor: 'rgba(15, 15, 15, 0.97)',
      circleCount: 0,
      circleMaxRadius: 0,
      circleColor: 'rgba(255, 255, 255, 0.2)',
      particleCount: 0,
      particleSize: [0, 0],
      particleColors: [],
      glowIntensity: 0,
      glowColor: '#FFFFFF',
      glowLayers: 0,
      textColor: 'rgba(255, 255, 255, 0.9)',
      textGlow: false,
      textScale: 1,
      hasShimmer: false,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: false,
    },
    // Level 2: シンプル - サークル1つ + テキスト
    2: {
      duration: 2500,
      bgColor: 'rgba(15, 15, 15, 0.97)',
      circleCount: 1,
      circleMaxRadius: 150,
      circleColor: 'rgba(255, 255, 255, 0.3)',
      particleCount: 0,
      particleSize: [0, 0],
      particleColors: [],
      glowIntensity: 0,
      glowColor: '#FFFFFF',
      glowLayers: 0,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: false,
      textScale: 1,
      hasShimmer: false,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: false,
    },
    // Level 3: 微かなパーティクル追加
    3: {
      duration: 2500,
      bgColor: 'rgba(15, 15, 15, 0.97)',
      circleCount: 1,
      circleMaxRadius: 160,
      circleColor: 'rgba(255, 255, 255, 0.3)',
      particleCount: 8,
      particleSize: [1, 3],
      particleColors: ['#FFFFFF'],
      glowIntensity: 0,
      glowColor: '#FFFFFF',
      glowLayers: 0,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: false,
      textScale: 1,
      hasShimmer: false,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: false,
    },
    // Level 4: 複数サークル
    4: {
      duration: 2800,
      bgColor: 'rgba(15, 15, 15, 0.97)',
      circleCount: 2,
      circleMaxRadius: 180,
      circleColor: 'rgba(255, 255, 255, 0.25)',
      particleCount: 12,
      particleSize: [1, 3],
      particleColors: ['#FFFFFF', '#E0E0E0'],
      glowIntensity: 0,
      glowColor: '#FFFFFF',
      glowLayers: 0,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: false,
      textScale: 1.02,
      hasShimmer: false,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: false,
    },
    // Level 5: ソフトグロー追加
    5: {
      duration: 2800,
      bgColor: 'rgba(12, 12, 15, 0.97)',
      circleCount: 2,
      circleMaxRadius: 200,
      circleColor: 'rgba(255, 255, 255, 0.25)',
      particleCount: 16,
      particleSize: [1, 4],
      particleColors: ['#FFFFFF', '#E8E8E8'],
      glowIntensity: 0.3,
      glowColor: '#FFFFFF',
      glowLayers: 1,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: true,
      textScale: 1.05,
      hasShimmer: false,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: false,
    },
    // Level 6: パーティクル増加 + 微かな色味
    6: {
      duration: 3000,
      bgColor: 'rgba(10, 10, 15, 0.97)',
      circleCount: 3,
      circleMaxRadius: 220,
      circleColor: 'rgba(200, 210, 255, 0.2)',
      particleCount: 24,
      particleSize: [1, 5],
      particleColors: ['#FFFFFF', '#E8E8FF', '#D0D8FF'],
      glowIntensity: 0.4,
      glowColor: '#D0D8FF',
      glowLayers: 1,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: true,
      textScale: 1.08,
      hasShimmer: false,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: false,
    },
    // Level 7: シマーエフェクト追加
    7: {
      duration: 3000,
      bgColor: 'rgba(8, 8, 15, 0.97)',
      circleCount: 3,
      circleMaxRadius: 240,
      circleColor: 'rgba(180, 200, 255, 0.2)',
      particleCount: 32,
      particleSize: [1, 5],
      particleColors: ['#FFFFFF', '#E0E8FF', '#C8D8FF'],
      glowIntensity: 0.5,
      glowColor: '#C8D8FF',
      glowLayers: 2,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: true,
      textScale: 1.1,
      hasShimmer: true,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: false,
    },
    // Level 8: 複数グローレイヤー + 星
    8: {
      duration: 3200,
      bgColor: 'rgba(5, 5, 12, 0.97)',
      circleCount: 4,
      circleMaxRadius: 260,
      circleColor: 'rgba(160, 180, 255, 0.2)',
      particleCount: 40,
      particleSize: [1, 6],
      particleColors: ['#FFFFFF', '#E0E8FF', '#B8C8FF', '#A0B8FF'],
      glowIntensity: 0.6,
      glowColor: '#A0B8FF',
      glowLayers: 2,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: true,
      textScale: 1.12,
      hasShimmer: true,
      hasBurst: false,
      hasGoldenAccent: false,
      hasStars: true,
    },
    // Level 9: バースト効果追加
    9: {
      duration: 3500,
      bgColor: 'rgba(3, 3, 10, 0.97)',
      circleCount: 4,
      circleMaxRadius: 280,
      circleColor: 'rgba(140, 160, 255, 0.2)',
      particleCount: 50,
      particleSize: [1, 7],
      particleColors: ['#FFFFFF', '#E8F0FF', '#C0D0FF', '#A0B8FF', '#FFE080'],
      glowIntensity: 0.7,
      glowColor: '#8090FF',
      glowLayers: 3,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: true,
      textScale: 1.15,
      hasShimmer: true,
      hasBurst: true,
      hasGoldenAccent: false,
      hasStars: true,
    },
    // Level 10: フル演出 - ゴールドアクセント
    10: {
      duration: 4000,
      bgColor: 'rgba(2, 2, 8, 0.97)',
      circleCount: 5,
      circleMaxRadius: 300,
      circleColor: 'rgba(255, 215, 100, 0.15)',
      particleCount: 60,
      particleSize: [2, 8],
      particleColors: ['#FFFFFF', '#FFF8E0', '#FFE080', '#FFD700', '#E8E8FF'],
      glowIntensity: 0.8,
      glowColor: '#FFD700',
      glowLayers: 3,
      textColor: 'rgba(255, 255, 255, 1)',
      textGlow: true,
      textScale: 1.2,
      hasShimmer: true,
      hasBurst: true,
      hasGoldenAccent: true,
      hasStars: true,
    },
  }

  return configs[effectiveLevel] ?? configs[2]!
}

// ========================================
// Main Animation Component
// ========================================

function MinimalProgressiveCanvas({
  canvasRef,
  onProgress,
  newLevel
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onProgress: (p: number) => void
  newLevel: number
}) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height
    startTimeRef.current = performance.now()

    const config = getLevelConfig(newLevel)
    const centerX = width / 2
    const centerY = height / 2

    // パーティクル初期化
    interface Particle {
      x: number; y: number
      vx: number; vy: number
      life: number; maxLife: number
      size: number; color: string
    }
    const particles: Particle[] = []

    // 星の初期化
    interface Star {
      x: number; y: number
      size: number; opacity: number
      twinkleSpeed: number; phase: number
    }
    const stars: Star[] = config.hasStars
      ? Array.from({ length: 30 }, () => ({
          x: random(0, width),
          y: random(0, height),
          size: random(0.5, 2),
          opacity: random(0.3, 0.8),
          twinkleSpeed: random(0.02, 0.06),
          phase: random(0, Math.PI * 2)
        }))
      : []

    // サークル状態
    interface Circle {
      radius: number
      delay: number
      opacity: number
    }
    const circles: Circle[] = Array.from({ length: config.circleCount }, (_, i) => ({
      radius: 0,
      delay: i * 8,
      opacity: 0
    }))

    // バースト状態
    let burstTriggered = false
    const burstParticles: Particle[] = []

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / config.duration) * 100)
      onProgress(progress)

      const fadeOut = progress > 80 ? (100 - progress) / 20 : 1

      // 背景
      ctx.fillStyle = config.bgColor.replace('0.97', `${0.97 * fadeOut}`)
      ctx.fillRect(0, 0, width, height)

      // 星の描画
      if (config.hasStars) {
        for (const star of stars) {
          star.phase += star.twinkleSpeed
          const twinkle = 0.5 + 0.5 * Math.sin(star.phase)
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle * fadeOut})`
          ctx.fill()
        }
      }

      // サークルの描画と更新
      if (progress > 5 && progress < 85) {
        for (let i = 0; i < circles.length; i++) {
          const circle = circles[i]
          if (!circle) continue

          const circleProgress = clamp((progress - 5 - circle.delay) / 40, 0, 1)
          circle.radius = easeOutExpo(circleProgress) * config.circleMaxRadius
          circle.opacity = progress > 60 ? (85 - progress) / 25 : 0.3

          if (circle.radius > 0) {
            ctx.beginPath()
            ctx.arc(centerX, centerY, circle.radius, 0, Math.PI * 2)
            ctx.strokeStyle = config.circleColor.replace('0.', `${circle.opacity * fadeOut * 0.1}`)
            ctx.lineWidth = 1.5 - i * 0.2
            ctx.stroke()
          }
        }
      }

      // パーティクル生成
      if (progress > 15 && progress < 70 && config.particleCount > 0) {
        if (particles.length < config.particleCount && Math.random() < 0.3) {
          const angle = random(0, Math.PI * 2)
          const distance = random(50, 150)
          particles.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            vx: random(-0.5, 0.5),
            vy: random(-1.5, -0.5),
            life: 1,
            maxLife: random(60, 100),
            size: random(config.particleSize[0], config.particleSize[1]),
            color: config.particleColors[Math.floor(random(0, config.particleColors.length))] || '#FFFFFF'
          })
        }
      }

      // パーティクル更新・描画
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.life -= 1 / p.maxLife

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const pOpacity = easeOutQuint(p.life) * fadeOut
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${toHexAlpha(pOpacity)}`
        ctx.fill()
      }

      // バースト効果
      if (config.hasBurst && !burstTriggered && progress > 30) {
        burstTriggered = true
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2
          const speed = random(2, 6)
          burstParticles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: random(40, 70),
            size: random(2, 5),
            color: config.particleColors[Math.floor(random(0, config.particleColors.length))] || '#FFFFFF'
          })
        }
      }

      // バーストパーティクル更新・描画
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96
        p.vy *= 0.96
        p.life -= 1 / p.maxLife

        if (p.life <= 0) {
          burstParticles.splice(i, 1)
          continue
        }

        const pOpacity = easeOutQuint(p.life) * fadeOut
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${toHexAlpha(pOpacity)}`
        ctx.fill()
      }

      // グロー効果
      if (config.glowIntensity > 0 && progress > 20 && progress < 90) {
        const glowProgress = clamp((progress - 20) / 30, 0, 1)
        const glowOpacity = config.glowIntensity * easeOutExpo(glowProgress) * fadeOut
        const baseSize = 80 + config.glowLayers * 30

        for (let layer = config.glowLayers; layer >= 0; layer--) {
          const size = baseSize + layer * 40
          const layerOpacity = glowOpacity * (1 - layer * 0.25)
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size)
          gradient.addColorStop(0, `${config.glowColor}${toHexAlpha(layerOpacity * 0.5)}`)
          gradient.addColorStop(0.5, `${config.glowColor}${toHexAlpha(layerOpacity * 0.2)}`)
          gradient.addColorStop(1, 'transparent')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // テキスト描画
      if (progress > 10 && progress < 90) {
        const textProgress = clamp((progress - 10) / 25, 0, 1)
        const textOpacity = (progress > 70 ? (90 - progress) / 20 : easeOutExpo(textProgress)) * fadeOut
        const scale = easeOutBack(textProgress) * config.textScale

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.scale(scale, scale)

        // テキストグロー
        if (config.textGlow) {
          ctx.shadowColor = config.glowColor
          ctx.shadowBlur = 30 + config.glowIntensity * 20
        }

        // シマー効果
        let textFillColor = config.textColor.replace('1)', `${textOpacity})`)
        if (config.hasShimmer) {
          const shimmerPhase = (elapsed / 1000) * 2
          const shimmer = 0.9 + 0.1 * Math.sin(shimmerPhase)
          textFillColor = `rgba(255, 255, 255, ${textOpacity * shimmer})`
        }

        // "LEVEL UP" テキスト
        ctx.font = '300 18px system-ui, sans-serif'
        ctx.fillStyle = `rgba(150, 150, 150, ${textOpacity * 0.8})`
        ctx.textAlign = 'center'
        ctx.fillText('L E V E L  U P', 0, -40)

        // レベル数字
        ctx.font = `200 ${config.hasGoldenAccent ? 95 : 90}px system-ui, sans-serif`
        ctx.fillStyle = textFillColor

        // ゴールドアクセント
        if (config.hasGoldenAccent) {
          ctx.shadowColor = '#FFD700'
          ctx.shadowBlur = 40
        }

        ctx.fillText(`${newLevel}`, 0, 35)

        ctx.restore()
      }

      if (progress < 100) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// Export Component
// ========================================

export function MinimalProgressiveAnimation({
  newLevel,
  onComplete,
  standalone = false
}: MinimalProgressiveAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showBackButton, setShowBackButton] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Show back button after 5 seconds as a safety fallback
    const timer = setTimeout(() => {
      setShowBackButton(true)
    }, 5000)
    return () => {
      setMounted(false)
      clearTimeout(timer)
    }
  }, [])

  const handleBackToDashboard = useCallback(() => {
    onComplete?.()
    router.push('/dashboard')
  }, [onComplete, router])

  const handleProgress = useCallback((p: number) => {
    setProgress(p)
    if (p >= 100 && onComplete) {
      setTimeout(onComplete, 100)
    }
  }, [onComplete])

  if (!mounted) return null

  const content = (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto"
      onClick={() => onComplete?.()}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <MinimalProgressiveCanvas
        canvasRef={canvasRef}
        onProgress={handleProgress}
        newLevel={newLevel}
      />

      {/* Back to Dashboard button - appears after 5 seconds as safety fallback */}
      {showBackButton && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleBackToDashboard()
          }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3
                     bg-white/10 hover:bg-white/20 backdrop-blur-sm
                     border border-white/20 rounded-full
                     text-white/80 hover:text-white text-sm font-medium
                     transition-all duration-300 ease-out z-[10000]"
          style={{
            animation: 'fadeIn 0.5s ease-out'
          }}
        >
          ダッシュボードに戻る
        </button>
      )}
    </div>
  )

  if (standalone) {
    return content
  }

  return createPortal(content, document.body)
}

export default MinimalProgressiveAnimation
