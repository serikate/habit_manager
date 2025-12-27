'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MinimalProgressiveAnimation } from './MinimalProgressiveAnimation'
import { MinimalProgressiveAnimationV2 } from './MinimalProgressiveAnimationV2'
import { LuxuryLevelUpAnimation } from './LuxuryLevelUpAnimation'
import { AuroraLevelUpAnimation as AuroraProgressiveAnimation } from './AuroraLevelUpAnimation'

// ========================================
// Types
// ========================================

export type LevelUpAnimationVersion = 'gold' | 'aurora' | 'epic' | 'minimal' | 'rpg' | 'cosmic' | 'minimal-progressive' | 'progressive-v2' | 'luxury' | 'aurora-progressive'

interface LevelUpAnimationProps {
  newLevel: number
  onComplete?: () => void
  version?: LevelUpAnimationVersion
  standalone?: boolean // For preview mode
}

// ========================================
// Utility Functions
// ========================================

const random = (min: number, max: number) => Math.random() * (max - min) + min
const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T
const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5)
const easeOutBack = (t: number): number => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const clamp = (val: number, min: number, max: number): number => Math.min(max, Math.max(min, val))
const toHexAlpha = (opacity: number): string => Math.floor(clamp(opacity, 0, 1) * 255).toString(16).padStart(2, '0')

// ========================================
// VERSION: GOLD (ゴールド爆発)
// ========================================

function GoldAnimation({
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

  interface Particle {
    x: number; y: number; vx: number; vy: number
    life: number; maxLife: number; color: string; size: number
    rotation: number; rotationSpeed: number
  }

  const particlesRef = useRef<Particle[]>([])
  const COLORS = ['#FFD700', '#FFC107', '#FFEB3B', '#FFF176', '#FFE082', '#FFFFFF']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    startTimeRef.current = performance.now()

    // Initial burst of particles
    const centerX = width / 2
    const centerY = height / 2
    for (let i = 0; i < 150; i++) {
      const angle = random(0, Math.PI * 2)
      const speed = random(3, 15)
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: random(60, 120),
        color: randomChoice(COLORS),
        size: random(2, 8),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.1, 0.1)
      })
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 3000) * 100)
      onProgress(progress)

      // Background with golden gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      const bgOpacity = progress < 80 ? 0.95 : 0.95 * (1 - (progress - 80) / 20)
      gradient.addColorStop(0, `rgba(40, 30, 10, ${bgOpacity})`)
      gradient.addColorStop(1, `rgba(10, 5, 0, ${bgOpacity})`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        if (p.life <= 0) return false
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15 // gravity
        p.vx *= 0.98
        p.vy *= 0.98
        p.life -= 1 / p.maxLife
        p.rotation += p.rotationSpeed

        const op = easeOutQuint(clamp(p.life, 0, 1))
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = `${p.color}${toHexAlpha(op)}`

        // Draw sparkle shape
        ctx.beginPath()
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * Math.PI * 2
          const r = j % 2 === 0 ? p.size : p.size * 0.4
          if (j === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        return true
      })

      // Draw level text with glow
      if (progress > 10 && progress < 90) {
        const textProgress = clamp((progress - 10) / 30, 0, 1)
        const scale = easeOutBack(textProgress)
        const textOpacity = progress > 70 ? (90 - progress) / 20 : 1

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.scale(scale, scale)

        // Glow effect
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 50

        // "LEVEL UP" text
        ctx.font = 'bold 32px sans-serif'
        ctx.fillStyle = `rgba(255, 215, 0, ${textOpacity})`
        ctx.textAlign = 'center'
        ctx.fillText('LEVEL UP!', 0, -50)

        // Level number
        ctx.font = 'bold 120px sans-serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`
        ctx.fillText(`${newLevel}`, 0, 40)

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// VERSION: AURORA (オーロラ)
// ========================================

function AuroraLevelUpAnimation({
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
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    startTimeRef.current = performance.now()

    const waves = Array.from({ length: 5 }, (_, i) => ({
      y: height * 0.3 + i * 50,
      amplitude: 40 + i * 15,
      frequency: 0.003 + i * 0.0008,
      speed: 0.03 + i * 0.008,
      phase: random(0, Math.PI * 2),
      color: ['#2DD4BF', '#22D3EE', '#A855F7', '#EC4899', '#F59E0B'][i] ?? '#2DD4BF'
    }))

    const orbs = Array.from({ length: 10 }, () => ({
      x: random(0, width),
      y: random(height * 0.2, height * 0.8),
      size: random(10, 30),
      color: randomChoice(['#2DD4BF', '#22D3EE', '#A855F7', '#EC4899']),
      phase: random(0, Math.PI * 2),
      speed: random(0.02, 0.05)
    }))

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 3500) * 100)
      onProgress(progress)

      const bgOpacity = progress < 80 ? 1 : 1 - (progress - 80) / 20
      ctx.fillStyle = `rgba(12, 10, 29, ${bgOpacity})`
      ctx.fillRect(0, 0, width, height)

      // Draw waves
      for (const wave of waves) {
        wave.phase += wave.speed
        ctx.beginPath()
        ctx.moveTo(0, height)
        for (let x = 0; x <= width; x += 5) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height)
        ctx.closePath()

        const waveGradient = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, height)
        waveGradient.addColorStop(0, `${wave.color}${toHexAlpha(0.6 * bgOpacity)}`)
        waveGradient.addColorStop(1, `${wave.color}${toHexAlpha(0.1 * bgOpacity)}`)
        ctx.fillStyle = waveGradient
        ctx.fill()
      }

      // Draw orbs
      for (const orb of orbs) {
        orb.phase += orb.speed
        const orbOpacity = (0.5 + 0.5 * Math.sin(orb.phase)) * bgOpacity
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size)
        grad.addColorStop(0, `${orb.color}${toHexAlpha(orbOpacity)}`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Level text
      if (progress > 15 && progress < 90) {
        const textProgress = clamp((progress - 15) / 25, 0, 1)
        const scale = easeOutBack(textProgress)
        const textOpacity = progress > 70 ? (90 - progress) / 20 : 1

        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.scale(scale, scale)

        ctx.shadowColor = '#2DD4BF'
        ctx.shadowBlur = 40

        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = `rgba(45, 212, 191, ${textOpacity})`
        ctx.textAlign = 'center'
        ctx.fillText('LEVEL UP!', 0, -45)

        ctx.shadowColor = '#FFFFFF'
        ctx.font = 'bold 100px sans-serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`
        ctx.fillText(`${newLevel}`, 0, 40)

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// VERSION: EPIC (エピック・ゲーミング)
// ========================================

function EpicAnimation({
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
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    startTimeRef.current = performance.now()

    const rings: { radius: number; maxRadius: number; opacity: number; color: string }[] = []
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = []

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 3000) * 100)
      onProgress(progress)

      const bgOpacity = progress < 80 ? 0.95 : 0.95 * (1 - (progress - 80) / 20)
      ctx.fillStyle = `rgba(5, 0, 20, ${bgOpacity})`
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2

      // Add shockwave rings at intervals
      if (progress > 20 && progress < 60 && rings.length < 5) {
        const lastRing = rings[rings.length - 1]
        if (rings.length === 0 || (lastRing && lastRing.radius > 100)) {
          rings.push({
            radius: 0,
            maxRadius: Math.max(width, height),
            opacity: 1,
            color: randomChoice(['#8B5CF6', '#EC4899', '#06B6D4'])
          })
        }
      }

      // Update and draw rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]
        if (!ring) continue
        ring.radius += 15
        ring.opacity = 1 - (ring.radius / ring.maxRadius)

        if (ring.opacity <= 0) {
          rings.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${ring.color}${toHexAlpha(ring.opacity * 0.8)}`
        ctx.lineWidth = 4
        ctx.stroke()
      }

      // Add particles
      if (progress > 10 && progress < 70 && particles.length < 100) {
        for (let i = 0; i < 3; i++) {
          const angle = random(0, Math.PI * 2)
          particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * random(2, 8),
            vy: Math.sin(angle) * random(2, 8),
            life: 1,
            color: randomChoice(['#8B5CF6', '#EC4899', '#06B6D4', '#FFFFFF']),
            size: random(2, 5)
          })
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.015

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${toHexAlpha(p.life)}`
        ctx.fill()
      }

      // Level text with dramatic entrance
      if (progress > 25 && progress < 90) {
        const textProgress = clamp((progress - 25) / 20, 0, 1)
        const scale = easeOutBack(textProgress)
        const textOpacity = progress > 70 ? (90 - progress) / 20 : 1

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.scale(scale, scale)

        // Multiple glow layers
        for (let i = 3; i >= 0; i--) {
          ctx.shadowColor = '#8B5CF6'
          ctx.shadowBlur = 20 + i * 15
        }

        ctx.font = 'bold 36px sans-serif'
        ctx.fillStyle = `rgba(139, 92, 246, ${textOpacity})`
        ctx.textAlign = 'center'
        ctx.fillText('LEVEL UP!', 0, -55)

        ctx.shadowColor = '#FFFFFF'
        ctx.font = 'bold 130px sans-serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`
        ctx.fillText(`${newLevel}`, 0, 50)

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// VERSION: MINIMAL (ミニマル)
// ========================================

function MinimalAnimation({
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
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 2500) * 100)
      onProgress(progress)

      const centerX = width / 2
      const centerY = height / 2

      // Clean white/black background
      const bgOpacity = progress < 80 ? 0.97 : 0.97 * (1 - (progress - 80) / 20)
      ctx.fillStyle = `rgba(15, 15, 15, ${bgOpacity})`
      ctx.fillRect(0, 0, width, height)

      // Simple circle expand
      if (progress > 5 && progress < 85) {
        const circleProgress = clamp((progress - 5) / 40, 0, 1)
        const radius = easeOutExpo(circleProgress) * 150
        const circleOpacity = progress > 60 ? (85 - progress) / 25 : 0.3

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${circleOpacity})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Text
      if (progress > 10 && progress < 90) {
        const textProgress = clamp((progress - 10) / 25, 0, 1)
        const textOpacity = progress > 70 ? (90 - progress) / 20 : easeOutExpo(textProgress)

        ctx.save()
        ctx.translate(centerX, centerY)

        ctx.font = '300 18px sans-serif'
        ctx.fillStyle = `rgba(150, 150, 150, ${textOpacity})`
        ctx.textAlign = 'center'
        ctx.letterSpacing = '8px'
        ctx.fillText('L E V E L  U P', 0, -40)

        ctx.font = '200 90px sans-serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`
        ctx.fillText(`${newLevel}`, 0, 35)

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// VERSION: RPG (クラシックRPG)
// ========================================

function RPGAnimation({
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
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    startTimeRef.current = performance.now()

    const sparkles: { x: number; y: number; life: number; maxLife: number; size: number }[] = []

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 3500) * 100)
      onProgress(progress)

      const centerX = width / 2
      const centerY = height / 2

      // Dark blue RPG background
      const bgOpacity = progress < 80 ? 1 : 1 - (progress - 80) / 20
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7)
      bgGradient.addColorStop(0, `rgba(20, 30, 60, ${bgOpacity})`)
      bgGradient.addColorStop(1, `rgba(5, 10, 25, ${bgOpacity})`)
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Rising sparkles
      if (progress > 5 && progress < 75) {
        for (let i = 0; i < 2; i++) {
          sparkles.push({
            x: centerX + random(-150, 150),
            y: height + 20,
            life: 1,
            maxLife: random(100, 150),
            size: random(2, 5)
          })
        }
      }

      // Update sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i]
        if (!s) continue
        s.y -= 3
        s.life -= 1 / s.maxLife

        if (s.life <= 0 || s.y < 0) {
          sparkles.splice(i, 1)
          continue
        }

        const op = Math.sin(s.life * Math.PI)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 150, ${op})`
        ctx.fill()
      }

      // Light pillar
      if (progress > 15 && progress < 85) {
        const pillarOpacity = progress > 65 ? (85 - progress) / 20 : clamp((progress - 15) / 20, 0, 0.5)
        const pillarGradient = ctx.createLinearGradient(centerX, 0, centerX, height)
        pillarGradient.addColorStop(0, `rgba(255, 255, 200, 0)`)
        pillarGradient.addColorStop(0.3, `rgba(255, 255, 200, ${pillarOpacity})`)
        pillarGradient.addColorStop(0.7, `rgba(255, 255, 200, ${pillarOpacity})`)
        pillarGradient.addColorStop(1, `rgba(255, 255, 200, 0)`)

        ctx.fillStyle = pillarGradient
        ctx.fillRect(centerX - 80, 0, 160, height)
      }

      // Text with RPG style
      if (progress > 20 && progress < 90) {
        const textProgress = clamp((progress - 20) / 25, 0, 1)
        const yOffset = (1 - easeOutExpo(textProgress)) * 50
        const textOpacity = progress > 70 ? (90 - progress) / 20 : easeOutExpo(textProgress)

        ctx.save()
        ctx.translate(centerX, centerY + yOffset)

        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 30

        ctx.font = 'bold 28px serif'
        ctx.fillStyle = `rgba(255, 215, 100, ${textOpacity})`
        ctx.textAlign = 'center'
        ctx.fillText('LEVEL UP!', 0, -50)

        ctx.font = 'bold 110px serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`
        ctx.fillText(`${newLevel}`, 0, 45)

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// VERSION: COSMIC (コズミック)
// ========================================

function CosmicAnimation({
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
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    startTimeRef.current = performance.now()

    const stars = Array.from({ length: 200 }, () => ({
      x: random(0, width),
      y: random(0, height),
      size: random(0.5, 2.5),
      speed: random(0.5, 3)
    }))

    const nebula = Array.from({ length: 5 }, () => ({
      x: random(0, width),
      y: random(0, height),
      size: random(100, 300),
      color: randomChoice(['#4C1D95', '#7C3AED', '#EC4899', '#06B6D4']),
      rotation: random(0, Math.PI * 2)
    }))

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 3500) * 100)
      onProgress(progress)

      const centerX = width / 2
      const centerY = height / 2

      // Deep space background
      const bgOpacity = progress < 80 ? 1 : 1 - (progress - 80) / 20
      ctx.fillStyle = `rgba(5, 2, 15, ${bgOpacity})`
      ctx.fillRect(0, 0, width, height)

      // Nebula clouds
      for (const n of nebula) {
        n.rotation += 0.002
        const nebulaGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size)
        nebulaGrad.addColorStop(0, `${n.color}${toHexAlpha(0.15 * bgOpacity)}`)
        nebulaGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = nebulaGrad
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Moving stars (zoom effect)
      const zoomIntensity = clamp((progress - 10) / 50, 0, 1)
      for (const star of stars) {
        const dx = star.x - centerX
        const dy = star.y - centerY
        star.x += dx * 0.01 * zoomIntensity * star.speed
        star.y += dy * 0.01 * zoomIntensity * star.speed

        // Wrap around
        if (star.x < 0 || star.x > width || star.y < 0 || star.y > height) {
          star.x = centerX + random(-50, 50)
          star.y = centerY + random(-50, 50)
        }

        const starOpacity = bgOpacity * (0.5 + 0.5 * Math.sin(elapsed * 0.01 + star.x))
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`
        ctx.fill()
      }

      // Central glow
      if (progress > 20) {
        const glowProgress = clamp((progress - 20) / 30, 0, 1)
        const glowSize = easeOutExpo(glowProgress) * 200
        const glowOpacity = (progress > 70 ? (90 - progress) / 20 : 0.6) * bgOpacity

        const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize)
        glowGrad.addColorStop(0, `rgba(167, 139, 250, ${glowOpacity})`)
        glowGrad.addColorStop(0.5, `rgba(139, 92, 246, ${glowOpacity * 0.5})`)
        glowGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      // Level text
      if (progress > 25 && progress < 90) {
        const textProgress = clamp((progress - 25) / 20, 0, 1)
        const scale = easeOutBack(textProgress)
        const textOpacity = progress > 70 ? (90 - progress) / 20 : 1

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.scale(scale, scale)

        ctx.shadowColor = '#A78BFA'
        ctx.shadowBlur = 40

        ctx.font = 'bold 26px sans-serif'
        ctx.fillStyle = `rgba(167, 139, 250, ${textOpacity})`
        ctx.textAlign = 'center'
        ctx.fillText('LEVEL UP!', 0, -50)

        ctx.font = 'bold 105px sans-serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`
        ctx.fillText(`${newLevel}`, 0, 40)

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress, newLevel])

  return null
}

// ========================================
// MAIN COMPONENT
// ========================================

export function LevelUpAnimation({
  newLevel,
  onComplete,
  version = 'gold',
  standalone = false
}: LevelUpAnimationProps) {
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

  const renderAnimation = () => {
    switch (version) {
      case 'gold':
        return <GoldAnimation canvasRef={canvasRef} onProgress={handleProgress} newLevel={newLevel} />
      case 'aurora':
        return <AuroraLevelUpAnimation canvasRef={canvasRef} onProgress={handleProgress} newLevel={newLevel} />
      case 'epic':
        return <EpicAnimation canvasRef={canvasRef} onProgress={handleProgress} newLevel={newLevel} />
      case 'minimal':
        return <MinimalAnimation canvasRef={canvasRef} onProgress={handleProgress} newLevel={newLevel} />
      case 'rpg':
        return <RPGAnimation canvasRef={canvasRef} onProgress={handleProgress} newLevel={newLevel} />
      case 'cosmic':
        return <CosmicAnimation canvasRef={canvasRef} onProgress={handleProgress} newLevel={newLevel} />
      case 'minimal-progressive':
      case 'progressive-v2':
      case 'luxury':
      case 'aurora-progressive':
        // These versions handle their own rendering
        return null
      default:
        return <GoldAnimation canvasRef={canvasRef} onProgress={handleProgress} newLevel={newLevel} />
    }
  }

  if (!mounted) return null

  // For minimal-progressive, use the dedicated component
  if (version === 'minimal-progressive') {
    return (
      <MinimalProgressiveAnimation
        newLevel={newLevel}
        onComplete={onComplete}
        standalone={standalone}
      />
    )
  }

  // For progressive-v2, use the enhanced component
  if (version === 'progressive-v2') {
    return (
      <MinimalProgressiveAnimationV2
        newLevel={newLevel}
        onComplete={onComplete}
        standalone={standalone}
      />
    )
  }

  // For luxury, use the sophisticated component
  if (version === 'luxury') {
    return (
      <LuxuryLevelUpAnimation
        newLevel={newLevel}
        onComplete={onComplete}
        standalone={standalone}
      />
    )
  }

  // For aurora-progressive, use the aurora component
  if (version === 'aurora-progressive') {
    return (
      <AuroraProgressiveAnimation
        newLevel={newLevel}
        onComplete={onComplete}
        standalone={standalone}
      />
    )
  }

  const content = (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto"
      onClick={() => onComplete?.()}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {renderAnimation()}

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
                     transition-all duration-300 ease-out
                     animate-fadeIn z-[10000]"
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

export default LevelUpAnimation
