'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

// ========================================
// Types
// ========================================

interface AuroraLevelUpAnimationProps {
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

// Smooth easing
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

// ========================================
// Aurora Color Palettes by Level
// ========================================

interface AuroraPalette {
  name: string
  subtitle: string
  // Aurora wave colors (bottom to top)
  waveColors: string[]
  // Background gradient
  bgTop: string
  bgBottom: string
  // Accent colors for particles/stars
  accentColors: string[]
  // Glow color
  glowColor: string
  // Text color
  textColor: string
}

function getAuroraPalette(level: number): AuroraPalette {
  const effectiveLevel = clamp(level, 1, 10)

  const palettes: Record<number, AuroraPalette> = {
    // Level 1-2: Calm Teal Aurora - 静かな始まり
    1: {
      name: 'Dawn',
      subtitle: '',
      waveColors: ['#0D9488', '#14B8A6', '#2DD4BF'],
      bgTop: '#020617',
      bgBottom: '#0C1222',
      accentColors: ['#5EEAD4', '#99F6E4'],
      glowColor: '#14B8A6',
      textColor: '#CCFBF1'
    },
    2: {
      name: 'Awakening',
      subtitle: '',
      waveColors: ['#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4'],
      bgTop: '#020617',
      bgBottom: '#0C1225',
      accentColors: ['#5EEAD4', '#99F6E4', '#A5F3FC'],
      glowColor: '#2DD4BF',
      textColor: '#CCFBF1'
    },
    // Level 3-4: Teal + Cyan Aurora - 成長
    3: {
      name: 'Rising',
      subtitle: '',
      waveColors: ['#0891B2', '#06B6D4', '#22D3EE', '#2DD4BF'],
      bgTop: '#020617',
      bgBottom: '#0C1428',
      accentColors: ['#67E8F9', '#A5F3FC', '#5EEAD4'],
      glowColor: '#22D3EE',
      textColor: '#CFFAFE'
    },
    4: {
      name: 'Ascending',
      subtitle: '',
      waveColors: ['#0891B2', '#06B6D4', '#22D3EE', '#2DD4BF', '#34D399'],
      bgTop: '#030712',
      bgBottom: '#0C1830',
      accentColors: ['#67E8F9', '#6EE7B7', '#A5F3FC'],
      glowColor: '#22D3EE',
      textColor: '#CFFAFE'
    },
    // Level 5: Milestone - Multi-color Aurora 突破
    5: {
      name: 'Breakthrough',
      subtitle: 'New Horizon',
      waveColors: ['#8B5CF6', '#A855F7', '#D946EF', '#22D3EE', '#2DD4BF'],
      bgTop: '#030712',
      bgBottom: '#1E1033',
      accentColors: ['#C4B5FD', '#F0ABFC', '#67E8F9', '#5EEAD4'],
      glowColor: '#A855F7',
      textColor: '#F5D0FE'
    },
    // Level 6-7: Vibrant Aurora - 躍進
    6: {
      name: 'Radiance',
      subtitle: '',
      waveColors: ['#7C3AED', '#8B5CF6', '#A855F7', '#EC4899', '#22D3EE'],
      bgTop: '#030712',
      bgBottom: '#1A0A2E',
      accentColors: ['#C4B5FD', '#F9A8D4', '#67E8F9'],
      glowColor: '#8B5CF6',
      textColor: '#E9D5FF'
    },
    7: {
      name: 'Brilliance',
      subtitle: '',
      waveColors: ['#6D28D9', '#7C3AED', '#A855F7', '#EC4899', '#F472B6', '#22D3EE'],
      bgTop: '#030712',
      bgBottom: '#1C0A30',
      accentColors: ['#DDD6FE', '#FBCFE8', '#A5F3FC', '#FDE68A'],
      glowColor: '#A855F7',
      textColor: '#F3E8FF'
    },
    // Level 8-9: Cosmic Aurora - 昇華
    8: {
      name: 'Celestial',
      subtitle: '',
      waveColors: ['#4C1D95', '#6D28D9', '#8B5CF6', '#EC4899', '#F472B6', '#FB923C'],
      bgTop: '#020617',
      bgBottom: '#1E0A35',
      accentColors: ['#E9D5FF', '#FBCFE8', '#FED7AA', '#FEF08A'],
      glowColor: '#C084FC',
      textColor: '#FAF5FF'
    },
    9: {
      name: 'Ethereal',
      subtitle: '',
      waveColors: ['#3B0764', '#5B21B6', '#7C3AED', '#DB2777', '#EC4899', '#F97316', '#FBBF24'],
      bgTop: '#020617',
      bgBottom: '#200A38',
      accentColors: ['#F3E8FF', '#FCE7F3', '#FFEDD5', '#FEF9C3'],
      glowColor: '#D946EF',
      textColor: '#FEFCE8'
    },
    // Level 10: Ultimate Cosmic Aurora - 超越
    10: {
      name: 'Transcendence',
      subtitle: 'Beyond Limits',
      waveColors: ['#1E1B4B', '#3730A3', '#6366F1', '#8B5CF6', '#D946EF', '#F472B6', '#FB923C', '#FBBF24'],
      bgTop: '#020617',
      bgBottom: '#1A0530',
      accentColors: ['#FFFFFF', '#FDF4FF', '#FEF3C7', '#ECFEFF', '#F0FDF4'],
      glowColor: '#E879F9',
      textColor: '#FFFFFF'
    }
  }

  return palettes[effectiveLevel] ?? palettes[1]!
}

// ========================================
// Level Configuration
// ========================================

interface LevelConfig {
  duration: number
  // Aurora waves
  waveCount: number
  waveAmplitude: number
  waveSpeed: number
  waveHeight: number  // How high aurora reaches (0-1)
  // Stars
  starCount: number
  hasShootingStars: boolean
  // Particles (rising light particles)
  particleCount: number
  particleSpeed: number
  // Central glow
  glowIntensity: number
  glowPulse: boolean
  // Light pillars
  hasPillars: boolean
  pillarCount: number
  // Cosmic dust
  hasCosmicDust: boolean
  // Text effects
  textSize: number
  hasGlowText: boolean
}

function getLevelConfig(level: number): LevelConfig {
  const effectiveLevel = clamp(level, 1, 10)

  const configs: Record<number, LevelConfig> = {
    1: {
      duration: 3200,
      waveCount: 2,
      waveAmplitude: 30,
      waveSpeed: 0.8,
      waveHeight: 0.35,
      starCount: 20,
      hasShootingStars: false,
      particleCount: 10,
      particleSpeed: 0.5,
      glowIntensity: 0.3,
      glowPulse: false,
      hasPillars: false,
      pillarCount: 0,
      hasCosmicDust: false,
      textSize: 80,
      hasGlowText: false
    },
    2: {
      duration: 3400,
      waveCount: 3,
      waveAmplitude: 35,
      waveSpeed: 0.9,
      waveHeight: 0.4,
      starCount: 30,
      hasShootingStars: false,
      particleCount: 15,
      particleSpeed: 0.6,
      glowIntensity: 0.35,
      glowPulse: false,
      hasPillars: false,
      pillarCount: 0,
      hasCosmicDust: false,
      textSize: 82,
      hasGlowText: false
    },
    3: {
      duration: 3600,
      waveCount: 3,
      waveAmplitude: 40,
      waveSpeed: 1.0,
      waveHeight: 0.45,
      starCount: 40,
      hasShootingStars: false,
      particleCount: 20,
      particleSpeed: 0.7,
      glowIntensity: 0.4,
      glowPulse: true,
      hasPillars: false,
      pillarCount: 0,
      hasCosmicDust: false,
      textSize: 85,
      hasGlowText: true
    },
    4: {
      duration: 3800,
      waveCount: 4,
      waveAmplitude: 45,
      waveSpeed: 1.0,
      waveHeight: 0.5,
      starCount: 50,
      hasShootingStars: true,
      particleCount: 25,
      particleSpeed: 0.8,
      glowIntensity: 0.45,
      glowPulse: true,
      hasPillars: true,
      pillarCount: 3,
      hasCosmicDust: false,
      textSize: 88,
      hasGlowText: true
    },
    5: {
      duration: 4200,
      waveCount: 5,
      waveAmplitude: 55,
      waveSpeed: 1.1,
      waveHeight: 0.55,
      starCount: 70,
      hasShootingStars: true,
      particleCount: 35,
      particleSpeed: 0.9,
      glowIntensity: 0.55,
      glowPulse: true,
      hasPillars: true,
      pillarCount: 5,
      hasCosmicDust: true,
      textSize: 92,
      hasGlowText: true
    },
    6: {
      duration: 4000,
      waveCount: 5,
      waveAmplitude: 50,
      waveSpeed: 1.1,
      waveHeight: 0.52,
      starCount: 60,
      hasShootingStars: true,
      particleCount: 30,
      particleSpeed: 0.85,
      glowIntensity: 0.5,
      glowPulse: true,
      hasPillars: true,
      pillarCount: 4,
      hasCosmicDust: true,
      textSize: 90,
      hasGlowText: true
    },
    7: {
      duration: 4200,
      waveCount: 6,
      waveAmplitude: 55,
      waveSpeed: 1.2,
      waveHeight: 0.58,
      starCount: 80,
      hasShootingStars: true,
      particleCount: 40,
      particleSpeed: 0.9,
      glowIntensity: 0.55,
      glowPulse: true,
      hasPillars: true,
      pillarCount: 5,
      hasCosmicDust: true,
      textSize: 94,
      hasGlowText: true
    },
    8: {
      duration: 4400,
      waveCount: 6,
      waveAmplitude: 60,
      waveSpeed: 1.2,
      waveHeight: 0.62,
      starCount: 100,
      hasShootingStars: true,
      particleCount: 50,
      particleSpeed: 1.0,
      glowIntensity: 0.6,
      glowPulse: true,
      hasPillars: true,
      pillarCount: 6,
      hasCosmicDust: true,
      textSize: 98,
      hasGlowText: true
    },
    9: {
      duration: 4600,
      waveCount: 7,
      waveAmplitude: 65,
      waveSpeed: 1.3,
      waveHeight: 0.68,
      starCount: 120,
      hasShootingStars: true,
      particleCount: 60,
      particleSpeed: 1.1,
      glowIntensity: 0.7,
      glowPulse: true,
      hasPillars: true,
      pillarCount: 7,
      hasCosmicDust: true,
      textSize: 102,
      hasGlowText: true
    },
    10: {
      duration: 5200,
      waveCount: 8,
      waveAmplitude: 75,
      waveSpeed: 1.4,
      waveHeight: 0.75,
      starCount: 150,
      hasShootingStars: true,
      particleCount: 80,
      particleSpeed: 1.2,
      glowIntensity: 0.85,
      glowPulse: true,
      hasPillars: true,
      pillarCount: 9,
      hasCosmicDust: true,
      textSize: 110,
      hasGlowText: true
    }
  }

  return configs[effectiveLevel] ?? configs[1]!
}

// ========================================
// Particle & Star Types
// ========================================

interface Star {
  x: number
  y: number
  size: number
  twinklePhase: number
  twinkleSpeed: number
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  life: number
  active: boolean
}

interface RisingParticle {
  x: number
  y: number
  vy: number
  size: number
  opacity: number
  color: string
  wobblePhase: number
  wobbleSpeed: number
}

interface CosmicDust {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

// ========================================
// Main Animation Component
// ========================================

function AuroraCanvas({
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
    const palette = getAuroraPalette(newLevel)
    const centerX = width / 2
    const centerY = height / 2

    // Initialize stars
    const stars: Star[] = Array.from({ length: config.starCount }, () => ({
      x: random(0, width),
      y: random(0, height * 0.7),
      size: random(0.5, 2),
      twinklePhase: random(0, Math.PI * 2),
      twinkleSpeed: random(0.02, 0.06)
    }))

    // Initialize shooting stars
    const shootingStars: ShootingStar[] = config.hasShootingStars
      ? Array.from({ length: 3 }, () => ({
          x: 0, y: 0, vx: 0, vy: 0, length: 0, life: 0, active: false
        }))
      : []

    // Initialize rising particles
    const particles: RisingParticle[] = Array.from({ length: config.particleCount }, () => ({
      x: random(0, width),
      y: height + random(0, 100),
      vy: random(-0.5, -1.5) * config.particleSpeed,
      size: random(1, 4),
      opacity: 0,
      color: palette.accentColors[Math.floor(random(0, palette.accentColors.length))] || '#FFFFFF',
      wobblePhase: random(0, Math.PI * 2),
      wobbleSpeed: random(0.02, 0.05)
    }))

    // Initialize cosmic dust
    const cosmicDust: CosmicDust[] = config.hasCosmicDust
      ? Array.from({ length: 40 }, () => ({
          x: random(0, width),
          y: random(0, height),
          vx: random(-0.2, 0.2),
          vy: random(-0.1, 0.1),
          size: random(0.5, 1.5),
          opacity: random(0.1, 0.3)
        }))
      : []

    // Aurora wave state
    let wavePhase = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / config.duration) * 100)
      onProgress(progress)

      // Phase calculations
      const fadeIn = easeOutQuart(clamp(progress / 15, 0, 1))
      const fadeOut = progress > 85 ? easeOutSine(clamp((100 - progress) / 15, 0, 1)) : 1
      const masterOpacity = fadeIn * fadeOut
      const auroraIntensity = easeOutQuart(clamp((progress - 5) / 30, 0, 1)) * fadeOut

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, palette.bgTop)
      bgGrad.addColorStop(1, palette.bgBottom)
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Draw stars
      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed
        const twinkle = 0.4 + 0.6 * Math.sin(star.twinklePhase)
        const starOpacity = twinkle * masterOpacity

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`
        ctx.fill()
      }

      // Cosmic dust
      if (config.hasCosmicDust) {
        for (const dust of cosmicDust) {
          dust.x += dust.vx
          dust.y += dust.vy

          // Wrap around
          if (dust.x < 0) dust.x = width
          if (dust.x > width) dust.x = 0
          if (dust.y < 0) dust.y = height
          if (dust.y > height) dust.y = 0

          ctx.beginPath()
          ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${dust.opacity * masterOpacity})`
          ctx.fill()
        }
      }

      // Draw aurora waves
      wavePhase += 0.015 * config.waveSpeed

      const auroraTop = height * (1 - config.waveHeight * auroraIntensity)

      for (let w = 0; w < config.waveCount; w++) {
        const waveOffset = w * 0.5
        const waveY = auroraTop + w * (height * 0.08)
        const color = palette.waveColors[w % palette.waveColors.length] || '#22D3EE'

        ctx.beginPath()
        ctx.moveTo(0, height)

        // Draw wave path
        for (let x = 0; x <= width; x += 3) {
          const waveFactor = Math.sin(x * 0.003 + wavePhase + waveOffset) * config.waveAmplitude
          const waveFactor2 = Math.sin(x * 0.007 + wavePhase * 1.3 + waveOffset) * (config.waveAmplitude * 0.5)
          const y = waveY + waveFactor + waveFactor2
          ctx.lineTo(x, y)
        }

        ctx.lineTo(width, height)
        ctx.closePath()

        // Aurora gradient fill
        const auroraGrad = ctx.createLinearGradient(0, waveY - config.waveAmplitude, 0, height)
        auroraGrad.addColorStop(0, `${color}${toHexAlpha(0.7 * auroraIntensity * masterOpacity)}`)
        auroraGrad.addColorStop(0.3, `${color}${toHexAlpha(0.4 * auroraIntensity * masterOpacity)}`)
        auroraGrad.addColorStop(0.7, `${color}${toHexAlpha(0.15 * auroraIntensity * masterOpacity)}`)
        auroraGrad.addColorStop(1, 'transparent')

        ctx.fillStyle = auroraGrad
        ctx.fill()
      }

      // Light pillars
      if (config.hasPillars && progress > 15) {
        const pillarProgress = easeOutQuart(clamp((progress - 15) / 25, 0, 1))
        const pillarFade = progress > 75 ? (100 - progress) / 25 : 1

        for (let i = 0; i < config.pillarCount; i++) {
          const pillarX = width * (0.15 + (i / (config.pillarCount - 1)) * 0.7)
          const pillarWidth = 30 + Math.sin(elapsed * 0.002 + i) * 10
          const pillarHeight = height * pillarProgress * 0.6

          const pillarGrad = ctx.createLinearGradient(pillarX, height, pillarX, height - pillarHeight)
          const pillarColor = palette.waveColors[i % palette.waveColors.length] || palette.glowColor
          pillarGrad.addColorStop(0, `${pillarColor}${toHexAlpha(0.3 * pillarFade * masterOpacity)}`)
          pillarGrad.addColorStop(0.5, `${pillarColor}${toHexAlpha(0.15 * pillarFade * masterOpacity)}`)
          pillarGrad.addColorStop(1, 'transparent')

          ctx.fillStyle = pillarGrad
          ctx.fillRect(pillarX - pillarWidth / 2, height - pillarHeight, pillarWidth, pillarHeight)
        }
      }

      // Shooting stars
      if (config.hasShootingStars && progress > 20 && progress < 80) {
        for (const ss of shootingStars) {
          if (!ss.active && Math.random() < 0.003) {
            ss.active = true
            ss.x = random(0, width * 0.7)
            ss.y = random(height * 0.1, height * 0.4)
            ss.vx = random(8, 15)
            ss.vy = random(3, 8)
            ss.length = random(50, 100)
            ss.life = 1
          }

          if (ss.active) {
            ss.x += ss.vx
            ss.y += ss.vy
            ss.life -= 0.02

            if (ss.life <= 0 || ss.x > width || ss.y > height) {
              ss.active = false
              continue
            }

            const ssGrad = ctx.createLinearGradient(
              ss.x, ss.y,
              ss.x - ss.vx * ss.length / 10, ss.y - ss.vy * ss.length / 10
            )
            ssGrad.addColorStop(0, `rgba(255, 255, 255, ${ss.life * masterOpacity})`)
            ssGrad.addColorStop(1, 'transparent')

            ctx.strokeStyle = ssGrad
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(ss.x, ss.y)
            ctx.lineTo(ss.x - ss.vx * ss.length / 10, ss.y - ss.vy * ss.length / 10)
            ctx.stroke()
          }
        }
      }

      // Rising particles
      for (const p of particles) {
        p.y += p.vy
        p.wobblePhase += p.wobbleSpeed
        p.x += Math.sin(p.wobblePhase) * 0.5

        // Reset when off screen
        if (p.y < -20) {
          p.y = height + random(0, 50)
          p.x = random(0, width)
        }

        // Fade in/out based on position
        const positionFade = 1 - Math.abs(p.y - height * 0.5) / (height * 0.5)
        p.opacity = lerp(p.opacity, Math.max(0, positionFade) * 0.8, 0.05)

        const particleGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
        particleGlow.addColorStop(0, `${p.color}${toHexAlpha(p.opacity * masterOpacity)}`)
        particleGlow.addColorStop(0.5, `${p.color}${toHexAlpha(p.opacity * 0.3 * masterOpacity)}`)
        particleGlow.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
        ctx.fillStyle = particleGlow
        ctx.fill()
      }

      // Central glow
      if (progress > 15) {
        const glowProgress = easeOutQuart(clamp((progress - 15) / 30, 0, 1))
        const glowFade = progress > 75 ? (100 - progress) / 25 : 1
        let intensity = config.glowIntensity * glowProgress * glowFade

        if (config.glowPulse) {
          intensity *= 0.85 + 0.15 * Math.sin(elapsed * 0.004)
        }

        const glowSize = 200 + config.glowIntensity * 100
        const glowGrad = ctx.createRadialGradient(centerX, centerY + 30, 0, centerX, centerY + 30, glowSize)
        glowGrad.addColorStop(0, `${palette.glowColor}${toHexAlpha(intensity * 0.4 * masterOpacity)}`)
        glowGrad.addColorStop(0.4, `${palette.glowColor}${toHexAlpha(intensity * 0.15 * masterOpacity)}`)
        glowGrad.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(centerX, centerY + 30, glowSize, 0, Math.PI * 2)
        ctx.fillStyle = glowGrad
        ctx.fill()
      }

      // Text rendering
      if (progress > 20 && progress < 95) {
        const textProgress = easeOutQuart(clamp((progress - 20) / 25, 0, 1))
        const textFade = progress > 80 ? (95 - progress) / 15 : 1
        const textOpacity = textProgress * textFade * masterOpacity

        ctx.save()
        ctx.translate(centerX, centerY)

        // Level name (e.g., "Dawn", "Transcendence")
        ctx.font = `300 14px "SF Pro Display", "Helvetica Neue", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.letterSpacing = '8px'
        ctx.fillStyle = `${palette.accentColors[0]}${toHexAlpha(textOpacity * 0.7)}`
        ctx.fillText(palette.name.toUpperCase(), 0, -55)

        // Level number
        const numberScale = easeOutSine(clamp((textProgress - 0.15) / 0.6, 0, 1))

        if (config.hasGlowText) {
          ctx.shadowColor = palette.glowColor
          ctx.shadowBlur = 40
        }

        ctx.font = `200 ${config.textSize * numberScale}px "SF Pro Display", "Helvetica Neue", system-ui, sans-serif`
        ctx.fillStyle = `${palette.textColor}${toHexAlpha(textOpacity)}`
        ctx.fillText(`${newLevel}`, 0, 30 * numberScale)

        // Subtitle for milestones
        if (palette.subtitle && textProgress > 0.5) {
          const subtitleOpacity = (textProgress - 0.5) * 2 * textFade * masterOpacity
          ctx.shadowBlur = 0
          ctx.font = `400 12px "SF Pro Display", "Helvetica Neue", system-ui, sans-serif`
          ctx.fillStyle = `${palette.accentColors[0]}${toHexAlpha(subtitleOpacity * 0.9)}`
          ctx.letterSpacing = '6px'
          ctx.fillText(palette.subtitle.toUpperCase(), 0, 65)
        }

        ctx.restore()
      }

      // Decorative lines
      if (progress > 30 && progress < 85) {
        const lineProgress = easeInOutSine(clamp((progress - 30) / 20, 0, 1))
        const lineFade = progress > 70 ? (85 - progress) / 15 : 1
        const lineWidth = 80 * lineProgress
        const lineOpacity = 0.4 * lineFade * masterOpacity

        ctx.strokeStyle = `${palette.accentColors[0]}${toHexAlpha(lineOpacity)}`
        ctx.lineWidth = 1

        // Top line
        ctx.beginPath()
        ctx.moveTo(centerX - lineWidth, centerY - 75)
        ctx.lineTo(centerX + lineWidth, centerY - 75)
        ctx.stroke()

        // Bottom line
        ctx.beginPath()
        ctx.moveTo(centerX - lineWidth * 0.6, centerY + 85)
        ctx.lineTo(centerX + lineWidth * 0.6, centerY + 85)
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

export function AuroraLevelUpAnimation({
  newLevel,
  onComplete,
  standalone = false
}: AuroraLevelUpAnimationProps) {
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
      <AuroraCanvas
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

export default AuroraLevelUpAnimation
