'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

// ========================================
// Types
// ========================================

interface LuxuryLevelUpAnimationProps {
  newLevel: number
  onComplete?: (() => void) | undefined
  standalone?: boolean
}

// ========================================
// Utility Functions
// ========================================

const random = (min: number, max: number) => Math.random() * (max - min) + min
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const toHexAlpha = (opacity: number) => Math.floor(clamp(opacity, 0, 1) * 255).toString(16).padStart(2, '0')

// Smooth, elegant easing functions
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

// ========================================
// Luxury Color Palettes
// ========================================

interface LevelPalette {
  primary: string      // Main accent color
  secondary: string    // Secondary accent
  glow: string         // Glow color
  text: string         // Text color
  particle: string[]   // Particle colors
  bgGradient: [string, string] // Background gradient
}

function getLevelPalette(level: number): LevelPalette {
  const effectiveLevel = clamp(level, 1, 10)

  // Elegant, sophisticated palettes
  const palettes: Record<number, LevelPalette> = {
    // Level 1-2: Platinum/Silver - Clean, minimal
    1: {
      primary: '#C0C0C0',
      secondary: '#A8A8A8',
      glow: '#E8E8E8',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#E8E8E8', '#D0D0D0'],
      bgGradient: ['#0A0A0C', '#121216']
    },
    2: {
      primary: '#D4D4D4',
      secondary: '#B8B8B8',
      glow: '#F0F0F0',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#F0F0F0', '#E0E0E0', '#D0D0D0'],
      bgGradient: ['#0C0C0E', '#141418']
    },
    // Level 3-4: Champagne - Warm elegance
    3: {
      primary: '#D4AF37',
      secondary: '#C9A227',
      glow: '#E8D5A0',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#F5ECD7', '#E8D5A0', '#D4C08A'],
      bgGradient: ['#0D0B08', '#1A1610']
    },
    4: {
      primary: '#DAB855',
      secondary: '#C9A840',
      glow: '#F0E0B0',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#F8F0E0', '#E8D8B0', '#D8C890'],
      bgGradient: ['#0E0C08', '#1C1812']
    },
    // Level 5: Rose Gold - Milestone elegance
    5: {
      primary: '#B76E79',
      secondary: '#C9848E',
      glow: '#E8C0C8',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#F0D8DC', '#E8C0C8', '#D8A8B0'],
      bgGradient: ['#100A0C', '#1C1418']
    },
    // Level 6-7: Deep Navy & Gold - Royal
    6: {
      primary: '#C9A227',
      secondary: '#1E3A5F',
      glow: '#E8D090',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#F5ECD0', '#C9A227', '#E8D890'],
      bgGradient: ['#08090E', '#0E1420']
    },
    7: {
      primary: '#D4AF37',
      secondary: '#1E4070',
      glow: '#F0DC98',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#F8F0D8', '#D4AF37', '#E8D090'],
      bgGradient: ['#080A10', '#101828']
    },
    // Level 8-9: Pure Gold - Luxurious
    8: {
      primary: '#D4AF37',
      secondary: '#E8C860',
      glow: '#F8E8A0',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#FFF8E8', '#F0E0A0', '#D4AF37'],
      bgGradient: ['#0C0A06', '#181408']
    },
    9: {
      primary: '#E8C850',
      secondary: '#D4B040',
      glow: '#FFF0B0',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#FFF8E0', '#F8E8A0', '#E8D080', '#D4AF37'],
      bgGradient: ['#0E0C06', '#1A1608']
    },
    // Level 10: Imperial Gold - Ultimate luxury
    10: {
      primary: '#FFD700',
      secondary: '#E8C040',
      glow: '#FFF8C0',
      text: '#FFFFFF',
      particle: ['#FFFFFF', '#FFFAE8', '#FFF0C0', '#FFE890', '#FFD700', '#E8C040'],
      bgGradient: ['#100E06', '#1E1A08']
    }
  }

  return palettes[effectiveLevel] ?? palettes[1]!
}

// ========================================
// Animation Configuration
// ========================================

interface LevelConfig {
  duration: number
  // Floating particles
  floatingParticleCount: number
  floatingParticleSpeed: number
  // Light rays
  rayCount: number
  rayIntensity: number
  // Central orb
  orbSize: number
  orbGlow: number
  orbPulse: boolean
  // Shimmer ring
  hasShimmerRing: boolean
  shimmerRingSize: number
  // Accent particles (rising)
  accentParticleCount: number
  // Text
  textSize: number
  hasSubtitle: boolean
  subtitle: string
}

function getLevelConfig(level: number): LevelConfig {
  const effectiveLevel = clamp(level, 1, 10)
  const isMilestone = level === 5 || level === 10

  const configs: Record<number, LevelConfig> = {
    1: {
      duration: 3000,
      floatingParticleCount: 15,
      floatingParticleSpeed: 0.3,
      rayCount: 0,
      rayIntensity: 0,
      orbSize: 0,
      orbGlow: 0,
      orbPulse: false,
      hasShimmerRing: false,
      shimmerRingSize: 0,
      accentParticleCount: 0,
      textSize: 80,
      hasSubtitle: false,
      subtitle: ''
    },
    2: {
      duration: 3200,
      floatingParticleCount: 20,
      floatingParticleSpeed: 0.35,
      rayCount: 0,
      rayIntensity: 0,
      orbSize: 60,
      orbGlow: 0.2,
      orbPulse: false,
      hasShimmerRing: false,
      shimmerRingSize: 0,
      accentParticleCount: 5,
      textSize: 82,
      hasSubtitle: false,
      subtitle: ''
    },
    3: {
      duration: 3400,
      floatingParticleCount: 25,
      floatingParticleSpeed: 0.4,
      rayCount: 4,
      rayIntensity: 0.15,
      orbSize: 70,
      orbGlow: 0.3,
      orbPulse: false,
      hasShimmerRing: false,
      shimmerRingSize: 0,
      accentParticleCount: 8,
      textSize: 85,
      hasSubtitle: false,
      subtitle: ''
    },
    4: {
      duration: 3600,
      floatingParticleCount: 30,
      floatingParticleSpeed: 0.4,
      rayCount: 6,
      rayIntensity: 0.2,
      orbSize: 80,
      orbGlow: 0.4,
      orbPulse: true,
      hasShimmerRing: true,
      shimmerRingSize: 120,
      accentParticleCount: 12,
      textSize: 88,
      hasSubtitle: false,
      subtitle: ''
    },
    5: {
      duration: 4000,
      floatingParticleCount: 40,
      floatingParticleSpeed: 0.45,
      rayCount: 8,
      rayIntensity: 0.3,
      orbSize: 90,
      orbGlow: 0.5,
      orbPulse: true,
      hasShimmerRing: true,
      shimmerRingSize: 150,
      accentParticleCount: 18,
      textSize: 92,
      hasSubtitle: true,
      subtitle: 'Achievement'
    },
    6: {
      duration: 3800,
      floatingParticleCount: 35,
      floatingParticleSpeed: 0.45,
      rayCount: 8,
      rayIntensity: 0.25,
      orbSize: 85,
      orbGlow: 0.45,
      orbPulse: true,
      hasShimmerRing: true,
      shimmerRingSize: 140,
      accentParticleCount: 15,
      textSize: 90,
      hasSubtitle: false,
      subtitle: ''
    },
    7: {
      duration: 4000,
      floatingParticleCount: 40,
      floatingParticleSpeed: 0.5,
      rayCount: 10,
      rayIntensity: 0.3,
      orbSize: 95,
      orbGlow: 0.5,
      orbPulse: true,
      hasShimmerRing: true,
      shimmerRingSize: 160,
      accentParticleCount: 20,
      textSize: 94,
      hasSubtitle: false,
      subtitle: ''
    },
    8: {
      duration: 4200,
      floatingParticleCount: 50,
      floatingParticleSpeed: 0.5,
      rayCount: 12,
      rayIntensity: 0.35,
      orbSize: 100,
      orbGlow: 0.55,
      orbPulse: true,
      hasShimmerRing: true,
      shimmerRingSize: 180,
      accentParticleCount: 25,
      textSize: 96,
      hasSubtitle: false,
      subtitle: ''
    },
    9: {
      duration: 4400,
      floatingParticleCount: 60,
      floatingParticleSpeed: 0.55,
      rayCount: 14,
      rayIntensity: 0.4,
      orbSize: 110,
      orbGlow: 0.6,
      orbPulse: true,
      hasShimmerRing: true,
      shimmerRingSize: 200,
      accentParticleCount: 30,
      textSize: 100,
      hasSubtitle: false,
      subtitle: ''
    },
    10: {
      duration: 5000,
      floatingParticleCount: 80,
      floatingParticleSpeed: 0.6,
      rayCount: 16,
      rayIntensity: 0.5,
      orbSize: 120,
      orbGlow: 0.7,
      orbPulse: true,
      hasShimmerRing: true,
      shimmerRingSize: 220,
      accentParticleCount: 40,
      textSize: 110,
      hasSubtitle: true,
      subtitle: 'Mastery'
    }
  }

  return configs[effectiveLevel] ?? configs[1]!
}

// ========================================
// Particle Types
// ========================================

interface FloatingParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  targetOpacity: number
  color: string
}

interface AccentParticle {
  x: number
  y: number
  vy: number
  size: number
  opacity: number
  delay: number
  color: string
}

// ========================================
// Main Animation Component
// ========================================

function LuxuryCanvas({
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
    const palette = getLevelPalette(newLevel)
    const centerX = width / 2
    const centerY = height / 2

    // Initialize floating particles
    const floatingParticles: FloatingParticle[] = Array.from(
      { length: config.floatingParticleCount },
      () => ({
        x: random(0, width),
        y: random(0, height),
        vx: random(-0.5, 0.5) * config.floatingParticleSpeed,
        vy: random(-0.3, -0.8) * config.floatingParticleSpeed,
        size: random(1, 3),
        opacity: 0,
        targetOpacity: random(0.2, 0.6),
        color: palette.particle[Math.floor(random(0, palette.particle.length))] || '#FFFFFF'
      })
    )

    // Initialize accent particles (rising from bottom)
    const accentParticles: AccentParticle[] = Array.from(
      { length: config.accentParticleCount },
      (_, i) => ({
        x: centerX + random(-200, 200),
        y: height + random(50, 200),
        vy: random(-1.5, -2.5),
        size: random(1.5, 3.5),
        opacity: 0,
        delay: i * 50 + random(0, 100),
        color: palette.particle[Math.floor(random(0, palette.particle.length))] || '#FFFFFF'
      })
    )

    // Shimmer ring state
    let shimmerAngle = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / config.duration) * 100)
      onProgress(progress)

      // Phase calculations
      const fadeIn = clamp(progress / 15, 0, 1)
      const fadeOut = progress > 85 ? clamp((100 - progress) / 15, 0, 1) : 1
      const masterOpacity = fadeIn * fadeOut

      // Clear and draw background gradient
      const bgGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, height) * 0.8
      )
      bgGrad.addColorStop(0, palette.bgGradient[0])
      bgGrad.addColorStop(1, palette.bgGradient[1])
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Subtle vignette
      const vignetteGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, height) * 0.7
      )
      vignetteGrad.addColorStop(0, 'transparent')
      vignetteGrad.addColorStop(0.6, 'transparent')
      vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${0.4 * masterOpacity})`)
      ctx.fillStyle = vignetteGrad
      ctx.fillRect(0, 0, width, height)

      // Draw light rays
      if (config.rayCount > 0 && progress > 10) {
        const rayProgress = easeOutQuart(clamp((progress - 10) / 40, 0, 1))
        const rayFade = progress > 70 ? (100 - progress) / 30 : 1

        ctx.save()
        ctx.translate(centerX, centerY)

        for (let i = 0; i < config.rayCount; i++) {
          const angle = (i / config.rayCount) * Math.PI * 2 - Math.PI / 2
          const rayLength = Math.max(width, height) * 0.8 * rayProgress
          const rayWidth = 0.02 + (i % 2) * 0.01

          const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * rayLength, Math.sin(angle) * rayLength)
          rayGrad.addColorStop(0, `${palette.glow}${toHexAlpha(config.rayIntensity * masterOpacity * rayFade)}`)
          rayGrad.addColorStop(0.3, `${palette.glow}${toHexAlpha(config.rayIntensity * 0.5 * masterOpacity * rayFade)}`)
          rayGrad.addColorStop(1, 'transparent')

          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(
            Math.cos(angle - rayWidth) * rayLength,
            Math.sin(angle - rayWidth) * rayLength
          )
          ctx.lineTo(
            Math.cos(angle + rayWidth) * rayLength,
            Math.sin(angle + rayWidth) * rayLength
          )
          ctx.closePath()
          ctx.fillStyle = rayGrad
          ctx.fill()
        }

        ctx.restore()
      }

      // Draw floating particles
      for (const p of floatingParticles) {
        // Slowly fade in
        p.opacity = lerp(p.opacity, p.targetOpacity * masterOpacity, 0.02)

        // Gentle movement
        p.x += p.vx
        p.y += p.vy

        // Wrap around
        if (p.y < -10) {
          p.y = height + 10
          p.x = random(0, width)
        }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        // Draw with soft glow
        const particleGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        particleGlow.addColorStop(0, `${p.color}${toHexAlpha(p.opacity)}`)
        particleGlow.addColorStop(0.5, `${p.color}${toHexAlpha(p.opacity * 0.3)}`)
        particleGlow.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = particleGlow
        ctx.fill()
      }

      // Draw accent particles (rising)
      if (progress > 20) {
        for (const p of accentParticles) {
          const particleProgress = clamp((elapsed - p.delay) / 2000, 0, 1)
          if (particleProgress <= 0) continue

          p.opacity = Math.sin(particleProgress * Math.PI) * masterOpacity
          p.y += p.vy * particleProgress

          if (p.opacity > 0.01) {
            const accentGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
            accentGlow.addColorStop(0, `${p.color}${toHexAlpha(p.opacity)}`)
            accentGlow.addColorStop(0.4, `${p.color}${toHexAlpha(p.opacity * 0.4)}`)
            accentGlow.addColorStop(1, 'transparent')

            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
            ctx.fillStyle = accentGlow
            ctx.fill()
          }
        }
      }

      // Draw central orb
      if (config.orbSize > 0 && progress > 15) {
        const orbProgress = easeOutQuart(clamp((progress - 15) / 30, 0, 1))
        const orbFade = progress > 75 ? (100 - progress) / 25 : 1
        let currentOrbSize = config.orbSize * orbProgress

        // Subtle pulse
        if (config.orbPulse) {
          currentOrbSize *= 1 + Math.sin(elapsed * 0.003) * 0.03
        }

        // Outer glow
        const outerGlow = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, currentOrbSize * 2.5
        )
        outerGlow.addColorStop(0, `${palette.glow}${toHexAlpha(config.orbGlow * 0.3 * orbFade * masterOpacity)}`)
        outerGlow.addColorStop(0.5, `${palette.glow}${toHexAlpha(config.orbGlow * 0.1 * orbFade * masterOpacity)}`)
        outerGlow.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(centerX, centerY, currentOrbSize * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = outerGlow
        ctx.fill()

        // Inner orb
        const innerGlow = ctx.createRadialGradient(
          centerX, centerY - currentOrbSize * 0.2, currentOrbSize * 0.1,
          centerX, centerY, currentOrbSize
        )
        innerGlow.addColorStop(0, `${palette.text}${toHexAlpha(0.15 * orbFade * masterOpacity)}`)
        innerGlow.addColorStop(0.5, `${palette.primary}${toHexAlpha(0.08 * orbFade * masterOpacity)}`)
        innerGlow.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(centerX, centerY, currentOrbSize, 0, Math.PI * 2)
        ctx.fillStyle = innerGlow
        ctx.fill()
      }

      // Draw shimmer ring
      if (config.hasShimmerRing && progress > 25) {
        const ringProgress = easeOutQuart(clamp((progress - 25) / 35, 0, 1))
        const ringFade = progress > 75 ? (100 - progress) / 25 : 1
        const ringSize = config.shimmerRingSize * ringProgress

        shimmerAngle += 0.008

        ctx.save()
        ctx.translate(centerX, centerY)

        // Draw ring with moving shimmer
        const shimmerCount = 60
        for (let i = 0; i < shimmerCount; i++) {
          const angle = (i / shimmerCount) * Math.PI * 2
          const shimmerIntensity = 0.3 + 0.7 * Math.pow(Math.sin(angle * 3 + shimmerAngle * 5), 2)
          const x = Math.cos(angle) * ringSize
          const y = Math.sin(angle) * ringSize

          const dotSize = 1.5 + shimmerIntensity
          const dotOpacity = (0.2 + shimmerIntensity * 0.4) * ringFade * masterOpacity

          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fillStyle = `${palette.primary}${toHexAlpha(dotOpacity)}`
          ctx.fill()
        }

        ctx.restore()
      }

      // Draw text
      if (progress > 20 && progress < 95) {
        const textProgress = easeOutQuart(clamp((progress - 20) / 30, 0, 1))
        const textFade = progress > 80 ? (95 - progress) / 15 : 1
        const textOpacity = textProgress * textFade * masterOpacity

        ctx.save()
        ctx.translate(centerX, centerY)

        // "LEVEL UP" text - elegant, thin font
        ctx.font = `100 16px "SF Pro Display", "Helvetica Neue", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.letterSpacing = '12px'
        ctx.fillStyle = `${palette.secondary}${toHexAlpha(textOpacity * 0.7)}`
        ctx.fillText('LEVEL UP', 0, -50)

        // Level number - large, elegant
        const numberScale = easeOutSine(clamp((textProgress - 0.2) / 0.6, 0, 1))
        ctx.font = `100 ${config.textSize * numberScale}px "SF Pro Display", "Helvetica Neue", system-ui, sans-serif`

        // Subtle text glow
        ctx.shadowColor = palette.glow
        ctx.shadowBlur = 30
        ctx.fillStyle = `${palette.text}${toHexAlpha(textOpacity)}`
        ctx.fillText(`${newLevel}`, 0, 35 * numberScale)

        // Subtitle for milestones
        if (config.hasSubtitle && textProgress > 0.5) {
          const subtitleOpacity = (textProgress - 0.5) * 2 * textFade * masterOpacity
          ctx.shadowBlur = 0
          ctx.font = `300 14px "SF Pro Display", "Helvetica Neue", system-ui, sans-serif`
          ctx.fillStyle = `${palette.primary}${toHexAlpha(subtitleOpacity * 0.8)}`
          ctx.letterSpacing = '8px'
          ctx.fillText(config.subtitle.toUpperCase(), 0, 70)
        }

        ctx.restore()
      }

      // Subtle horizontal line accents
      if (progress > 30 && progress < 85) {
        const lineProgress = easeInOutQuart(clamp((progress - 30) / 25, 0, 1))
        const lineFade = progress > 70 ? (85 - progress) / 15 : 1
        const lineWidth = 100 * lineProgress
        const lineOpacity = 0.3 * lineFade * masterOpacity

        ctx.strokeStyle = `${palette.primary}${toHexAlpha(lineOpacity)}`
        ctx.lineWidth = 1

        // Top line
        ctx.beginPath()
        ctx.moveTo(centerX - lineWidth, centerY - 80)
        ctx.lineTo(centerX + lineWidth, centerY - 80)
        ctx.stroke()

        // Bottom line
        ctx.beginPath()
        ctx.moveTo(centerX - lineWidth * 0.7, centerY + 90)
        ctx.lineTo(centerX + lineWidth * 0.7, centerY + 90)
        ctx.stroke()
      }

      if (progress < 100) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// Export Component
// ========================================

export function LuxuryLevelUpAnimation({
  newLevel,
  onComplete,
  standalone = false
}: LuxuryLevelUpAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [, setProgress] = useState(0)
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

  const handleProgress = useCallback((p: number) => {
    setProgress(p)
    if (p >= 100 && onComplete) {
      setTimeout(onComplete, 100)
    }
  }, [onComplete])

  const handleBackToDashboard = useCallback(() => {
    onComplete?.()
    router.push('/dashboard')
  }, [onComplete, router])

  if (!mounted) return null

  const content = (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto cursor-pointer"
      onClick={() => onComplete?.()}
      style={{ background: 'transparent' }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <LuxuryCanvas
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

export default LuxuryLevelUpAnimation
