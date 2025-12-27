'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

// ========================================
// Types
// ========================================

interface MinimalProgressiveAnimationV2Props {
  newLevel: number
  onComplete?: (() => void) | undefined
  standalone?: boolean
}

// ========================================
// Utility Functions
// ========================================

const random = (min: number, max: number) => Math.random() * (max - min) + min
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1))
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const toHex = (n: number) => Math.floor(clamp(n, 0, 255)).toString(16).padStart(2, '0')
const toHexAlpha = (opacity: number) => toHex(opacity * 255)

// Easing functions
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)
const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const easeOutElastic = (t: number) => {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}
const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

// Color utilities
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : { r: 255, g: 255, b: 255 }
}

const lerpColor = (c1: string, c2: string, t: number) => {
  const rgb1 = hexToRgb(c1)
  const rgb2 = hexToRgb(c2)
  return `rgb(${lerp(rgb1.r, rgb2.r, t)}, ${lerp(rgb1.g, rgb2.g, t)}, ${lerp(rgb1.b, rgb2.b, t)})`
}

// ========================================
// Particle Types
// ========================================

interface BaseParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

interface CircleParticle extends BaseParticle {
  type: 'circle'
  size: number
  trail: { x: number; y: number }[]
  hasTrail: boolean
}

interface SparkleParticle extends BaseParticle {
  type: 'sparkle'
  size: number
  rotation: number
  rotationSpeed: number
  points: number
}

interface RingParticle extends BaseParticle {
  type: 'ring'
  radius: number
  maxRadius: number
  thickness: number
}

interface GlitterParticle extends BaseParticle {
  type: 'glitter'
  size: number
  flickerSpeed: number
  flickerPhase: number
}

interface StarParticle extends BaseParticle {
  type: 'star'
  size: number
  twinklePhase: number
  twinkleSpeed: number
}

type Particle = CircleParticle | SparkleParticle | RingParticle | GlitterParticle | StarParticle

// ========================================
// Level Configuration
// ========================================

interface LevelConfig {
  // Timing
  duration: number
  phases: {
    anticipation: number  // 0-20%: Build-up
    burst: number         // 20-40%: Main explosion
    reveal: number        // 40-70%: Text reveal
    celebration: number   // 70-90%: Celebration
    fadeOut: number       // 90-100%: Fade out
  }

  // Background
  bgColor: string
  bgGradient?: { color: string; position: number }[]

  // Particles
  particleCount: number
  particleTypes: ('circle' | 'sparkle' | 'ring' | 'glitter' | 'star')[]
  particleColors: string[]
  hasTrails: boolean
  trailLength: number

  // Burst effect
  burstWaves: number
  burstIntensity: number

  // Glow
  glowIntensity: number
  glowColor: string
  glowPulse: boolean
  bloomIntensity: number

  // Text
  textScale: number
  textGlow: boolean
  textShake: boolean
  letterByLetter: boolean

  // Special effects
  hasScreenShake: boolean
  screenShakeIntensity: number
  hasLensFlare: boolean
  hasVignette: boolean

  // Milestone bonuses (for level 5, 10, etc.)
  isMilestone: boolean
  milestoneColor?: string
}

function getLevelConfig(level: number): LevelConfig {
  const effectiveLevel = clamp(level, 1, 10)
  const isMilestone = level % 5 === 0

  // Base configuration that scales with level
  const baseConfig: LevelConfig = {
    duration: 2500 + effectiveLevel * 150,
    phases: {
      anticipation: 15,
      burst: 35,
      reveal: 65,
      celebration: 85,
      fadeOut: 100
    },
    bgColor: `rgba(${15 - effectiveLevel}, ${15 - effectiveLevel}, ${20 - effectiveLevel}, 0.97)`,
    particleCount: 10 + effectiveLevel * 8,
    particleTypes: ['circle'],
    particleColors: ['#FFFFFF'],
    hasTrails: false,
    trailLength: 0,
    burstWaves: 1,
    burstIntensity: 0.5,
    glowIntensity: 0,
    glowColor: '#FFFFFF',
    glowPulse: false,
    bloomIntensity: 0,
    textScale: 1,
    textGlow: false,
    textShake: false,
    letterByLetter: false,
    hasScreenShake: false,
    screenShakeIntensity: 0,
    hasLensFlare: false,
    hasVignette: false,
    isMilestone: false
  }

  const configs: Record<number, Partial<LevelConfig>> = {
    // Level 1: Ultra minimal - clean fade
    1: {
      duration: 2200,
      particleCount: 0,
      particleTypes: [],
      bgColor: 'rgba(18, 18, 22, 0.97)',
      textScale: 0.95
    },

    // Level 2: Simple circle + subtle particles
    2: {
      duration: 2400,
      particleCount: 12,
      particleTypes: ['circle'],
      particleColors: ['#FFFFFF', '#E8E8E8'],
      burstWaves: 1,
      burstIntensity: 0.4,
      textScale: 1.0
    },

    // Level 3: Floating sparkles
    3: {
      duration: 2600,
      particleCount: 20,
      particleTypes: ['circle', 'sparkle'],
      particleColors: ['#FFFFFF', '#E8E8E8', '#D0D0D0'],
      burstWaves: 1,
      burstIntensity: 0.5,
      hasTrails: true,
      trailLength: 3,
      textScale: 1.02
    },

    // Level 4: Multiple burst waves
    4: {
      duration: 2800,
      particleCount: 30,
      particleTypes: ['circle', 'sparkle'],
      particleColors: ['#FFFFFF', '#F0F0FF', '#E0E0F0'],
      burstWaves: 2,
      burstIntensity: 0.6,
      hasTrails: true,
      trailLength: 4,
      glowIntensity: 0.2,
      glowColor: '#E0E0FF',
      textScale: 1.05
    },

    // Level 5: MILESTONE - Blue glow celebration
    5: {
      duration: 3200,
      particleCount: 50,
      particleTypes: ['circle', 'sparkle', 'ring'],
      particleColors: ['#FFFFFF', '#A0C4FF', '#7EB5FF', '#5CA4FF'],
      burstWaves: 3,
      burstIntensity: 0.8,
      hasTrails: true,
      trailLength: 6,
      glowIntensity: 0.5,
      glowColor: '#5CA4FF',
      glowPulse: true,
      bloomIntensity: 0.3,
      textScale: 1.1,
      textGlow: true,
      hasScreenShake: true,
      screenShakeIntensity: 3,
      hasVignette: true,
      isMilestone: true,
      milestoneColor: '#5CA4FF'
    },

    // Level 6: Enhanced particles + glitter
    6: {
      duration: 3000,
      particleCount: 55,
      particleTypes: ['circle', 'sparkle', 'glitter'],
      particleColors: ['#FFFFFF', '#E0E8FF', '#C8D8FF', '#B0C8FF'],
      burstWaves: 2,
      burstIntensity: 0.7,
      hasTrails: true,
      trailLength: 5,
      glowIntensity: 0.4,
      glowColor: '#B0C8FF',
      glowPulse: true,
      bloomIntensity: 0.2,
      textScale: 1.08,
      textGlow: true,
      hasScreenShake: true,
      screenShakeIntensity: 2
    },

    // Level 7: Letter-by-letter reveal
    7: {
      duration: 3200,
      particleCount: 65,
      particleTypes: ['circle', 'sparkle', 'glitter', 'star'],
      particleColors: ['#FFFFFF', '#E0E8FF', '#C8D8FF', '#A8C0FF'],
      burstWaves: 3,
      burstIntensity: 0.75,
      hasTrails: true,
      trailLength: 6,
      glowIntensity: 0.5,
      glowColor: '#A8C0FF',
      glowPulse: true,
      bloomIntensity: 0.25,
      textScale: 1.1,
      textGlow: true,
      letterByLetter: true,
      hasScreenShake: true,
      screenShakeIntensity: 2.5
    },

    // Level 8: Stars + lens flare
    8: {
      duration: 3400,
      particleCount: 80,
      particleTypes: ['circle', 'sparkle', 'glitter', 'star'],
      particleColors: ['#FFFFFF', '#E8F0FF', '#D0E0FF', '#B8D0FF', '#A0C0FF'],
      burstWaves: 3,
      burstIntensity: 0.85,
      hasTrails: true,
      trailLength: 7,
      glowIntensity: 0.6,
      glowColor: '#A0C0FF',
      glowPulse: true,
      bloomIntensity: 0.35,
      textScale: 1.12,
      textGlow: true,
      letterByLetter: true,
      hasScreenShake: true,
      screenShakeIntensity: 3,
      hasLensFlare: true
    },

    // Level 9: Full effects
    9: {
      duration: 3600,
      particleCount: 100,
      particleTypes: ['circle', 'sparkle', 'ring', 'glitter', 'star'],
      particleColors: ['#FFFFFF', '#FFF8E0', '#FFE8A0', '#D0E0FF', '#B0D0FF'],
      burstWaves: 4,
      burstIntensity: 0.9,
      hasTrails: true,
      trailLength: 8,
      glowIntensity: 0.7,
      glowColor: '#FFE8A0',
      glowPulse: true,
      bloomIntensity: 0.4,
      textScale: 1.15,
      textGlow: true,
      textShake: true,
      letterByLetter: true,
      hasScreenShake: true,
      screenShakeIntensity: 4,
      hasLensFlare: true,
      hasVignette: true
    },

    // Level 10: ULTIMATE MILESTONE - Golden celebration
    10: {
      duration: 4200,
      bgGradient: [
        { color: 'rgba(25, 20, 10, 0.97)', position: 0 },
        { color: 'rgba(10, 8, 5, 0.97)', position: 1 }
      ],
      particleCount: 150,
      particleTypes: ['circle', 'sparkle', 'ring', 'glitter', 'star'],
      particleColors: ['#FFFFFF', '#FFF8E0', '#FFE080', '#FFD700', '#FFC000', '#FFB000'],
      burstWaves: 5,
      burstIntensity: 1.0,
      hasTrails: true,
      trailLength: 10,
      glowIntensity: 0.9,
      glowColor: '#FFD700',
      glowPulse: true,
      bloomIntensity: 0.6,
      textScale: 1.25,
      textGlow: true,
      textShake: true,
      letterByLetter: true,
      hasScreenShake: true,
      screenShakeIntensity: 5,
      hasLensFlare: true,
      hasVignette: true,
      isMilestone: true,
      milestoneColor: '#FFD700'
    }
  }

  return { ...baseConfig, ...configs[effectiveLevel] }
}

// ========================================
// Drawing Functions
// ========================================

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, points: number, rotation: number, color: string, opacity: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = `${color}${toHexAlpha(opacity)}`
  ctx.beginPath()

  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2
    const r = i % 2 === 0 ? size : size * 0.35
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }

  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
  // Draw a 4-point star with glow
  ctx.save()
  ctx.translate(x, y)

  // Outer glow
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2)
  gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.5})`)
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.2})`)
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(0, 0, size * 2, 0, Math.PI * 2)
  ctx.fill()

  // Core
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Spikes
  ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`
  ctx.lineWidth = size * 0.15
  ctx.lineCap = 'round'

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
    ctx.stroke()
  }

  ctx.restore()
}

function drawLensFlare(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number, time: number) {
  const flareColors = ['#FFFFFF', '#FFF8E0', '#E0F0FF', '#FFE8F0']
  const flickerIntensity = 0.8 + 0.2 * Math.sin(time * 0.005)

  // Main flare
  const mainGradient = ctx.createRadialGradient(x, y, 0, x, y, 150 * intensity)
  mainGradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 * flickerIntensity})`)
  mainGradient.addColorStop(0.2, `rgba(255, 255, 240, ${0.2 * flickerIntensity})`)
  mainGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = mainGradient
  ctx.beginPath()
  ctx.arc(x, y, 150 * intensity, 0, Math.PI * 2)
  ctx.fill()

  // Secondary flares along diagonal
  for (let i = 0; i < 4; i++) {
    const dist = (i + 1) * 80 * intensity
    const flareSize = (4 - i) * 15 * intensity
    const flareX = x - dist * 0.7
    const flareY = y - dist * 0.7
    const color = flareColors[i] || '#FFFFFF'

    const flareGradient = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, flareSize)
    flareGradient.addColorStop(0, `${color}${toHexAlpha(0.3 * flickerIntensity)}`)
    flareGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = flareGradient
    ctx.beginPath()
    ctx.arc(flareX, flareY, flareSize, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ========================================
// Main Animation Component
// ========================================

function AnimationCanvas({
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
  const particlesRef = useRef<Particle[]>([])
  const shakeOffsetRef = useRef({ x: 0, y: 0 })

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

    // Initialize burst waves
    const burstWavesTriggered = new Array(config.burstWaves).fill(false)

    // Background stars for higher levels
    const bgStars = newLevel >= 7 ? Array.from({ length: 50 }, () => ({
      x: random(0, width),
      y: random(0, height),
      size: random(0.5, 1.5),
      twinkle: random(0, Math.PI * 2),
      speed: random(0.02, 0.05)
    })) : []

    const createParticle = (burstIndex: number): Particle | null => {
      const types = config.particleTypes
      if (types.length === 0) return null

      const type = types[randomInt(0, types.length - 1)] || 'circle'
      const angle = random(0, Math.PI * 2)
      const speed = random(3, 12) * config.burstIntensity * (1 - burstIndex * 0.15)
      const color = config.particleColors[randomInt(0, config.particleColors.length - 1)] || '#FFFFFF'

      const base: BaseParticle = {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: random(80, 140),
        color
      }

      switch (type) {
        case 'circle':
          return {
            ...base,
            type: 'circle',
            size: random(2, 6),
            trail: [],
            hasTrail: config.hasTrails && Math.random() > 0.5
          }
        case 'sparkle':
          return {
            ...base,
            type: 'sparkle',
            size: random(4, 10),
            rotation: random(0, Math.PI * 2),
            rotationSpeed: random(-0.1, 0.1),
            points: randomInt(4, 6)
          }
        case 'ring':
          return {
            ...base,
            type: 'ring',
            radius: 0,
            maxRadius: random(100, 250),
            thickness: random(2, 4)
          }
        case 'glitter':
          return {
            ...base,
            type: 'glitter',
            size: random(1, 3),
            flickerSpeed: random(0.1, 0.3),
            flickerPhase: random(0, Math.PI * 2)
          }
        case 'star':
          return {
            ...base,
            type: 'star',
            size: random(3, 8),
            twinklePhase: random(0, Math.PI * 2),
            twinkleSpeed: random(0.05, 0.1)
          }
        default:
          return null
      }
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / config.duration) * 100)
      onProgress(progress)

      const { phases } = config
      const fadeOut = progress > phases.celebration ? (phases.fadeOut - progress) / (phases.fadeOut - phases.celebration) : 1

      // Screen shake
      if (config.hasScreenShake && progress > phases.burst - 10 && progress < phases.reveal) {
        const shakeProgress = (progress - (phases.burst - 10)) / 20
        const shakeIntensity = config.screenShakeIntensity * Math.sin(shakeProgress * Math.PI) * fadeOut
        shakeOffsetRef.current = {
          x: random(-shakeIntensity, shakeIntensity),
          y: random(-shakeIntensity, shakeIntensity)
        }
      } else {
        shakeOffsetRef.current = { x: 0, y: 0 }
      }

      ctx.save()
      ctx.translate(shakeOffsetRef.current.x, shakeOffsetRef.current.y)

      // Background
      if (config.bgGradient) {
        const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.8)
        config.bgGradient.forEach(stop => {
          bgGrad.addColorStop(stop.position, stop.color.replace('0.97', `${0.97 * fadeOut}`))
        })
        ctx.fillStyle = bgGrad
      } else {
        ctx.fillStyle = config.bgColor.replace('0.97', `${0.97 * fadeOut}`)
      }
      ctx.fillRect(-10, -10, width + 20, height + 20)

      // Background stars
      if (bgStars.length > 0) {
        for (const star of bgStars) {
          star.twinkle += star.speed
          const twinkleOpacity = 0.3 + 0.4 * Math.sin(star.twinkle)
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity * fadeOut})`
          ctx.fill()
        }
      }

      // Vignette
      if (config.hasVignette && fadeOut > 0) {
        const vignetteGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7)
        vignetteGrad.addColorStop(0, 'transparent')
        vignetteGrad.addColorStop(0.7, 'transparent')
        vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${0.5 * fadeOut})`)
        ctx.fillStyle = vignetteGrad
        ctx.fillRect(-10, -10, width + 20, height + 20)
      }

      // Trigger burst waves
      for (let i = 0; i < config.burstWaves; i++) {
        const triggerProgress = phases.anticipation + (i * 8)
        if (progress > triggerProgress && !burstWavesTriggered[i]) {
          burstWavesTriggered[i] = true
          const particlesPerWave = Math.floor(config.particleCount / config.burstWaves)
          for (let j = 0; j < particlesPerWave; j++) {
            const p = createParticle(i)
            if (p) particlesRef.current.push(p)
          }
        }
      }

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        if (!p) continue

        // Physics
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08 // Gravity
        p.vx *= 0.985
        p.vy *= 0.985
        p.life -= 1 / p.maxLife

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1)
          continue
        }

        const opacity = easeOutQuint(clamp(p.life, 0, 1)) * fadeOut

        switch (p.type) {
          case 'circle': {
            // Trail
            if (p.hasTrail) {
              p.trail.unshift({ x: p.x, y: p.y })
              if (p.trail.length > config.trailLength) p.trail.pop()

              for (let t = 0; t < p.trail.length; t++) {
                const trailPoint = p.trail[t]
                if (!trailPoint) continue
                const trailOpacity = opacity * (1 - t / p.trail.length) * 0.5
                ctx.beginPath()
                ctx.arc(trailPoint.x, trailPoint.y, p.size * (1 - t / p.trail.length * 0.5), 0, Math.PI * 2)
                ctx.fillStyle = `${p.color}${toHexAlpha(trailOpacity)}`
                ctx.fill()
              }
            }

            // Main particle
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = `${p.color}${toHexAlpha(opacity)}`
            ctx.fill()
            break
          }

          case 'sparkle': {
            p.rotation += p.rotationSpeed
            drawSparkle(ctx, p.x, p.y, p.size, p.points, p.rotation, p.color, opacity)
            break
          }

          case 'ring': {
            p.radius += (p.maxRadius - p.radius) * 0.08
            const ringOpacity = opacity * (1 - p.radius / p.maxRadius)
            ctx.beginPath()
            ctx.arc(centerX, centerY, p.radius, 0, Math.PI * 2)
            ctx.strokeStyle = `${p.color}${toHexAlpha(ringOpacity)}`
            ctx.lineWidth = p.thickness
            ctx.stroke()
            break
          }

          case 'glitter': {
            p.flickerPhase += p.flickerSpeed
            const flicker = 0.3 + 0.7 * Math.abs(Math.sin(p.flickerPhase))
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = `${p.color}${toHexAlpha(opacity * flicker)}`
            ctx.fill()
            break
          }

          case 'star': {
            p.twinklePhase += p.twinkleSpeed
            const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase)
            drawStar(ctx, p.x, p.y, p.size * twinkle, opacity)
            break
          }
        }
      }

      // Central glow
      if (config.glowIntensity > 0 && progress > phases.anticipation) {
        const glowProgress = clamp((progress - phases.anticipation) / 30, 0, 1)
        let glowIntensity = config.glowIntensity * easeOutExpo(glowProgress) * fadeOut

        if (config.glowPulse) {
          glowIntensity *= 0.85 + 0.15 * Math.sin(elapsed * 0.008)
        }

        // Bloom effect
        if (config.bloomIntensity > 0) {
          const bloomSize = 300 * config.bloomIntensity
          const bloomGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, bloomSize)
          bloomGrad.addColorStop(0, `${config.glowColor}${toHexAlpha(glowIntensity * 0.3)}`)
          bloomGrad.addColorStop(0.4, `${config.glowColor}${toHexAlpha(glowIntensity * 0.15)}`)
          bloomGrad.addColorStop(1, 'transparent')
          ctx.fillStyle = bloomGrad
          ctx.beginPath()
          ctx.arc(centerX, centerY, bloomSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Main glow
        const glowSize = 150 + config.glowIntensity * 50
        const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize)
        glowGrad.addColorStop(0, `${config.glowColor}${toHexAlpha(glowIntensity * 0.5)}`)
        glowGrad.addColorStop(0.5, `${config.glowColor}${toHexAlpha(glowIntensity * 0.2)}`)
        glowGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      // Lens flare
      if (config.hasLensFlare && progress > phases.burst && progress < phases.celebration) {
        const flareProgress = (progress - phases.burst) / (phases.celebration - phases.burst)
        const flareIntensity = Math.sin(flareProgress * Math.PI) * fadeOut
        drawLensFlare(ctx, centerX, centerY, flareIntensity, elapsed)
      }

      // Text rendering
      if (progress > phases.anticipation + 5 && progress < phases.fadeOut - 5) {
        const textProgress = clamp((progress - phases.anticipation - 5) / 25, 0, 1)
        const textOpacity = progress > phases.celebration ? fadeOut : easeOutExpo(textProgress)
        const scale = easeOutBack(textProgress) * config.textScale

        ctx.save()
        ctx.translate(centerX, centerY)

        // Text shake for high levels
        if (config.textShake && progress > phases.burst && progress < phases.reveal) {
          const shakeAmount = 2 * Math.sin(elapsed * 0.05)
          ctx.translate(shakeAmount, shakeAmount * 0.5)
        }

        ctx.scale(scale, scale)

        // Text glow
        if (config.textGlow) {
          ctx.shadowColor = config.isMilestone ? config.milestoneColor || config.glowColor : config.glowColor
          ctx.shadowBlur = 30 + config.glowIntensity * 20
        }

        // "LEVEL UP" text
        const levelUpText = 'LEVEL UP'
        ctx.font = '300 20px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.letterSpacing = '6px'

        if (config.letterByLetter) {
          // Letter by letter animation
          const charDelay = 3 // progress units per character
          for (let i = 0; i < levelUpText.length; i++) {
            const charProgress = clamp((textProgress * 100 - i * charDelay) / 20, 0, 1)
            if (charProgress > 0) {
              const charY = -45 - (1 - easeOutBack(charProgress)) * 20
              const charOpacity = textOpacity * charProgress
              ctx.fillStyle = `rgba(150, 150, 150, ${charOpacity * 0.9})`

              // Calculate x position for each character
              const metrics = ctx.measureText(levelUpText)
              const charWidth = metrics.width / levelUpText.length
              const startX = -metrics.width / 2 + charWidth / 2
              const charX = startX + i * charWidth

              ctx.fillText(levelUpText[i]!, charX, charY)
            }
          }
        } else {
          ctx.fillStyle = `rgba(150, 150, 150, ${textOpacity * 0.9})`
          ctx.fillText(levelUpText, 0, -45)
        }

        // Level number
        const levelNumProgress = clamp((textProgress - 0.2) / 0.6, 0, 1)
        const levelScale = easeOutElastic(levelNumProgress)

        ctx.save()
        ctx.scale(levelScale, levelScale)

        ctx.font = `200 ${config.isMilestone ? 100 : 90}px system-ui, -apple-system, sans-serif`

        // Milestone special color
        if (config.isMilestone && config.milestoneColor) {
          ctx.shadowColor = config.milestoneColor
          ctx.shadowBlur = 50
          ctx.fillStyle = `${config.milestoneColor}${toHexAlpha(textOpacity)}`
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`
        }

        ctx.fillText(`${newLevel}`, 0, 40)

        // Milestone badge
        if (config.isMilestone && levelNumProgress > 0.5) {
          const badgeOpacity = (levelNumProgress - 0.5) * 2 * textOpacity
          ctx.font = '600 14px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = `${config.milestoneColor}${toHexAlpha(badgeOpacity)}`
          ctx.fillText('★ MILESTONE ★', 0, 80)
        }

        ctx.restore()
        ctx.restore()
      }

      ctx.restore()

      if (progress < 100) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
      particlesRef.current = []
    }
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// Export Component
// ========================================

export function MinimalProgressiveAnimationV2({
  newLevel,
  onComplete,
  standalone = false
}: MinimalProgressiveAnimationV2Props) {
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
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <AnimationCanvas
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

export default MinimalProgressiveAnimationV2
