'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

// ========================================
// Types
// ========================================

export type AnimationVersion = 'fireworks' | 'aurora' | 'geometric' | 'cyber' | 'code' | 'sakura' | 'ocean' | 'galaxy' | 'stylish' | 'naruto' | 'mystic' | 'retro' | 'fantasy' | 'lightning' | 'slash' | 'phoenix' | 'royal' | 'shockwave' | 'royalPlus' | 'slashPlus' | 'shockwavePlus'

interface TutorialConfettiProps {
  standalone?: boolean
  onComplete?: () => void
  version?: AnimationVersion
}

// ========================================
// Utility Functions
// ========================================

const random = (min: number, max: number) => Math.random() * (max - min) + min
const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T
const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5)
const clamp = (val: number, min: number, max: number): number => Math.min(max, Math.max(min, val))
const toHexAlpha = (opacity: number): string => Math.floor(clamp(opacity, 0, 1) * 255).toString(16).padStart(2, '0')

// ========================================
// VERSION: FIREWORKS
// ========================================

function FireworksAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; trail: { x: number; y: number }[] }
  interface Firework { x: number; y: number; targetY: number; vy: number; color: string; exploded: boolean; particles: Particle[] }

  const fireworksRef = useRef<Firework[]>([])
  const bokehRef = useRef<{ x: number; y: number; size: number; opacity: number; color: string; phase: number; speed: number }[]>([])
  const COLORS = ['#FFD700', '#FFC0CB', '#E8B4B8', '#F7E7CE', '#E0FFFF', '#FFE55C']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    startTimeRef.current = performance.now()

    bokehRef.current = Array.from({ length: 25 }, () => ({
      x: random(0, width), y: random(0, height), size: random(30, 120), opacity: random(0.03, 0.12),
      color: randomChoice(['#FFD700', '#E8B4B8', '#F7E7CE']), phase: random(0, Math.PI * 2), speed: random(0.005, 0.015)
    }))

    let fireworkTimer = 0, lastFireworkTime = 0

    const createFirework = (): Firework => ({
      x: random(width * 0.2, width * 0.8), y: height, targetY: random(height * 0.2, height * 0.5),
      vy: -random(12, 18), color: randomChoice(COLORS), exploded: false, particles: []
    })

    const explodeFirework = (fw: Firework) => {
      for (let i = 0; i < random(60, 100); i++) {
        const angle = (i / 80) * Math.PI * 2 + random(-0.2, 0.2), speed = random(2, 8)
        fw.particles.push({ x: fw.x, y: fw.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, maxLife: random(80, 140), color: random(0, 1) > 0.3 ? fw.color : randomChoice(COLORS), size: random(1.5, 4), trail: [] })
      }
      fw.exploded = true
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)

      ctx.fillStyle = progress > 80 ? `rgba(0,0,0,${0.15 * (1 - (progress - 80) / 20)})` : 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, width, height)

      for (const b of bokehRef.current) {
        b.phase += b.speed
        const op = b.opacity * (0.7 + 0.3 * Math.sin(b.phase))
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size)
        grad.addColorStop(0, `${b.color}${toHexAlpha(op)}`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill()
      }

      if (progress > 5 && progress < 85) {
        fireworkTimer++
        if (fireworkTimer - lastFireworkTime > random(40, 80) && fireworksRef.current.length < 8) {
          fireworksRef.current.push(createFirework()); lastFireworkTime = fireworkTimer
        }
        fireworksRef.current = fireworksRef.current.filter(fw => {
          if (!fw.exploded) {
            fw.y += fw.vy; fw.vy *= 0.98
            ctx.beginPath(); ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2); ctx.fillStyle = fw.color; ctx.fill()
            if (fw.y <= fw.targetY || fw.vy > -2) explodeFirework(fw)
            return true
          } else {
            let hasLive = false
            for (const p of fw.particles) {
              if (p.life > 0) {
                hasLive = true; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.vx *= 0.98; p.vy *= 0.98; p.life -= 1 / p.maxLife
                const op = easeOutQuint(clamp(p.life, 0, 1))
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
                glow.addColorStop(0, `${p.color}${toHexAlpha(op)}`); glow.addColorStop(1, 'transparent')
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill()
              }
            }
            return hasLive
          }
        })
      }
      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: AURORA
// ========================================

function AuroraAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
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
      y: height * 0.3 + i * 40, amplitude: 30 + i * 10, frequency: 0.002 + i * 0.0005,
      speed: 0.02 + i * 0.005, phase: random(0, Math.PI * 2),
      color: ['#00ff87', '#60efff', '#ff61d8', '#ffaa00', '#00ffcc'][i] ?? '#00ff87'
    }))
    const stars = Array.from({ length: 150 }, () => ({
      x: random(0, width), y: random(0, height * 0.7), size: random(0.5, 2),
      opacity: random(0.3, 1), twinkle: random(0, Math.PI * 2), speed: random(0.02, 0.08)
    }))
    const orbs = Array.from({ length: 8 }, () => ({
      x: random(width * 0.2, width * 0.8), y: random(height * 0.3, height * 0.7),
      size: random(20, 50), phase: random(0, Math.PI * 2), speed: random(0.01, 0.03),
      floatY: 0, floatSpeed: random(0.01, 0.02), color: randomChoice(['#00ff87', '#60efff', '#ff61d8', '#ffaa00'])
    }))

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#0a0015'); bgGrad.addColorStop(0.5, '#1a0030'); bgGrad.addColorStop(1, '#0a0020')
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height)

      for (const s of stars) {
        s.twinkle += s.speed
        const tw = 0.5 + 0.5 * Math.sin(s.twinkle)
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size * tw, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.opacity * tw * fadeOp})`; ctx.fill()
      }

      for (const wave of waves) {
        wave.phase += wave.speed
        ctx.beginPath()
        for (let x = 0; x <= width; x += 5) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude + Math.sin(x * wave.frequency * 2 + wave.phase * 1.5) * wave.amplitude * 0.3
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath()
        const grad = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, wave.y + 200)
        grad.addColorStop(0, `${wave.color}${toHexAlpha(0.4 * fadeOp)}`)
        grad.addColorStop(0.5, `${wave.color}${toHexAlpha(0.15 * fadeOp)}`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad; ctx.fill()
      }

      for (const orb of orbs) {
        orb.phase += orb.speed; orb.floatY += orb.floatSpeed
        const y = orb.y + Math.sin(orb.floatY) * 20, pulse = 0.8 + 0.2 * Math.sin(orb.phase)
        const grad = ctx.createRadialGradient(orb.x, y, 0, orb.x, y, orb.size * pulse)
        grad.addColorStop(0, `${orb.color}${toHexAlpha(0.8 * fadeOp)}`)
        grad.addColorStop(0.5, `${orb.color}${toHexAlpha(0.3 * fadeOp)}`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(orb.x, y, orb.size * pulse * 2, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill()
      }
      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: GEOMETRIC
// ========================================

function GeometricAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
    const shapes: { x: number; y: number; size: number; rotation: number; rotSpeed: number; type: string; color: string; targetX: number; targetY: number; delay: number; opacity: number; scale: number }[] = []
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 6, radius = 50 + i * 15
      shapes.push({ x: centerX, y: centerY, targetX: centerX + Math.cos(angle) * radius, targetY: centerY + Math.sin(angle) * radius,
        size: 15 + random(0, 20), rotation: random(0, Math.PI * 2), rotSpeed: random(-0.02, 0.02),
        type: randomChoice(['triangle', 'square', 'hexagon', 'circle']), color: COLORS[i % COLORS.length] ?? '#667eea', delay: i * 30, opacity: 0, scale: 0 })
    }
    const rings = Array.from({ length: 5 }, (_, i) => ({
      radius: 0, targetRadius: 80 + i * 60, opacity: 0, rotation: 0, rotSpeed: (i % 2 === 0 ? 1 : -1) * 0.005, delay: 200 + i * 150, color: COLORS[i] ?? '#667eea'
    }))

    const drawShape = (x: number, y: number, size: number, rotation: number, type: string, color: string, opacity: number) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = opacity
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.fillStyle = `${color}20`
      ctx.beginPath()
      if (type === 'triangle') { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 - Math.PI / 2; i === 0 ? ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size) : ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size) } }
      else if (type === 'square') { ctx.rect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4) }
      else if (type === 'hexagon') { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; i === 0 ? ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size) : ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size) } }
      else { ctx.arc(0, 0, size, 0, Math.PI * 2) }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore()
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#1a1a2e'); bgGrad.addColorStop(1, '#0f0f1a')
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height)

      for (const ring of rings) {
        if (elapsed > ring.delay) {
          const rp = Math.min(1, (elapsed - ring.delay) / 800)
          ring.radius = ring.targetRadius * easeOutExpo(rp); ring.opacity = easeOutExpo(rp) * 0.6 * fadeOp; ring.rotation += ring.rotSpeed
          ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(ring.rotation)
          ctx.beginPath(); ctx.arc(0, 0, ring.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `${ring.color}${toHexAlpha(ring.opacity)}`
          ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.stroke(); ctx.setLineDash([]); ctx.restore()
        }
      }
      for (const shape of shapes) {
        if (elapsed > shape.delay) {
          const sp = Math.min(1, (elapsed - shape.delay) / 600), ease = easeOutExpo(sp)
          shape.x = centerX + (shape.targetX - centerX) * ease; shape.y = centerY + (shape.targetY - centerY) * ease
          shape.scale = ease; shape.opacity = ease * fadeOp; shape.rotation += shape.rotSpeed
          drawShape(shape.x, shape.y, shape.size * shape.scale, shape.rotation, shape.type, shape.color, shape.opacity)
        }
      }
      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: CYBER (Futuristic/Neon)
// ========================================

function CyberAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
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

    const NEON_COLORS = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff0080']

    // Digital rain
    const columns = Math.floor(width / 20)
    const drops: number[] = Array(columns).fill(0).map(() => random(-height, 0))
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF'

    // Hexagons
    const hexagons: { x: number; y: number; size: number; rotation: number; opacity: number; color: string; pulse: number }[] = []
    for (let i = 0; i < 15; i++) {
      hexagons.push({ x: random(0, width), y: random(0, height), size: random(30, 80), rotation: random(0, Math.PI), opacity: 0, color: randomChoice(NEON_COLORS), pulse: random(0, Math.PI * 2) })
    }

    // Grid lines
    const gridSize = 50

    // Glitch blocks
    const glitches: { x: number; y: number; w: number; h: number; life: number; color: string }[] = []

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Background
      ctx.fillStyle = '#000010'
      ctx.fillRect(0, 0, width, height)

      // Grid
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 * fadeOp})`
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
      }

      // Digital rain
      ctx.font = '16px monospace'
      for (let i = 0; i < drops.length; i++) {
        const dropY = drops[i]
        if (dropY === undefined) continue

        const char = chars[Math.floor(random(0, chars.length))]
        const x = i * 20

        // Gradient from bright to dim
        const gradient = ctx.createLinearGradient(x, dropY - 200, x, dropY)
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(0.8, `rgba(0, 255, 0, ${0.5 * fadeOp})`)
        gradient.addColorStop(1, `rgba(0, 255, 0, ${fadeOp})`)

        ctx.fillStyle = `rgba(0, 255, 0, ${fadeOp})`
        ctx.fillText(char ?? 'ア', x, dropY)

        // Trail
        for (let j = 1; j < 15; j++) {
          const trailChar = chars[Math.floor(random(0, chars.length))]
          ctx.fillStyle = `rgba(0, 255, 0, ${(1 - j / 15) * 0.3 * fadeOp})`
          ctx.fillText(trailChar ?? 'ア', x, dropY - j * 20)
        }

        const newY = dropY + random(5, 15)
        drops[i] = (newY > height && random(0, 1) > 0.95) ? 0 : newY
      }

      // Hexagons
      for (const hex of hexagons) {
        hex.pulse += 0.03
        hex.rotation += 0.005
        const pulse = 0.5 + 0.5 * Math.sin(hex.pulse)
        hex.opacity = Math.min(hex.opacity + 0.02, pulse * fadeOp)

        ctx.save()
        ctx.translate(hex.x, hex.y)
        ctx.rotate(hex.rotation)

        // Glow
        ctx.shadowColor = hex.color
        ctx.shadowBlur = 20 * pulse

        ctx.strokeStyle = `${hex.color}${toHexAlpha(hex.opacity)}`
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const px = Math.cos(angle) * hex.size, py = Math.sin(angle) * hex.size
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()

        ctx.shadowBlur = 0
        ctx.restore()
      }

      // Random glitch effect
      if (random(0, 1) > 0.95 && progress < 85) {
        glitches.push({ x: random(0, width), y: random(0, height), w: random(50, 200), h: random(5, 30), life: 1, color: randomChoice(NEON_COLORS) })
      }

      for (let i = glitches.length - 1; i >= 0; i--) {
        const g = glitches[i]
        if (!g) continue
        g.life -= 0.1
        if (g.life <= 0) { glitches.splice(i, 1); continue }
        ctx.fillStyle = `${g.color}${toHexAlpha(g.life * 0.5 * fadeOp)}`
        ctx.fillRect(g.x, g.y, g.w, g.h)
      }

      // Scanlines
      for (let y = 0; y < height; y += 4) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * fadeOp})`
        ctx.fillRect(0, y, width, 2)
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: CODE (Programming)
// ========================================

function CodeAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
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

    const SYNTAX_COLORS = {
      keyword: '#c678dd',    // purple
      string: '#98c379',     // green
      function: '#61afef',   // blue
      number: '#d19a66',     // orange
      comment: '#5c6370',    // gray
      variable: '#e06c75',   // red
      bracket: '#ffd700'     // gold
    }

    const codeSnippets = [
      { text: 'function', color: SYNTAX_COLORS.keyword },
      { text: 'complete()', color: SYNTAX_COLORS.function },
      { text: '{ return true }', color: SYNTAX_COLORS.bracket },
      { text: '"SUCCESS"', color: SYNTAX_COLORS.string },
      { text: 'const result =', color: SYNTAX_COLORS.keyword },
      { text: '// Well done!', color: SYNTAX_COLORS.comment },
      { text: 'async/await', color: SYNTAX_COLORS.keyword },
      { text: '=> { }', color: SYNTAX_COLORS.bracket },
      { text: 'import { win }', color: SYNTAX_COLORS.keyword },
      { text: '100%', color: SYNTAX_COLORS.number },
      { text: 'export default', color: SYNTAX_COLORS.keyword },
      { text: '.then(celebrate)', color: SYNTAX_COLORS.function },
      { text: 'let score = 100', color: SYNTAX_COLORS.variable },
      { text: 'new Achievement()', color: SYNTAX_COLORS.function }
    ]

    const fallingCode: { x: number; y: number; text: string; color: string; speed: number; opacity: number; size: number; rotation: number }[] = []

    // Typing effect
    const typingLines = [
      '> npm run success',
      '> Compiling...',
      '> Build completed!',
      '> Launching celebration...'
    ]
    let currentLine = 0, currentChar = 0, typedText = ''

    // Particles (brackets and symbols)
    const particles: { x: number; y: number; vx: number; vy: number; char: string; color: string; life: number; size: number }[] = []

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dark editor background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#1e1e1e')
      bgGrad.addColorStop(1, '#252526')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Line numbers gutter
      ctx.fillStyle = '#2d2d30'
      ctx.fillRect(0, 0, 50, height)

      // Add falling code
      if (random(0, 1) > 0.9 && progress < 85) {
        const snippet = randomChoice(codeSnippets)
        fallingCode.push({
          x: random(60, width - 100), y: -30, text: snippet.text, color: snippet.color,
          speed: random(2, 5), opacity: 1, size: random(14, 20), rotation: random(-0.1, 0.1)
        })
      }

      // Draw falling code
      ctx.textAlign = 'left'
      for (let i = fallingCode.length - 1; i >= 0; i--) {
        const code = fallingCode[i]
        if (!code) continue
        code.y += code.speed
        code.opacity = Math.min(code.opacity, fadeOp)

        ctx.save()
        ctx.translate(code.x, code.y)
        ctx.rotate(code.rotation)
        ctx.font = `${code.size}px 'Fira Code', 'Consolas', monospace`
        ctx.fillStyle = `${code.color}${toHexAlpha(code.opacity)}`
        ctx.fillText(code.text, 0, 0)
        ctx.restore()

        if (code.y > height + 50) {
          // Spawn particles when code reaches bottom
          const chars = ['{', '}', '(', ')', '[', ']', '<', '>', ';', '=']
          for (let j = 0; j < 5; j++) {
            particles.push({
              x: code.x + random(0, 100), y: height,
              vx: random(-3, 3), vy: random(-8, -3),
              char: randomChoice(chars), color: code.color,
              life: 1, size: random(12, 18)
            })
          }
          fallingCode.splice(i, 1)
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.02
        if (p.life <= 0) { particles.splice(i, 1); continue }
        ctx.font = `${p.size}px monospace`
        ctx.fillStyle = `${p.color}${toHexAlpha(p.life * fadeOp)}`
        ctx.fillText(p.char, p.x, p.y)
      }

      // Typing effect at bottom
      if (progress > 20) {
        const typingProgress = (progress - 20) / 60
        const targetChars = Math.floor(typingProgress * typingLines.join('\n').length)

        let totalChars = 0
        typedText = ''
        for (let i = 0; i < typingLines.length; i++) {
          const line = typingLines[i] ?? ''
          if (totalChars + line.length <= targetChars) {
            typedText += line + '\n'
            totalChars += line.length + 1
          } else {
            typedText += line.substring(0, targetChars - totalChars)
            break
          }
        }

        ctx.font = '16px "Fira Code", monospace'
        ctx.fillStyle = `rgba(86, 156, 214, ${fadeOp})`
        const lines = typedText.split('\n')
        lines.forEach((line, i) => {
          ctx.fillText(line, 60, height - 100 + i * 24)
        })

        // Cursor blink
        if (Math.floor(elapsed / 500) % 2 === 0) {
          const lastLine = lines[lines.length - 1] ?? ''
          const cursorX = 60 + ctx.measureText(lastLine).width
          ctx.fillStyle = `rgba(255, 255, 255, ${fadeOp})`
          ctx.fillRect(cursorX, height - 100 + (lines.length - 1) * 24 - 14, 8, 18)
        }
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: SAKURA (Cherry Blossom)
// ========================================

function SakuraAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
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

    const SAKURA_COLORS = ['#FFB7C5', '#FF69B4', '#FFC0CB', '#FFD1DC', '#FFDAE9', '#FFFFFF']

    interface Petal {
      x: number; y: number; size: number; rotation: number; rotSpeed: number
      vx: number; vy: number; wobble: number; wobbleSpeed: number
      color: string; opacity: number; type: 'petal' | 'small'
    }

    const petals: Petal[] = []

    // Initialize some petals
    for (let i = 0; i < 60; i++) {
      petals.push({
        x: random(0, width), y: random(-height, height),
        size: random(8, 20), rotation: random(0, Math.PI * 2), rotSpeed: random(-0.02, 0.02),
        vx: random(-1, 1), vy: random(1, 3),
        wobble: random(0, Math.PI * 2), wobbleSpeed: random(0.02, 0.05),
        color: randomChoice(SAKURA_COLORS), opacity: random(0.6, 1),
        type: random(0, 1) > 0.3 ? 'petal' : 'small'
      })
    }

    // Light particles
    const lights: { x: number; y: number; size: number; opacity: number; pulse: number; speed: number }[] = []
    for (let i = 0; i < 30; i++) {
      lights.push({
        x: random(0, width), y: random(0, height),
        size: random(2, 5), opacity: random(0.3, 0.7),
        pulse: random(0, Math.PI * 2), speed: random(0.02, 0.05)
      })
    }

    const drawPetal = (x: number, y: number, size: number, rotation: number, color: string, opacity: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity

      // Petal shape
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.bezierCurveTo(size * 0.8, -size * 0.5, size * 0.8, size * 0.5, 0, size)
      ctx.bezierCurveTo(-size * 0.8, size * 0.5, -size * 0.8, -size * 0.5, 0, -size)
      ctx.closePath()

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
      grad.addColorStop(0, '#FFFFFF')
      grad.addColorStop(0.3, color)
      grad.addColorStop(1, '#FF69B4')
      ctx.fillStyle = grad
      ctx.fill()

      ctx.restore()
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Gradient background (spring sky)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#E8F4F8')
      bgGrad.addColorStop(0.3, '#FFF0F5')
      bgGrad.addColorStop(0.7, '#FFE4E9')
      bgGrad.addColorStop(1, '#FFDAE0')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Soft light rays
      if (progress > 10) {
        const rayOp = Math.min(0.2, (progress - 10) / 50) * fadeOp
        ctx.save()
        ctx.translate(width * 0.7, 0)
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI / 4 + (i / 5) * 0.3
          const grad = ctx.createLinearGradient(0, 0, Math.cos(angle) * height, Math.sin(angle) * height)
          grad.addColorStop(0, `rgba(255, 255, 200, ${rayOp})`)
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(angle - 0.05) * height * 1.5, Math.sin(angle - 0.05) * height * 1.5)
          ctx.lineTo(Math.cos(angle + 0.05) * height * 1.5, Math.sin(angle + 0.05) * height * 1.5)
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }

      // Light particles
      for (const light of lights) {
        light.pulse += light.speed
        const pulse = 0.5 + 0.5 * Math.sin(light.pulse)
        ctx.beginPath()
        ctx.arc(light.x, light.y, light.size * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${light.opacity * pulse * fadeOp})`
        ctx.fill()
      }

      // Update and draw petals
      for (const petal of petals) {
        petal.wobble += petal.wobbleSpeed
        petal.x += petal.vx + Math.sin(petal.wobble) * 0.5
        petal.y += petal.vy
        petal.rotation += petal.rotSpeed

        // Wind effect
        petal.vx += (random(-0.1, 0.1))
        petal.vx = Math.max(-2, Math.min(2, petal.vx))

        // Reset when out of screen
        if (petal.y > height + 50) {
          petal.y = -20
          petal.x = random(0, width)
        }
        if (petal.x < -50) petal.x = width + 50
        if (petal.x > width + 50) petal.x = -50

        if (petal.type === 'petal') {
          drawPetal(petal.x, petal.y, petal.size, petal.rotation, petal.color, petal.opacity * fadeOp)
        } else {
          // Small round petal
          ctx.beginPath()
          ctx.arc(petal.x, petal.y, petal.size * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = `${petal.color}${toHexAlpha(petal.opacity * fadeOp)}`
          ctx.fill()
        }
      }

      // Add more petals gradually
      if (petals.length < 100 && random(0, 1) > 0.95) {
        petals.push({
          x: random(0, width), y: -20,
          size: random(10, 25), rotation: random(0, Math.PI * 2), rotSpeed: random(-0.02, 0.02),
          vx: random(-1, 1), vy: random(1.5, 3),
          wobble: random(0, Math.PI * 2), wobbleSpeed: random(0.02, 0.05),
          color: randomChoice(SAKURA_COLORS), opacity: random(0.7, 1),
          type: 'petal'
        })
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: OCEAN (Underwater)
// ========================================

function OceanAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
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

    // Bubbles
    const bubbles: { x: number; y: number; size: number; speed: number; wobble: number; wobbleSpeed: number; opacity: number }[] = []
    for (let i = 0; i < 50; i++) {
      bubbles.push({
        x: random(0, width), y: random(height, height * 2),
        size: random(5, 25), speed: random(1, 3),
        wobble: random(0, Math.PI * 2), wobbleSpeed: random(0.02, 0.05),
        opacity: random(0.3, 0.8)
      })
    }

    // Light rays
    const rays: { x: number; width: number; opacity: number; speed: number }[] = []
    for (let i = 0; i < 8; i++) {
      rays.push({ x: random(0, width), width: random(50, 150), opacity: random(0.1, 0.3), speed: random(0.2, 0.5) })
    }

    // Fish (small particles)
    const fish: { x: number; y: number; speed: number; size: number; color: string }[] = []
    for (let i = 0; i < 15; i++) {
      fish.push({
        x: random(-100, width + 100), y: random(height * 0.2, height * 0.8),
        speed: random(1, 3), size: random(3, 8),
        color: randomChoice(['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'])
      })
    }

    // Wave layers
    const waves = Array.from({ length: 3 }, (_, i) => ({
      amplitude: 20 + i * 10, frequency: 0.01 - i * 0.002,
      speed: 0.02 + i * 0.01, phase: 0, y: height * (0.15 + i * 0.05)
    }))

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Ocean gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#001833')
      bgGrad.addColorStop(0.3, '#003366')
      bgGrad.addColorStop(0.6, '#004080')
      bgGrad.addColorStop(1, '#001a33')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Light rays from surface
      for (const ray of rays) {
        ray.x += ray.speed
        if (ray.x > width + ray.width) ray.x = -ray.width

        const grad = ctx.createLinearGradient(ray.x, 0, ray.x + ray.width * 0.5, height)
        grad.addColorStop(0, `rgba(100, 200, 255, ${ray.opacity * fadeOp})`)
        grad.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.moveTo(ray.x, 0)
        ctx.lineTo(ray.x + ray.width, 0)
        ctx.lineTo(ray.x + ray.width * 0.7, height)
        ctx.lineTo(ray.x + ray.width * 0.3, height)
        ctx.closePath()
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Waves at top
      for (const wave of waves) {
        wave.phase += wave.speed
        ctx.beginPath()
        ctx.moveTo(0, 0)
        for (let x = 0; x <= width; x += 10) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, 0)
        ctx.closePath()

        const waveGrad = ctx.createLinearGradient(0, 0, 0, wave.y + wave.amplitude)
        waveGrad.addColorStop(0, `rgba(0, 100, 150, ${0.3 * fadeOp})`)
        waveGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = waveGrad
        ctx.fill()
      }

      // Fish
      for (const f of fish) {
        f.x += f.speed
        if (f.x > width + 100) f.x = -50

        ctx.save()
        ctx.translate(f.x, f.y)

        // Simple fish shape
        ctx.fillStyle = `${f.color}${toHexAlpha(fadeOp * 0.78)}`
        ctx.beginPath()
        ctx.ellipse(0, 0, f.size * 2, f.size, 0, 0, Math.PI * 2)
        ctx.fill()
        // Tail
        ctx.beginPath()
        ctx.moveTo(-f.size * 2, 0)
        ctx.lineTo(-f.size * 3.5, -f.size)
        ctx.lineTo(-f.size * 3.5, f.size)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      }

      // Bubbles
      for (const bubble of bubbles) {
        bubble.wobble += bubble.wobbleSpeed
        bubble.y -= bubble.speed
        bubble.x += Math.sin(bubble.wobble) * 0.5

        if (bubble.y < -50) {
          bubble.y = height + 50
          bubble.x = random(0, width)
        }

        // Bubble with highlight
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
        const bubbleGrad = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, 0,
          bubble.x, bubble.y, bubble.size
        )
        bubbleGrad.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.8 * fadeOp})`)
        bubbleGrad.addColorStop(0.5, `rgba(100, 200, 255, ${bubble.opacity * 0.3 * fadeOp})`)
        bubbleGrad.addColorStop(1, `rgba(100, 200, 255, ${bubble.opacity * 0.1 * fadeOp})`)
        ctx.fillStyle = bubbleGrad
        ctx.fill()

        // Highlight
        ctx.beginPath()
        ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * fadeOp})`
        ctx.fill()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: GALAXY (Space/Nebula)
// ========================================

function GalaxyAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Stars
    const stars: { x: number; y: number; size: number; brightness: number; twinkle: number; speed: number }[] = []
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: random(0, width), y: random(0, height),
        size: random(0.5, 2.5), brightness: random(0.3, 1),
        twinkle: random(0, Math.PI * 2), speed: random(0.02, 0.08)
      })
    }

    // Nebula clouds
    const nebulaClouds: { x: number; y: number; size: number; color: string; rotation: number; rotSpeed: number }[] = []
    const nebulaColors = ['#4B0082', '#8A2BE2', '#FF1493', '#00CED1', '#FF4500']
    for (let i = 0; i < 8; i++) {
      nebulaClouds.push({
        x: random(width * 0.2, width * 0.8), y: random(height * 0.2, height * 0.8),
        size: random(100, 300), color: randomChoice(nebulaColors),
        rotation: random(0, Math.PI * 2), rotSpeed: random(-0.001, 0.001)
      })
    }

    // Spiral galaxy arms
    const spiralStars: { angle: number; radius: number; size: number; speed: number; color: string }[] = []
    for (let i = 0; i < 200; i++) {
      const angle = random(0, Math.PI * 4)
      const radius = 50 + angle * 30 + random(-20, 20)
      spiralStars.push({
        angle, radius, size: random(1, 3), speed: random(0.001, 0.003),
        color: randomChoice(['#FFFFFF', '#FFE4B5', '#87CEEB', '#DDA0DD'])
      })
    }

    // Shooting stars
    const shootingStars: { x: number; y: number; vx: number; vy: number; life: number }[] = []

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Deep space background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#0a0a1a')
      bgGrad.addColorStop(0.5, '#050510')
      bgGrad.addColorStop(1, '#000005')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Nebula clouds
      for (const cloud of nebulaClouds) {
        cloud.rotation += cloud.rotSpeed

        ctx.save()
        ctx.translate(cloud.x, cloud.y)
        ctx.rotate(cloud.rotation)

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.size)
        grad.addColorStop(0, `${cloud.color}${toHexAlpha(0.3 * fadeOp)}`)
        grad.addColorStop(0.5, `${cloud.color}${toHexAlpha(0.1 * fadeOp)}`)
        grad.addColorStop(1, 'transparent')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(0, 0, cloud.size, cloud.size * 0.6, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      // Background stars
      for (const star of stars) {
        star.twinkle += star.speed
        const twinkle = 0.5 + 0.5 * Math.sin(star.twinkle)
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle * fadeOp})`
        ctx.fill()
      }

      // Spiral galaxy
      ctx.save()
      ctx.translate(centerX, centerY)
      for (const ss of spiralStars) {
        ss.angle += ss.speed
        const x = Math.cos(ss.angle) * ss.radius
        const y = Math.sin(ss.angle) * ss.radius * 0.4 // Flatten for perspective
        ctx.beginPath()
        ctx.arc(x, y, ss.size, 0, Math.PI * 2)
        ctx.fillStyle = `${ss.color}${toHexAlpha(fadeOp * 0.78)}`
        ctx.fill()
      }

      // Galaxy core glow
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80)
      coreGrad.addColorStop(0, `rgba(255, 255, 200, ${0.8 * fadeOp})`)
      coreGrad.addColorStop(0.3, `rgba(255, 200, 150, ${0.4 * fadeOp})`)
      coreGrad.addColorStop(0.6, `rgba(200, 150, 255, ${0.2 * fadeOp})`)
      coreGrad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(0, 0, 80, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()
      ctx.restore()

      // Shooting stars
      if (random(0, 1) > 0.98 && progress < 85) {
        shootingStars.push({
          x: random(0, width), y: random(0, height * 0.5),
          vx: random(10, 20), vy: random(5, 10), life: 1
        })
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i]
        if (!ss) continue
        ss.x += ss.vx; ss.y += ss.vy; ss.life -= 0.02
        if (ss.life <= 0) { shootingStars.splice(i, 1); continue }

        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * 3, ss.y - ss.vy * 3)
        grad.addColorStop(0, `rgba(255, 255, 255, ${ss.life * fadeOp})`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.moveTo(ss.x, ss.y)
        ctx.lineTo(ss.x - ss.vx * 3, ss.y - ss.vy * 3)
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: STYLISH (Monochrome/Minimal)
// ========================================

function StylishAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Sharp lines
    const lines: { x1: number; y1: number; x2: number; y2: number; progress: number; speed: number; thickness: number }[] = []
    for (let i = 0; i < 30; i++) {
      const angle = random(0, Math.PI * 2)
      const len = random(100, 400)
      const cx = random(width * 0.2, width * 0.8), cy = random(height * 0.2, height * 0.8)
      lines.push({
        x1: cx - Math.cos(angle) * len / 2, y1: cy - Math.sin(angle) * len / 2,
        x2: cx + Math.cos(angle) * len / 2, y2: cy + Math.sin(angle) * len / 2,
        progress: 0, speed: random(0.01, 0.03), thickness: random(1, 4)
      })
    }

    // Rotating squares
    const squares: { x: number; y: number; size: number; rotation: number; rotSpeed: number; delay: number }[] = []
    for (let i = 0; i < 12; i++) {
      squares.push({
        x: random(width * 0.1, width * 0.9), y: random(height * 0.1, height * 0.9),
        size: random(30, 80), rotation: 0, rotSpeed: random(-0.02, 0.02), delay: i * 100
      })
    }

    // Dots grid
    const dots: { x: number; y: number; size: number; opacity: number; pulse: number }[] = []
    const gridSpacing = 40
    for (let x = gridSpacing; x < width; x += gridSpacing) {
      for (let y = gridSpacing; y < height; y += gridSpacing) {
        if (random(0, 1) > 0.7) {
          dots.push({ x, y, size: random(2, 5), opacity: 0, pulse: random(0, Math.PI * 2) })
        }
      }
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // White background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)

      // Dots
      for (const dot of dots) {
        dot.pulse += 0.02
        dot.opacity = Math.min(dot.opacity + 0.01, 0.3 + 0.2 * Math.sin(dot.pulse))
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 0, 0, ${dot.opacity * fadeOp})`
        ctx.fill()
      }

      // Lines with drawing animation
      ctx.lineCap = 'round'
      for (const line of lines) {
        line.progress = Math.min(line.progress + line.speed, 1)
        const currentX2 = line.x1 + (line.x2 - line.x1) * easeOutExpo(line.progress)
        const currentY2 = line.y1 + (line.y2 - line.y1) * easeOutExpo(line.progress)

        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(currentX2, currentY2)
        ctx.strokeStyle = `rgba(30, 30, 30, ${0.8 * fadeOp})`
        ctx.lineWidth = line.thickness
        ctx.stroke()
      }

      // Rotating squares
      for (const sq of squares) {
        if (elapsed < sq.delay) continue
        sq.rotation += sq.rotSpeed

        ctx.save()
        ctx.translate(sq.x, sq.y)
        ctx.rotate(sq.rotation)
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.6 * fadeOp})`
        ctx.lineWidth = 2
        ctx.strokeRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size)
        ctx.restore()
      }

      // Center typography elements
      const centerOpacity = Math.min(1, progress / 30) * fadeOp
      ctx.save()
      ctx.translate(centerX, centerY)

      // Large circle
      ctx.beginPath()
      ctx.arc(0, 0, 150 + Math.sin(elapsed * 0.001) * 10, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 * centerOpacity})`
      ctx.lineWidth = 1
      ctx.stroke()

      // Cross
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * centerOpacity})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-200, 0); ctx.lineTo(200, 0)
      ctx.moveTo(0, -200); ctx.lineTo(0, 200)
      ctx.stroke()

      ctx.restore()

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: NARUTO (Ninja/Chakra)
// ========================================

function NarutoAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Rasengan (spiral energy ball)
    let rasenganAngle = 0
    let rasenganSize = 0
    const rasenganTargetSize = 120

    // Chakra particles
    const chakraParticles: { x: number; y: number; angle: number; radius: number; speed: number; size: number; opacity: number }[] = []

    // Kanji characters
    const kanjis = ['忍', '術', '火', '風', '雷', '水', '土', '完', '成']
    const floatingKanji: { char: string; x: number; y: number; opacity: number; scale: number; vy: number }[] = []

    // Shuriken
    const shurikens: { x: number; y: number; rotation: number; speed: number; size: number }[] = []
    for (let i = 0; i < 5; i++) {
      shurikens.push({
        x: random(-100, width + 100), y: random(height * 0.2, height * 0.8),
        rotation: 0, speed: random(3, 8), size: random(20, 35)
      })
    }

    const drawShuriken = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity

      // 4 blade shuriken
      ctx.fillStyle = '#2a2a2a'
      for (let i = 0; i < 4; i++) {
        ctx.save()
        ctx.rotate((i / 4) * Math.PI * 2)
        ctx.beginPath()
        ctx.moveTo(0, -size * 0.2)
        ctx.lineTo(size, 0)
        ctx.lineTo(0, size * 0.2)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // Center circle
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = '#1a1a1a'
      ctx.fill()
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.restore()
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dark background with gradient
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#1a1a2e')
      bgGrad.addColorStop(0.5, '#0f0f1a')
      bgGrad.addColorStop(1, '#050510')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Update rasengan
      rasenganAngle += 0.15
      if (progress > 10) {
        rasenganSize = Math.min(rasenganSize + 2, rasenganTargetSize * (progress / 50))
      }

      // Draw Rasengan at center
      if (rasenganSize > 10) {
        // Outer glow
        const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, rasenganSize * 1.5)
        glowGrad.addColorStop(0, `rgba(0, 150, 255, ${0.5 * fadeOp})`)
        glowGrad.addColorStop(0.5, `rgba(100, 200, 255, ${0.2 * fadeOp})`)
        glowGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(centerX, centerY, rasenganSize * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = glowGrad
        ctx.fill()

        // Spiral lines
        ctx.save()
        ctx.translate(centerX, centerY)
        for (let i = 0; i < 8; i++) {
          ctx.rotate(rasenganAngle + (i / 8) * Math.PI * 2)
          ctx.beginPath()
          for (let j = 0; j < 50; j++) {
            const angle = (j / 50) * Math.PI * 4
            const r = (j / 50) * rasenganSize
            const x = Math.cos(angle) * r, y = Math.sin(angle) * r
            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(150, 220, 255, ${(0.5 - i * 0.05) * fadeOp})`
          ctx.lineWidth = 2
          ctx.stroke()
        }
        ctx.restore()

        // Inner core
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, rasenganSize * 0.4)
        coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fadeOp})`)
        coreGrad.addColorStop(0.5, `rgba(100, 200, 255, ${0.7 * fadeOp})`)
        coreGrad.addColorStop(1, `rgba(0, 100, 200, ${0.3 * fadeOp})`)
        ctx.beginPath()
        ctx.arc(centerX, centerY, rasenganSize * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = coreGrad
        ctx.fill()
      }

      // Chakra particles orbiting
      if (random(0, 1) > 0.8 && progress < 85) {
        chakraParticles.push({
          x: centerX, y: centerY,
          angle: random(0, Math.PI * 2), radius: rasenganSize + random(20, 60),
          speed: random(0.02, 0.05), size: random(3, 8), opacity: 1
        })
      }

      for (let i = chakraParticles.length - 1; i >= 0; i--) {
        const p = chakraParticles[i]
        if (!p) continue
        p.angle += p.speed
        p.opacity -= 0.01
        if (p.opacity <= 0) { chakraParticles.splice(i, 1); continue }

        const px = centerX + Math.cos(p.angle) * p.radius
        const py = centerY + Math.sin(p.angle) * p.radius

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100, 200, 255, ${p.opacity * fadeOp})`
        ctx.fill()
      }

      // Floating kanji
      if (random(0, 1) > 0.97 && progress < 80) {
        floatingKanji.push({
          char: randomChoice(kanjis), x: random(width * 0.1, width * 0.9),
          y: height + 50, opacity: 1, scale: random(0.5, 1.5), vy: random(-2, -4)
        })
      }

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = floatingKanji.length - 1; i >= 0; i--) {
        const k = floatingKanji[i]
        if (!k) continue
        k.y += k.vy
        k.opacity -= 0.005
        if (k.opacity <= 0 || k.y < -50) { floatingKanji.splice(i, 1); continue }

        ctx.font = `bold ${40 * k.scale}px serif`
        ctx.fillStyle = `rgba(255, 100, 50, ${k.opacity * fadeOp})`
        ctx.fillText(k.char, k.x, k.y)
      }

      // Shurikens
      for (const s of shurikens) {
        s.x += s.speed
        s.rotation += 0.2
        if (s.x > width + 100) s.x = -100
        drawShuriken(s.x, s.y, s.size, s.rotation, fadeOp)
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: MYSTIC (Magical/Runes)
// ========================================

function MysticAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Magic circle (multiple rings)
    const rings: { radius: number; rotation: number; rotSpeed: number; segments: number; runes: string[] }[] = []
    const runeChars = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛇ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ']

    for (let i = 0; i < 4; i++) {
      const segments = 8 + i * 4
      rings.push({
        radius: 80 + i * 60, rotation: 0, rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.005 - i * 0.001),
        segments, runes: Array.from({ length: segments }, () => randomChoice(runeChars))
      })
    }

    // Floating light particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = []
    const MYSTIC_COLORS = ['#E6D5AC', '#C9A959', '#F0E68C', '#DAA520', '#FFD700']

    // Sacred geometry pattern
    let patternRotation = 0

    const drawSacredGeometry = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity

      // Outer hexagon
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
        const px = Math.cos(angle) * size, py = Math.sin(angle) * size
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = '#C9A959'
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner triangles
      for (let i = 0; i < 2; i++) {
        ctx.beginPath()
        for (let j = 0; j < 3; j++) {
          const angle = (j / 3) * Math.PI * 2 - Math.PI / 2 + (i * Math.PI / 3)
          const px = Math.cos(angle) * size * 0.8, py = Math.sin(angle) * size * 0.8
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
      }

      // Center circle
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2)
      ctx.stroke()

      ctx.restore()
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dark mystic background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#1a1520')
      bgGrad.addColorStop(0.5, '#0d0a12')
      bgGrad.addColorStop(1, '#050308')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Ambient glow at center
      const ambientGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300)
      ambientGrad.addColorStop(0, `rgba(201, 169, 89, ${0.15 * fadeOp})`)
      ambientGrad.addColorStop(0.5, `rgba(201, 169, 89, ${0.05 * fadeOp})`)
      ambientGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = ambientGrad
      ctx.fillRect(0, 0, width, height)

      // Sacred geometry
      patternRotation += 0.003
      drawSacredGeometry(centerX, centerY, 180, patternRotation, 0.6 * fadeOp)
      drawSacredGeometry(centerX, centerY, 220, -patternRotation * 0.5, 0.4 * fadeOp)

      // Magic circle rings with runes
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const ring of rings) {
        ring.rotation += ring.rotSpeed

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(ring.rotation)

        // Ring circle
        ctx.beginPath()
        ctx.arc(0, 0, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(201, 169, 89, ${0.4 * fadeOp})`
        ctx.lineWidth = 1
        ctx.stroke()

        // Runes on ring
        ctx.font = '16px serif'
        for (let i = 0; i < ring.segments; i++) {
          const angle = (i / ring.segments) * Math.PI * 2
          const x = Math.cos(angle) * ring.radius
          const y = Math.sin(angle) * ring.radius
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(angle + Math.PI / 2)
          ctx.fillStyle = `rgba(255, 215, 100, ${0.8 * fadeOp})`
          ctx.fillText(ring.runes[i] ?? 'ᚠ', 0, 0)
          ctx.restore()
        }

        ctx.restore()
      }

      // Floating particles
      if (random(0, 1) > 0.9) {
        const angle = random(0, Math.PI * 2)
        const dist = random(100, 300)
        particles.push({
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          vx: random(-0.5, 0.5), vy: random(-1, -2),
          size: random(2, 5), opacity: 1,
          color: randomChoice(MYSTIC_COLORS)
        })
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx; p.y += p.vy
        p.opacity -= 0.01
        if (p.opacity <= 0) { particles.splice(i, 1); continue }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        grad.addColorStop(0, `${p.color}${toHexAlpha(p.opacity * fadeOp)}`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: RETRO (80s/Pixel)
// ========================================

function RetroAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Retro colors
    const RETRO_COLORS = ['#FF00FF', '#00FFFF', '#FF0080', '#8000FF', '#00FF80', '#FFFF00']

    // Grid perspective
    let gridOffset = 0

    // Sun
    const sunY = height * 0.4

    // Floating shapes (triangles, circles)
    const shapes: { x: number; y: number; size: number; type: string; rotation: number; rotSpeed: number; color: string }[] = []
    for (let i = 0; i < 15; i++) {
      shapes.push({
        x: random(0, width), y: random(0, height * 0.5),
        size: random(20, 50), type: randomChoice(['triangle', 'circle', 'diamond']),
        rotation: 0, rotSpeed: random(-0.02, 0.02), color: randomChoice(RETRO_COLORS)
      })
    }

    // Stars
    const stars: { x: number; y: number; size: number; blink: number }[] = []
    for (let i = 0; i < 100; i++) {
      stars.push({ x: random(0, width), y: random(0, height * 0.5), size: random(1, 3), blink: random(0, Math.PI * 2) })
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Gradient background (sunset)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#0a0015')
      bgGrad.addColorStop(0.3, '#1a0030')
      bgGrad.addColorStop(0.5, '#2d0050')
      bgGrad.addColorStop(0.7, '#ff0080')
      bgGrad.addColorStop(1, '#ff6000')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Stars
      for (const star of stars) {
        star.blink += 0.05
        const blink = 0.5 + 0.5 * Math.sin(star.blink)
        ctx.fillStyle = `rgba(255, 255, 255, ${blink * fadeOp})`
        ctx.fillRect(star.x, star.y, star.size, star.size)
      }

      // Sun with horizontal lines
      ctx.save()
      const sunGrad = ctx.createLinearGradient(centerX, sunY - 80, centerX, sunY + 80)
      sunGrad.addColorStop(0, '#FFFF00')
      sunGrad.addColorStop(0.5, '#FF8000')
      sunGrad.addColorStop(1, '#FF0080')

      // Clip for sun lines
      ctx.beginPath()
      ctx.arc(centerX, sunY, 80, 0, Math.PI * 2)
      ctx.clip()

      ctx.fillStyle = sunGrad
      ctx.fillRect(centerX - 80, sunY - 80, 160, 160)

      // Horizontal slice lines
      ctx.fillStyle = '#0a0015'
      for (let i = 0; i < 8; i++) {
        const lineY = sunY + i * 12 - 20
        const lineHeight = 3 + i * 0.5
        ctx.fillRect(centerX - 100, lineY, 200, lineHeight)
      }
      ctx.restore()

      // Perspective grid floor
      gridOffset = (gridOffset + 2) % 40

      ctx.strokeStyle = `rgba(255, 0, 255, ${0.6 * fadeOp})`
      ctx.lineWidth = 2

      // Horizontal lines
      const horizonY = height * 0.6
      for (let i = 0; i < 20; i++) {
        const y = horizonY + i * i * 3 + gridOffset
        if (y > height) continue
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Vertical lines (converging to center)
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath()
        ctx.moveTo(centerX + i * 20, horizonY)
        ctx.lineTo(centerX + i * 150, height)
        ctx.stroke()
      }

      // Floating shapes
      for (const shape of shapes) {
        shape.rotation += shape.rotSpeed

        ctx.save()
        ctx.translate(shape.x, shape.y)
        ctx.rotate(shape.rotation)
        ctx.strokeStyle = shape.color
        ctx.lineWidth = 3
        ctx.shadowColor = shape.color
        ctx.shadowBlur = 15

        if (shape.type === 'triangle') {
          ctx.beginPath()
          ctx.moveTo(0, -shape.size)
          ctx.lineTo(shape.size, shape.size)
          ctx.lineTo(-shape.size, shape.size)
          ctx.closePath()
          ctx.stroke()
        } else if (shape.type === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, shape.size, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -shape.size)
          ctx.lineTo(shape.size, 0)
          ctx.lineTo(0, shape.size)
          ctx.lineTo(-shape.size, 0)
          ctx.closePath()
          ctx.stroke()
        }

        ctx.restore()
      }

      // Chrome text effect simulation
      if (progress > 30) {
        ctx.save()
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'

        const textGrad = ctx.createLinearGradient(centerX - 150, 0, centerX + 150, 0)
        textGrad.addColorStop(0, '#FF00FF')
        textGrad.addColorStop(0.5, '#00FFFF')
        textGrad.addColorStop(1, '#FF00FF')

        ctx.fillStyle = textGrad
        ctx.shadowColor = '#FF00FF'
        ctx.shadowBlur = 20
        ctx.globalAlpha = Math.min(1, (progress - 30) / 20) * fadeOp
        ctx.fillText('SUCCESS', centerX, height * 0.25)
        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: FANTASY (Magical/Fairy)
// ========================================

function FantasyAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Fairy lights
    const FAIRY_COLORS = ['#FFB6C1', '#DDA0DD', '#E6E6FA', '#98FB98', '#AFEEEE', '#FFFACD', '#FFE4E1']

    // Glitter particles
    const glitters: { x: number; y: number; size: number; opacity: number; color: string; sparkle: number; vx: number; vy: number }[] = []
    for (let i = 0; i < 100; i++) {
      glitters.push({
        x: random(0, width), y: random(0, height),
        size: random(1, 4), opacity: random(0.3, 1),
        color: randomChoice(FAIRY_COLORS), sparkle: random(0, Math.PI * 2),
        vx: random(-0.3, 0.3), vy: random(-0.5, -0.1)
      })
    }

    // Fairy trail points
    const fairyPoints: { x: number; y: number; angle: number; speed: number }[] = []
    for (let i = 0; i < 3; i++) {
      fairyPoints.push({
        x: random(width * 0.3, width * 0.7), y: random(height * 0.3, height * 0.7),
        angle: random(0, Math.PI * 2), speed: random(0.02, 0.04)
      })
    }

    // Magic swirls
    const swirls: { x: number; y: number; radius: number; angle: number; rotSpeed: number; color: string }[] = []
    for (let i = 0; i < 5; i++) {
      swirls.push({
        x: random(width * 0.2, width * 0.8), y: random(height * 0.2, height * 0.8),
        radius: random(50, 100), angle: 0, rotSpeed: random(0.02, 0.05),
        color: randomChoice(FAIRY_COLORS)
      })
    }

    // Floating orbs (larger magical lights)
    const orbs: { x: number; y: number; size: number; pulse: number; color: string; floatAngle: number }[] = []
    for (let i = 0; i < 8; i++) {
      orbs.push({
        x: random(width * 0.1, width * 0.9), y: random(height * 0.2, height * 0.8),
        size: random(15, 35), pulse: random(0, Math.PI * 2),
        color: randomChoice(FAIRY_COLORS), floatAngle: random(0, Math.PI * 2)
      })
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Magical gradient background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.8)
      bgGrad.addColorStop(0, '#2a1b3d')
      bgGrad.addColorStop(0.3, '#1a1030')
      bgGrad.addColorStop(0.6, '#150d25')
      bgGrad.addColorStop(1, '#0a0515')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Soft ambient glows
      for (let i = 0; i < 3; i++) {
        const glowX = centerX + Math.sin(elapsed * 0.0005 + i * 2) * 200
        const glowY = centerY + Math.cos(elapsed * 0.0007 + i * 2) * 150
        const glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 200)
        glowGrad.addColorStop(0, `rgba(200, 150, 255, ${0.1 * fadeOp})`)
        glowGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGrad
        ctx.fillRect(0, 0, width, height)
      }

      // Magic swirls
      for (const swirl of swirls) {
        swirl.angle += swirl.rotSpeed
        ctx.beginPath()
        for (let i = 0; i < 100; i++) {
          const angle = swirl.angle + (i / 100) * Math.PI * 4
          const r = swirl.radius * (1 - i / 100)
          const x = swirl.x + Math.cos(angle) * r
          const y = swirl.y + Math.sin(angle) * r
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `${swirl.color}${toHexAlpha(0.4 * fadeOp)}`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Floating orbs
      for (const orb of orbs) {
        orb.pulse += 0.03
        orb.floatAngle += 0.01
        const floatY = orb.y + Math.sin(orb.floatAngle) * 20
        const pulsedSize = orb.size * (0.9 + 0.1 * Math.sin(orb.pulse))

        // Outer glow
        const orbGrad = ctx.createRadialGradient(orb.x, floatY, 0, orb.x, floatY, pulsedSize * 2)
        orbGrad.addColorStop(0, `${orb.color}${toHexAlpha(0.8 * fadeOp)}`)
        orbGrad.addColorStop(0.4, `${orb.color}${toHexAlpha(0.3 * fadeOp)}`)
        orbGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(orb.x, floatY, pulsedSize * 2, 0, Math.PI * 2)
        ctx.fillStyle = orbGrad
        ctx.fill()

        // Inner bright core
        ctx.beginPath()
        ctx.arc(orb.x, floatY, pulsedSize * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * fadeOp})`
        ctx.fill()
      }

      // Fairy trail (moving points that leave sparkles)
      for (const fairy of fairyPoints) {
        fairy.angle += fairy.speed
        fairy.x = centerX + Math.sin(fairy.angle * 2) * 200 + Math.cos(fairy.angle * 3) * 100
        fairy.y = centerY + Math.cos(fairy.angle * 2) * 150 + Math.sin(fairy.angle * 1.5) * 80

        // Fairy light
        const fairyGrad = ctx.createRadialGradient(fairy.x, fairy.y, 0, fairy.x, fairy.y, 20)
        fairyGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fadeOp})`)
        fairyGrad.addColorStop(0.3, `rgba(255, 200, 255, ${0.5 * fadeOp})`)
        fairyGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(fairy.x, fairy.y, 20, 0, Math.PI * 2)
        ctx.fillStyle = fairyGrad
        ctx.fill()

        // Leave sparkles
        if (random(0, 1) > 0.7) {
          glitters.push({
            x: fairy.x + random(-20, 20), y: fairy.y + random(-20, 20),
            size: random(2, 5), opacity: 1,
            color: randomChoice(FAIRY_COLORS), sparkle: 0,
            vx: random(-0.5, 0.5), vy: random(-0.5, 0.5)
          })
        }
      }

      // Glitter particles
      for (let i = glitters.length - 1; i >= 0; i--) {
        const g = glitters[i]
        if (!g) continue
        g.x += g.vx
        g.y += g.vy
        g.sparkle += 0.1
        g.opacity -= 0.005

        if (g.opacity <= 0 || g.y < -50 || glitters.length > 300) {
          glitters.splice(i, 1)
          continue
        }

        const sparkle = 0.5 + 0.5 * Math.sin(g.sparkle * 5)

        // Star shape for glitter
        ctx.save()
        ctx.translate(g.x, g.y)
        ctx.rotate(g.sparkle)

        ctx.beginPath()
        for (let j = 0; j < 4; j++) {
          const angle = (j / 4) * Math.PI * 2
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(angle) * g.size * sparkle, Math.sin(angle) * g.size * sparkle)
        }
        ctx.strokeStyle = `${g.color}${toHexAlpha(g.opacity * fadeOp)}`
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: LIGHTNING (Thunder/Electric)
// ========================================

function LightningAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Lightning bolts
    interface LightningBolt {
      points: { x: number; y: number }[]
      opacity: number
      width: number
      color: string
      life: number
    }
    const bolts: LightningBolt[] = []

    // Electric particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = []

    // Thunder clouds
    const clouds: { x: number; y: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 5; i++) {
      clouds.push({ x: random(0, width), y: random(0, height * 0.3), size: random(150, 300), opacity: random(0.3, 0.6) })
    }

    const LIGHTNING_COLORS = ['#FFFFFF', '#E0FFFF', '#87CEEB', '#B0E0E6', '#ADD8E6']

    const createLightningBolt = (startX: number, startY: number, endY: number): LightningBolt => {
      const points: { x: number; y: number }[] = [{ x: startX, y: startY }]
      let currentX = startX, currentY = startY
      const segments = Math.floor(random(8, 15))

      for (let i = 0; i < segments; i++) {
        currentY += (endY - startY) / segments
        currentX += random(-50, 50)
        points.push({ x: currentX, y: currentY })

        // Branch lightning
        if (random(0, 1) > 0.7 && i > 2) {
          const branchLength = random(30, 80)
          const branchAngle = random(-Math.PI / 3, Math.PI / 3)
          points.push({
            x: currentX + Math.cos(branchAngle) * branchLength,
            y: currentY + Math.sin(branchAngle) * branchLength * 0.5
          })
          points.push({ x: currentX, y: currentY })
        }
      }

      return {
        points,
        opacity: 1,
        width: random(2, 5),
        color: randomChoice(LIGHTNING_COLORS),
        life: 1
      }
    }

    let lastBoltTime = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dark stormy background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#0a0a15')
      bgGrad.addColorStop(0.3, '#1a1a2e')
      bgGrad.addColorStop(0.7, '#16213e')
      bgGrad.addColorStop(1, '#0f0f23')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Thunder clouds
      for (const cloud of clouds) {
        const cloudGrad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.size)
        cloudGrad.addColorStop(0, `rgba(60, 60, 80, ${cloud.opacity * fadeOp})`)
        cloudGrad.addColorStop(0.5, `rgba(40, 40, 60, ${cloud.opacity * 0.5 * fadeOp})`)
        cloudGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.4, 0, 0, Math.PI * 2)
        ctx.fillStyle = cloudGrad
        ctx.fill()
      }

      // Create new lightning bolts
      if (elapsed - lastBoltTime > random(200, 800) && progress < 85) {
        const startX = random(width * 0.2, width * 0.8)
        bolts.push(createLightningBolt(startX, 0, height * random(0.5, 0.9)))
        lastBoltTime = elapsed

        // Add particles at bolt origin
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: startX, y: height * 0.3,
            vx: random(-5, 5), vy: random(-3, 3),
            size: random(2, 5), opacity: 1,
            color: randomChoice(LIGHTNING_COLORS)
          })
        }
      }

      // Draw lightning bolts
      for (let i = bolts.length - 1; i >= 0; i--) {
        const bolt = bolts[i]
        if (!bolt) continue
        bolt.life -= 0.05
        bolt.opacity = bolt.life

        if (bolt.life <= 0) {
          bolts.splice(i, 1)
          continue
        }

        // Glow effect
        ctx.shadowColor = bolt.color
        ctx.shadowBlur = 30 * bolt.opacity

        ctx.beginPath()
        const firstPoint = bolt.points[0]
        if (firstPoint) {
          ctx.moveTo(firstPoint.x, firstPoint.y)
          for (let j = 1; j < bolt.points.length; j++) {
            const point = bolt.points[j]
            if (point) ctx.lineTo(point.x, point.y)
          }
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.opacity * fadeOp})`
        ctx.lineWidth = bolt.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        // Inner bright core
        ctx.beginPath()
        if (firstPoint) {
          ctx.moveTo(firstPoint.x, firstPoint.y)
          for (let j = 1; j < bolt.points.length; j++) {
            const point = bolt.points[j]
            if (point) ctx.lineTo(point.x, point.y)
          }
        }
        ctx.strokeStyle = `rgba(200, 230, 255, ${bolt.opacity * 0.8 * fadeOp})`
        ctx.lineWidth = bolt.width * 0.5
        ctx.stroke()

        ctx.shadowBlur = 0

        // Flash effect
        if (bolt.life > 0.8) {
          ctx.fillStyle = `rgba(200, 220, 255, ${(bolt.life - 0.8) * 0.3 * fadeOp})`
          ctx.fillRect(0, 0, width, height)
        }
      }

      // Electric particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.opacity -= 0.02
        p.vy += 0.1

        if (p.opacity <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${toHexAlpha(p.opacity * fadeOp)}`
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: SLASH (Sword Strike)
// ========================================

function SlashAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Slash trails
    interface SlashTrail {
      startX: number; startY: number
      endX: number; endY: number
      progress: number
      opacity: number
      width: number
      color: string
      curve: number
    }
    const slashes: SlashTrail[] = []

    // Sparks
    const sparks: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = []

    // Impact rings
    const impacts: { x: number; y: number; radius: number; maxRadius: number; opacity: number }[] = []

    const SLASH_COLORS = ['#FFFFFF', '#E8E8E8', '#C0C0C0', '#A8D8FF', '#FFE4B5']

    let lastSlashTime = 0
    let slashCount = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dark dramatic background
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, width, height)

      // Radial vignette
      const vignetteGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7)
      vignetteGrad.addColorStop(0, 'transparent')
      vignetteGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)')
      vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
      ctx.fillStyle = vignetteGrad
      ctx.fillRect(0, 0, width, height)

      // Create new slashes
      if (elapsed - lastSlashTime > random(300, 600) && progress < 80 && slashCount < 15) {
        const angle = random(-Math.PI / 4, Math.PI / 4) + (slashCount % 2 === 0 ? 0 : Math.PI)
        const len = random(300, 500)
        const startX = centerX + random(-100, 100)
        const startY = centerY + random(-100, 100)

        slashes.push({
          startX, startY,
          endX: startX + Math.cos(angle) * len,
          endY: startY + Math.sin(angle) * len,
          progress: 0, opacity: 1, width: random(3, 8),
          color: randomChoice(SLASH_COLORS),
          curve: random(-50, 50)
        })

        // Add impact
        impacts.push({
          x: startX + Math.cos(angle) * len * 0.5,
          y: startY + Math.sin(angle) * len * 0.5,
          radius: 0, maxRadius: random(80, 150), opacity: 1
        })

        lastSlashTime = elapsed
        slashCount++
      }

      // Draw impacts
      for (let i = impacts.length - 1; i >= 0; i--) {
        const imp = impacts[i]
        if (!imp) continue
        imp.radius += 8
        imp.opacity = 1 - imp.radius / imp.maxRadius

        if (imp.opacity <= 0) {
          impacts.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${imp.opacity * 0.5 * fadeOp})`
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Draw slashes
      for (let i = slashes.length - 1; i >= 0; i--) {
        const slash = slashes[i]
        if (!slash) continue

        slash.progress = Math.min(slash.progress + 0.08, 1)
        if (slash.progress >= 1) {
          slash.opacity -= 0.03
        }

        if (slash.opacity <= 0) {
          slashes.splice(i, 1)
          continue
        }

        const currentEndX = slash.startX + (slash.endX - slash.startX) * easeOutExpo(slash.progress)
        const currentEndY = slash.startY + (slash.endY - slash.startY) * easeOutExpo(slash.progress)
        const midX = (slash.startX + currentEndX) / 2 + slash.curve
        const midY = (slash.startY + currentEndY) / 2

        // Glow
        ctx.shadowColor = '#FFFFFF'
        ctx.shadowBlur = 20 * slash.opacity

        // Slash trail with curve
        ctx.beginPath()
        ctx.moveTo(slash.startX, slash.startY)
        ctx.quadraticCurveTo(midX, midY, currentEndX, currentEndY)

        const gradient = ctx.createLinearGradient(slash.startX, slash.startY, currentEndX, currentEndY)
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`)
        gradient.addColorStop(0.3, `rgba(255, 255, 255, ${slash.opacity * fadeOp})`)
        gradient.addColorStop(0.7, `rgba(200, 220, 255, ${slash.opacity * fadeOp})`)
        gradient.addColorStop(1, `rgba(255, 255, 255, ${slash.opacity * 0.5 * fadeOp})`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = slash.width
        ctx.lineCap = 'round'
        ctx.stroke()

        ctx.shadowBlur = 0

        // Spawn sparks at slash tip
        if (slash.progress < 0.9 && random(0, 1) > 0.5) {
          for (let j = 0; j < 3; j++) {
            sparks.push({
              x: currentEndX, y: currentEndY,
              vx: random(-8, 8), vy: random(-8, 8),
              size: random(1, 3), opacity: 1,
              color: randomChoice(['#FFFFFF', '#FFE4B5', '#FFA500'])
            })
          }
        }
      }

      // Draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i]
        if (!spark) continue
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vy += 0.3
        spark.vx *= 0.98
        spark.opacity -= 0.03

        if (spark.opacity <= 0) {
          sparks.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
        ctx.fillStyle = `${spark.color}${toHexAlpha(spark.opacity * fadeOp)}`
        ctx.fill()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: PHOENIX (Fire Bird)
// ========================================

function PhoenixAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Fire particles
    const fireParticles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string; life: number }[] = []

    // Feather particles
    const feathers: { x: number; y: number; vx: number; vy: number; rotation: number; rotSpeed: number; size: number; opacity: number; color: string }[] = []

    // Phoenix wing positions
    let wingAngle = 0
    let phoenixY = height + 100
    let phoenixScale = 0

    const FIRE_COLORS = ['#FF4500', '#FF6B00', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00']
    const FEATHER_COLORS = ['#FF4500', '#FF6B00', '#FFD700', '#FFA500']

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dark to warm gradient background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#1a0a00')
      bgGrad.addColorStop(0.5, '#0f0505')
      bgGrad.addColorStop(1, '#050202')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Phoenix rises
      if (progress > 5) {
        phoenixY = height * 0.9 - (progress / 100) * height * 0.5
        phoenixScale = Math.min(1, (progress - 5) / 30)
      }
      wingAngle = Math.sin(elapsed * 0.005) * 0.3

      // Draw phoenix silhouette with fire
      if (phoenixScale > 0) {
        ctx.save()
        ctx.translate(centerX, phoenixY)
        ctx.scale(phoenixScale, phoenixScale)

        // Body glow
        const bodyGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 150)
        bodyGlow.addColorStop(0, `rgba(255, 150, 0, ${0.8 * fadeOp})`)
        bodyGlow.addColorStop(0.5, `rgba(255, 100, 0, ${0.4 * fadeOp})`)
        bodyGlow.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(0, 0, 150, 0, Math.PI * 2)
        ctx.fillStyle = bodyGlow
        ctx.fill()

        // Wings
        for (let side = -1; side <= 1; side += 2) {
          ctx.save()
          ctx.scale(side, 1)
          ctx.rotate(wingAngle * side)

          // Wing shape
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.quadraticCurveTo(80, -60, 180, -40)
          ctx.quadraticCurveTo(220, -20, 250, 20)
          ctx.quadraticCurveTo(200, 40, 120, 30)
          ctx.quadraticCurveTo(60, 20, 0, 0)
          ctx.closePath()

          const wingGrad = ctx.createLinearGradient(0, 0, 200, 0)
          wingGrad.addColorStop(0, `rgba(255, 200, 0, ${0.9 * fadeOp})`)
          wingGrad.addColorStop(0.5, `rgba(255, 100, 0, ${0.7 * fadeOp})`)
          wingGrad.addColorStop(1, `rgba(255, 50, 0, ${0.5 * fadeOp})`)
          ctx.fillStyle = wingGrad
          ctx.fill()

          ctx.restore()
        }

        // Head
        ctx.beginPath()
        ctx.arc(0, -60, 30, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 200, 50, ${0.9 * fadeOp})`
        ctx.fill()

        // Tail feathers
        for (let i = 0; i < 5; i++) {
          const tailAngle = (i - 2) * 0.2
          ctx.save()
          ctx.rotate(tailAngle)
          ctx.beginPath()
          ctx.moveTo(0, 30)
          ctx.quadraticCurveTo(20, 100, 0, 200 + i * 20)
          ctx.quadraticCurveTo(-20, 100, 0, 30)
          const tailGrad = ctx.createLinearGradient(0, 30, 0, 200)
          tailGrad.addColorStop(0, `rgba(255, 150, 0, ${0.8 * fadeOp})`)
          tailGrad.addColorStop(1, `rgba(255, 50, 0, ${0.3 * fadeOp})`)
          ctx.fillStyle = tailGrad
          ctx.fill()
          ctx.restore()
        }

        ctx.restore()

        // Spawn fire particles around phoenix
        if (random(0, 1) > 0.3 && progress < 85) {
          for (let i = 0; i < 5; i++) {
            fireParticles.push({
              x: centerX + random(-100, 100) * phoenixScale,
              y: phoenixY + random(-50, 50) * phoenixScale,
              vx: random(-2, 2), vy: random(-5, -2),
              size: random(5, 15), opacity: 1,
              color: randomChoice(FIRE_COLORS), life: 1
            })
          }
        }

        // Spawn feathers
        if (random(0, 1) > 0.9 && progress < 85) {
          feathers.push({
            x: centerX + random(-150, 150) * phoenixScale,
            y: phoenixY + random(-100, 50) * phoenixScale,
            vx: random(-2, 2), vy: random(-3, -1),
            rotation: random(0, Math.PI * 2), rotSpeed: random(-0.1, 0.1),
            size: random(10, 25), opacity: 1,
            color: randomChoice(FEATHER_COLORS)
          })
        }
      }

      // Draw fire particles
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        const p = fireParticles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.05
        p.life -= 0.02
        p.opacity = p.life
        p.size *= 0.98

        if (p.life <= 0) {
          fireParticles.splice(i, 1)
          continue
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
        grad.addColorStop(0, `${p.color}${toHexAlpha(p.opacity * fadeOp)}`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Draw feathers
      for (let i = feathers.length - 1; i >= 0; i--) {
        const f = feathers[i]
        if (!f) continue
        f.x += f.vx
        f.y += f.vy
        f.rotation += f.rotSpeed
        f.opacity -= 0.008
        f.vx *= 0.99

        if (f.opacity <= 0) {
          feathers.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate(f.rotation)

        // Feather shape
        ctx.beginPath()
        ctx.ellipse(0, 0, f.size * 0.3, f.size, 0, 0, Math.PI * 2)
        ctx.fillStyle = `${f.color}${toHexAlpha(f.opacity * fadeOp)}`
        ctx.fill()

        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: ROYAL (Crown/Emblem)
// ========================================

function RoyalAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Gold particles
    const goldParticles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; sparkle: number }[] = []

    // Emblem rays
    let rayAngle = 0

    // Crown scale
    let crownScale = 0
    let crownY = centerY

    const GOLD_COLORS = ['#FFD700', '#FFC125', '#DAA520', '#F0E68C', '#FFEC8B']

    const drawCrown = (x: number, y: number, scale: number, opacity: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.globalAlpha = opacity

      // Crown base
      ctx.beginPath()
      ctx.moveTo(-80, 40)
      ctx.lineTo(-90, -20)
      ctx.lineTo(-60, 0)
      ctx.lineTo(-30, -50)
      ctx.lineTo(0, -10)
      ctx.lineTo(30, -50)
      ctx.lineTo(60, 0)
      ctx.lineTo(90, -20)
      ctx.lineTo(80, 40)
      ctx.closePath()

      const crownGrad = ctx.createLinearGradient(0, -50, 0, 40)
      crownGrad.addColorStop(0, '#FFD700')
      crownGrad.addColorStop(0.5, '#FFC125')
      crownGrad.addColorStop(1, '#DAA520')
      ctx.fillStyle = crownGrad
      ctx.fill()

      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 3
      ctx.stroke()

      // Crown jewels
      const jewelPositions = [{ x: -30, y: -35 }, { x: 0, y: -5 }, { x: 30, y: -35 }]
      const jewelColors = ['#FF0000', '#0000FF', '#FF0000']

      jewelPositions.forEach((pos, i) => {
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2)
        const jewelGrad = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, 10)
        jewelGrad.addColorStop(0, '#FFFFFF')
        jewelGrad.addColorStop(0.3, jewelColors[i] ?? '#FF0000')
        jewelGrad.addColorStop(1, '#800000')
        ctx.fillStyle = jewelGrad
        ctx.fill()
      })

      // Crown rim
      ctx.beginPath()
      ctx.ellipse(0, 40, 85, 15, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#DAA520'
      ctx.fill()
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.restore()
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Royal blue background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#1a1a40')
      bgGrad.addColorStop(0.5, '#0f0f2d')
      bgGrad.addColorStop(1, '#050515')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Animated rays from center
      rayAngle += 0.005
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rayAngle)

      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6)
        const rayGrad = ctx.createLinearGradient(0, 0, 0, -400)
        rayGrad.addColorStop(0, `rgba(255, 215, 0, ${0.3 * fadeOp})`)
        rayGrad.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.moveTo(-15, 0)
        ctx.lineTo(0, -400)
        ctx.lineTo(15, 0)
        ctx.closePath()
        ctx.fillStyle = rayGrad
        ctx.fill()
      }
      ctx.restore()

      // Crown animation
      if (progress > 10) {
        crownScale = Math.min(1, (progress - 10) / 30) * easeOutExpo((progress - 10) / 30)
        crownY = centerY - 50 + Math.sin(elapsed * 0.002) * 10
      }

      // Glow behind crown
      if (crownScale > 0) {
        const glowGrad = ctx.createRadialGradient(centerX, crownY, 0, centerX, crownY, 200 * crownScale)
        glowGrad.addColorStop(0, `rgba(255, 215, 0, ${0.5 * fadeOp})`)
        glowGrad.addColorStop(0.5, `rgba(255, 200, 0, ${0.2 * fadeOp})`)
        glowGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(centerX, crownY, 200 * crownScale, 0, Math.PI * 2)
        ctx.fillStyle = glowGrad
        ctx.fill()

        drawCrown(centerX, crownY, crownScale, fadeOp)
      }

      // Gold particles
      if (random(0, 1) > 0.7 && progress < 85) {
        goldParticles.push({
          x: random(0, width), y: height + 20,
          vx: random(-1, 1), vy: random(-3, -1),
          size: random(3, 8), opacity: 1,
          sparkle: random(0, Math.PI * 2)
        })
      }

      for (let i = goldParticles.length - 1; i >= 0; i--) {
        const p = goldParticles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.sparkle += 0.2
        p.opacity -= 0.005

        if (p.opacity <= 0 || p.y < -50) {
          goldParticles.splice(i, 1)
          continue
        }

        const sparkle = 0.5 + 0.5 * Math.sin(p.sparkle)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * sparkle, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity * sparkle * fadeOp})`
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: SHOCKWAVE (Energy Wave)
// ========================================

function ShockwaveAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Shockwave rings
    interface ShockwaveRing {
      radius: number
      maxRadius: number
      opacity: number
      width: number
      color: string
    }
    const rings: ShockwaveRing[] = []

    // Energy particles
    const particles: { x: number; y: number; angle: number; speed: number; size: number; opacity: number; color: string }[] = []

    // Core energy
    let coreSize = 0
    let corePulse = 0

    const ENERGY_COLORS = ['#00BFFF', '#1E90FF', '#4169E1', '#00CED1', '#40E0D0', '#FFFFFF']

    let lastRingTime = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dark background
      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, width, height)

      // Core energy charging
      if (progress < 30) {
        coreSize = (progress / 30) * 80
      } else {
        coreSize = 80 + Math.sin(corePulse) * 20
        corePulse += 0.1
      }

      // Create shockwave rings
      if (progress > 25 && elapsed - lastRingTime > 400 && progress < 85) {
        rings.push({
          radius: 50,
          maxRadius: Math.max(width, height),
          opacity: 1,
          width: random(5, 15),
          color: randomChoice(ENERGY_COLORS)
        })
        lastRingTime = elapsed

        // Burst particles
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2
          particles.push({
            x: centerX, y: centerY,
            angle, speed: random(5, 15),
            size: random(2, 6), opacity: 1,
            color: randomChoice(ENERGY_COLORS)
          })
        }
      }

      // Draw shockwave rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]
        if (!ring) continue
        ring.radius += 15
        ring.opacity = 1 - ring.radius / ring.maxRadius

        if (ring.opacity <= 0) {
          rings.splice(i, 1)
          continue
        }

        // Outer glow
        ctx.beginPath()
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${ring.color}${toHexAlpha(ring.opacity * 0.3 * fadeOp)}`
        ctx.lineWidth = ring.width * 3
        ctx.stroke()

        // Main ring
        ctx.beginPath()
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${ring.color}${toHexAlpha(ring.opacity * fadeOp)}`
        ctx.lineWidth = ring.width
        ctx.stroke()

        // Inner bright ring
        ctx.beginPath()
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity * 0.5 * fadeOp})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw energy particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue
        p.x += Math.cos(p.angle) * p.speed
        p.y += Math.sin(p.angle) * p.speed
        p.speed *= 0.98
        p.opacity -= 0.015

        if (p.opacity <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${toHexAlpha(p.opacity * fadeOp)}`
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Draw core
      // Outer glow
      const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize * 2)
      coreGlow.addColorStop(0, `rgba(0, 191, 255, ${0.5 * fadeOp})`)
      coreGlow.addColorStop(0.5, `rgba(30, 144, 255, ${0.2 * fadeOp})`)
      coreGlow.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreSize * 2, 0, Math.PI * 2)
      ctx.fillStyle = coreGlow
      ctx.fill()

      // Core
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize)
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fadeOp})`)
      coreGrad.addColorStop(0.3, `rgba(135, 206, 250, ${0.8 * fadeOp})`)
      coreGrad.addColorStop(0.7, `rgba(30, 144, 255, ${0.6 * fadeOp})`)
      coreGrad.addColorStop(1, `rgba(0, 100, 200, ${0.3 * fadeOp})`)
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      // Electric arcs around core
      if (progress > 20) {
        ctx.strokeStyle = `rgba(150, 220, 255, ${0.7 * fadeOp})`
        ctx.lineWidth = 2
        for (let i = 0; i < 6; i++) {
          const arcAngle = (i / 6) * Math.PI * 2 + elapsed * 0.003
          const startR = coreSize * 1.2
          const endR = coreSize * 1.8

          ctx.beginPath()
          let px = centerX + Math.cos(arcAngle) * startR
          let py = centerY + Math.sin(arcAngle) * startR
          ctx.moveTo(px, py)

          for (let j = 0; j < 5; j++) {
            const r = startR + (endR - startR) * (j / 5)
            const jitter = random(-15, 15)
            px = centerX + Math.cos(arcAngle + jitter * 0.01) * r + jitter
            py = centerY + Math.sin(arcAngle + jitter * 0.01) * r + jitter
            ctx.lineTo(px, py)
          }
          ctx.stroke()
        }
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: ROYAL PLUS (Premium Crown)
// ========================================

function RoyalPlusAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Floating gems
    interface Gem { x: number; y: number; size: number; color: string; rotation: number; rotSpeed: number; sparkle: number; floatPhase: number }
    const gems: Gem[] = []
    const GEM_COLORS = ['#FF0000', '#0066FF', '#00FF00', '#FF00FF', '#00FFFF', '#FFD700']
    for (let i = 0; i < 20; i++) {
      gems.push({
        x: random(width * 0.1, width * 0.9), y: random(height * 0.2, height * 0.8),
        size: random(15, 35), color: randomChoice(GEM_COLORS),
        rotation: random(0, Math.PI * 2), rotSpeed: random(-0.02, 0.02),
        sparkle: random(0, Math.PI * 2), floatPhase: random(0, Math.PI * 2)
      })
    }

    // Gold confetti
    const confetti: { x: number; y: number; vx: number; vy: number; rotation: number; rotSpeed: number; size: number; type: string }[] = []

    // Ribbons
    const ribbons: { x: number; y: number; length: number; phase: number; speed: number; color: string }[] = []
    for (let i = 0; i < 8; i++) {
      ribbons.push({
        x: random(0, width), y: random(-100, height * 0.3),
        length: random(100, 200), phase: random(0, Math.PI * 2),
        speed: random(0.02, 0.04), color: randomChoice(['#FFD700', '#FFC125', '#FF6B6B', '#4169E1'])
      })
    }

    // Crown animation state
    let crownScale = 0, crownY = centerY + 100
    let rayAngle = 0

    // Ornate frame corners
    const drawOrnateCorner = (x: number, y: number, scaleX: number, scaleY: number, opacity: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scaleX, scaleY)
      ctx.globalAlpha = opacity
      ctx.strokeStyle = '#DAA520'
      ctx.lineWidth = 3
      ctx.fillStyle = '#FFD70040'

      ctx.beginPath()
      ctx.moveTo(0, 60); ctx.lineTo(0, 0); ctx.lineTo(60, 0)
      ctx.quadraticCurveTo(40, 20, 40, 40)
      ctx.quadraticCurveTo(20, 40, 0, 60)
      ctx.stroke()
      ctx.fill()

      // Decorative curl
      ctx.beginPath()
      ctx.arc(30, 30, 15, 0, Math.PI * 1.5)
      ctx.stroke()

      ctx.restore()
    }

    const drawGem = (x: number, y: number, size: number, color: string, rotation: number, sparkle: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Diamond shape
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size * 0.6, 0)
      ctx.lineTo(0, size)
      ctx.lineTo(-size * 0.6, 0)
      ctx.closePath()

      const gemGrad = ctx.createLinearGradient(-size, -size, size, size)
      gemGrad.addColorStop(0, '#FFFFFF')
      gemGrad.addColorStop(0.3, color)
      gemGrad.addColorStop(0.7, color)
      gemGrad.addColorStop(1, '#000000')
      ctx.fillStyle = gemGrad
      ctx.fill()

      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Sparkle highlight
      const sparkleIntensity = 0.5 + 0.5 * Math.sin(sparkle * 3)
      ctx.beginPath()
      ctx.arc(-size * 0.2, -size * 0.3, size * 0.15 * sparkleIntensity, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${sparkleIntensity})`
      ctx.fill()

      ctx.restore()
    }

    const drawPremiumCrown = (x: number, y: number, scale: number, opacity: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.globalAlpha = opacity

      // Crown glow
      const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 180)
      glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.6)')
      glowGrad.addColorStop(0.5, 'rgba(255, 200, 0, 0.2)')
      glowGrad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(0, 0, 180, 0, Math.PI * 2)
      ctx.fillStyle = glowGrad
      ctx.fill()

      // Crown base with more detail
      ctx.beginPath()
      ctx.moveTo(-100, 50)
      ctx.lineTo(-110, -10)
      ctx.lineTo(-80, 10)
      ctx.lineTo(-50, -60)
      ctx.lineTo(-25, -20)
      ctx.lineTo(0, -80)
      ctx.lineTo(25, -20)
      ctx.lineTo(50, -60)
      ctx.lineTo(80, 10)
      ctx.lineTo(110, -10)
      ctx.lineTo(100, 50)
      ctx.closePath()

      const crownGrad = ctx.createLinearGradient(0, -80, 0, 50)
      crownGrad.addColorStop(0, '#FFF8DC')
      crownGrad.addColorStop(0.3, '#FFD700')
      crownGrad.addColorStop(0.7, '#DAA520')
      crownGrad.addColorStop(1, '#B8860B')
      ctx.fillStyle = crownGrad
      ctx.fill()

      ctx.strokeStyle = '#8B7500'
      ctx.lineWidth = 3
      ctx.stroke()

      // Detailed engravings
      ctx.strokeStyle = 'rgba(139, 117, 0, 0.5)'
      ctx.lineWidth = 1
      for (let i = -80; i <= 80; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 30)
        ctx.quadraticCurveTo(i + 5, 10, i, -10)
        ctx.stroke()
      }

      // Large center jewel
      ctx.beginPath()
      ctx.arc(0, -20, 18, 0, Math.PI * 2)
      const centerJewelGrad = ctx.createRadialGradient(-5, -25, 0, 0, -20, 18)
      centerJewelGrad.addColorStop(0, '#FFFFFF')
      centerJewelGrad.addColorStop(0.3, '#FF0066')
      centerJewelGrad.addColorStop(1, '#8B0033')
      ctx.fillStyle = centerJewelGrad
      ctx.fill()
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 3
      ctx.stroke()

      // Side jewels
      const sideJewels = [{ x: -50, y: -45, color: '#0066FF' }, { x: 50, y: -45, color: '#0066FF' },
                         { x: -25, y: -15, color: '#00FF66' }, { x: 25, y: -15, color: '#00FF66' }]
      sideJewels.forEach(jewel => {
        ctx.beginPath()
        ctx.arc(jewel.x, jewel.y, 10, 0, Math.PI * 2)
        const jGrad = ctx.createRadialGradient(jewel.x - 3, jewel.y - 3, 0, jewel.x, jewel.y, 10)
        jGrad.addColorStop(0, '#FFFFFF')
        jGrad.addColorStop(0.4, jewel.color)
        jGrad.addColorStop(1, '#000033')
        ctx.fillStyle = jGrad
        ctx.fill()
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Crown rim with pattern
      ctx.beginPath()
      ctx.ellipse(0, 50, 105, 18, 0, 0, Math.PI * 2)
      const rimGrad = ctx.createLinearGradient(-105, 50, 105, 50)
      rimGrad.addColorStop(0, '#B8860B')
      rimGrad.addColorStop(0.5, '#FFD700')
      rimGrad.addColorStop(1, '#B8860B')
      ctx.fillStyle = rimGrad
      ctx.fill()
      ctx.strokeStyle = '#8B7500'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.restore()
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Royal velvet background
      const bgGrad = ctx.createRadialGradient(centerX, centerY * 0.7, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#1a0a2e')
      bgGrad.addColorStop(0.4, '#0f0520')
      bgGrad.addColorStop(1, '#050210')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Damask pattern overlay
      ctx.globalAlpha = 0.05 * fadeOp
      for (let x = 0; x < width; x += 80) {
        for (let y = 0; y < height; y += 80) {
          ctx.beginPath()
          ctx.arc(x + 40, y + 40, 20, 0, Math.PI * 2)
          ctx.fillStyle = '#FFD700'
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      // Animated light rays
      rayAngle += 0.003
      ctx.save()
      ctx.translate(centerX, centerY * 0.6)
      ctx.rotate(rayAngle)
      for (let i = 0; i < 16; i++) {
        ctx.rotate(Math.PI / 8)
        const rayGrad = ctx.createLinearGradient(0, 0, 0, -500)
        rayGrad.addColorStop(0, `rgba(255, 215, 0, ${0.4 * fadeOp})`)
        rayGrad.addColorStop(0.5, `rgba(255, 200, 0, ${0.15 * fadeOp})`)
        rayGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.moveTo(-8, 0); ctx.lineTo(0, -500); ctx.lineTo(8, 0)
        ctx.closePath()
        ctx.fillStyle = rayGrad
        ctx.fill()
      }
      ctx.restore()

      // Ornate corners
      const cornerOpacity = Math.min(1, progress / 30) * fadeOp
      drawOrnateCorner(30, 30, 1, 1, cornerOpacity)
      drawOrnateCorner(width - 30, 30, -1, 1, cornerOpacity)
      drawOrnateCorner(30, height - 30, 1, -1, cornerOpacity)
      drawOrnateCorner(width - 30, height - 30, -1, -1, cornerOpacity)

      // Ribbons
      for (const ribbon of ribbons) {
        ribbon.phase += ribbon.speed
        ribbon.y += 1

        if (ribbon.y > height + 100) {
          ribbon.y = -100
          ribbon.x = random(0, width)
        }

        ctx.beginPath()
        ctx.moveTo(ribbon.x, ribbon.y)
        for (let i = 0; i < ribbon.length; i += 10) {
          const wave = Math.sin(ribbon.phase + i * 0.05) * 30
          ctx.lineTo(ribbon.x + wave, ribbon.y + i)
        }
        ctx.strokeStyle = `${ribbon.color}${toHexAlpha(0.7 * fadeOp)}`
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      // Crown animation
      if (progress > 5) {
        crownScale = Math.min(1, (progress - 5) / 25) * easeOutExpo(Math.min(1, (progress - 5) / 25))
        crownY = centerY * 0.6 + Math.sin(elapsed * 0.002) * 15
      }

      if (crownScale > 0) {
        drawPremiumCrown(centerX, crownY, crownScale, fadeOp)
      }

      // Floating gems
      for (const gem of gems) {
        gem.rotation += gem.rotSpeed
        gem.sparkle += 0.1
        gem.floatPhase += 0.02
        const floatY = gem.y + Math.sin(gem.floatPhase) * 20

        drawGem(gem.x, floatY, gem.size, gem.color, gem.rotation, gem.sparkle)
      }

      // Gold confetti
      if (random(0, 1) > 0.6 && progress < 85) {
        for (let i = 0; i < 3; i++) {
          confetti.push({
            x: random(0, width), y: -20,
            vx: random(-2, 2), vy: random(2, 5),
            rotation: random(0, Math.PI * 2), rotSpeed: random(-0.1, 0.1),
            size: random(8, 15), type: randomChoice(['rect', 'circle', 'star'])
          })
        }
      }

      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i]
        if (!c) continue
        c.x += c.vx + Math.sin(elapsed * 0.005 + i) * 0.5
        c.y += c.vy
        c.rotation += c.rotSpeed

        if (c.y > height + 50) {
          confetti.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.translate(c.x, c.y)
        ctx.rotate(c.rotation)
        ctx.fillStyle = `rgba(255, 215, 0, ${0.9 * fadeOp})`

        if (c.type === 'rect') {
          ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2)
        } else if (c.type === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          for (let j = 0; j < 5; j++) {
            const angle = (j / 5) * Math.PI * 2 - Math.PI / 2
            const r = j % 2 === 0 ? c.size : c.size / 2
            j === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r) : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
          }
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: SLASH PLUS (Epic Sword)
// ========================================

function SlashPlusAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Multi-slash system
    interface EpicSlash {
      startX: number; startY: number; endX: number; endY: number
      progress: number; opacity: number; width: number
      afterImages: { x: number; y: number; opacity: number }[]
      color: string; glowColor: string; type: 'single' | 'cross' | 'star'
    }
    const slashes: EpicSlash[] = []

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string; trail: { x: number; y: number }[] }[] = []

    // Screen shake
    let shakeX = 0, shakeY = 0, shakeIntensity = 0

    // Impact flashes
    const flashes: { x: number; y: number; radius: number; opacity: number }[] = []

    // Energy buildup rings
    const energyRings: { radius: number; opacity: number; x: number; y: number }[] = []

    const SLASH_COLORS = [
      { main: '#FFFFFF', glow: '#87CEEB' },
      { main: '#FFD700', glow: '#FFA500' },
      { main: '#FF6B6B', glow: '#FF0000' },
      { main: '#00FFFF', glow: '#0088FF' }
    ]

    let slashPhase = 0
    let lastSlashTime = 0
    let comboCount = 0

    const createEpicSlash = (type: 'single' | 'cross' | 'star'): EpicSlash[] => {
      const color = randomChoice(SLASH_COLORS)
      const results: EpicSlash[] = []

      if (type === 'single') {
        const angle = random(-Math.PI / 3, Math.PI / 3)
        const len = random(400, 600)
        results.push({
          startX: centerX - Math.cos(angle) * len / 2,
          startY: centerY - Math.sin(angle) * len / 2,
          endX: centerX + Math.cos(angle) * len / 2,
          endY: centerY + Math.sin(angle) * len / 2,
          progress: 0, opacity: 1, width: random(5, 12),
          afterImages: [], color: color.main, glowColor: color.glow, type
        })
      } else if (type === 'cross') {
        for (let i = 0; i < 2; i++) {
          const angle = (i === 0 ? -1 : 1) * Math.PI / 4
          const len = 500
          results.push({
            startX: centerX - Math.cos(angle) * len / 2,
            startY: centerY - Math.sin(angle) * len / 2,
            endX: centerX + Math.cos(angle) * len / 2,
            endY: centerY + Math.sin(angle) * len / 2,
            progress: 0, opacity: 1, width: 10,
            afterImages: [], color: color.main, glowColor: color.glow, type
          })
        }
      } else {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          results.push({
            startX: centerX, startY: centerY,
            endX: centerX + Math.cos(angle) * 350,
            endY: centerY + Math.sin(angle) * 350,
            progress: 0, opacity: 1, width: 8,
            afterImages: [], color: color.main, glowColor: color.glow, type
          })
        }
      }

      return results
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Update shake
      shakeIntensity *= 0.9
      shakeX = (random(-1, 1)) * shakeIntensity
      shakeY = (random(-1, 1)) * shakeIntensity

      ctx.save()
      ctx.translate(shakeX, shakeY)

      // Dark dramatic background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#0a0a12')
      bgGrad.addColorStop(0.5, '#050508')
      bgGrad.addColorStop(1, '#000002')
      ctx.fillStyle = bgGrad
      ctx.fillRect(-50, -50, width + 100, height + 100)

      // Speed lines background
      if (progress > 20 && progress < 85) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * fadeOp})`
        ctx.lineWidth = 1
        for (let i = 0; i < 30; i++) {
          const angle = random(0, Math.PI * 2)
          const dist = random(200, 500)
          ctx.beginPath()
          ctx.moveTo(centerX + Math.cos(angle) * 100, centerY + Math.sin(angle) * 100)
          ctx.lineTo(centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist)
          ctx.stroke()
        }
      }

      // Create slashes based on combo
      if (progress > 15 && elapsed - lastSlashTime > 500 && progress < 80) {
        slashPhase++
        const types: ('single' | 'cross' | 'star')[] = ['single', 'single', 'cross', 'single', 'star']
        const type = types[slashPhase % types.length] ?? 'single'
        const newSlashes = createEpicSlash(type)
        slashes.push(...newSlashes)
        lastSlashTime = elapsed
        comboCount++

        shakeIntensity = type === 'star' ? 20 : type === 'cross' ? 15 : 10

        // Energy rings at center
        for (let i = 0; i < 3; i++) {
          energyRings.push({ radius: 20 + i * 20, opacity: 1, x: centerX, y: centerY })
        }
      }

      // Draw energy rings
      for (let i = energyRings.length - 1; i >= 0; i--) {
        const ring = energyRings[i]
        if (!ring) continue
        ring.radius += 20
        ring.opacity -= 0.05

        if (ring.opacity <= 0) {
          energyRings.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity * fadeOp})`
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Draw slashes
      for (let i = slashes.length - 1; i >= 0; i--) {
        const slash = slashes[i]
        if (!slash) continue

        slash.progress = Math.min(slash.progress + 0.12, 1)

        // Add afterimages
        if (slash.progress < 0.8) {
          const currentX = slash.startX + (slash.endX - slash.startX) * slash.progress
          const currentY = slash.startY + (slash.endY - slash.startY) * slash.progress
          slash.afterImages.push({ x: currentX, y: currentY, opacity: 0.8 })
        }

        // Fade afterimages
        for (let j = slash.afterImages.length - 1; j >= 0; j--) {
          const img = slash.afterImages[j]
          if (!img) continue
          img.opacity -= 0.05
          if (img.opacity <= 0) slash.afterImages.splice(j, 1)
        }

        if (slash.progress >= 1) {
          slash.opacity -= 0.08
        }

        if (slash.opacity <= 0) {
          slashes.splice(i, 1)
          continue
        }

        const currentEndX = slash.startX + (slash.endX - slash.startX) * easeOutExpo(slash.progress)
        const currentEndY = slash.startY + (slash.endY - slash.startY) * easeOutExpo(slash.progress)

        // Draw afterimages
        for (const img of slash.afterImages) {
          ctx.beginPath()
          ctx.arc(img.x, img.y, slash.width * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = `${slash.glowColor}${toHexAlpha(img.opacity * fadeOp * 0.39)}`
          ctx.fill()
        }

        // Outer glow
        ctx.shadowColor = slash.glowColor
        ctx.shadowBlur = 40 * slash.opacity

        // Main slash
        ctx.beginPath()
        ctx.moveTo(slash.startX, slash.startY)
        ctx.lineTo(currentEndX, currentEndY)

        const gradient = ctx.createLinearGradient(slash.startX, slash.startY, currentEndX, currentEndY)
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(0.2, `${slash.color}${toHexAlpha(slash.opacity * fadeOp)}`)
        gradient.addColorStop(0.8, `${slash.color}${toHexAlpha(slash.opacity * fadeOp)}`)
        gradient.addColorStop(1, 'transparent')

        ctx.strokeStyle = gradient
        ctx.lineWidth = slash.width
        ctx.lineCap = 'round'
        ctx.stroke()

        ctx.shadowBlur = 0

        // Sparks at tip
        if (slash.progress < 0.9 && random(0, 1) > 0.4) {
          for (let j = 0; j < 5; j++) {
            particles.push({
              x: currentEndX, y: currentEndY,
              vx: random(-15, 15), vy: random(-15, 15),
              size: random(2, 5), opacity: 1,
              color: randomChoice([slash.color, slash.glowColor, '#FFFFFF']),
              trail: []
            })
          }
        }
      }

      // Draw flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const flash = flashes[i]
        if (!flash) continue
        flash.radius += 30
        flash.opacity -= 0.1

        if (flash.opacity <= 0) {
          flashes.splice(i, 1)
          continue
        }

        const flashGrad = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.radius)
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flash.opacity * fadeOp})`)
        flashGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2)
        ctx.fillStyle = flashGrad
        ctx.fill()
      }

      // Draw particles with trails
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue

        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 8) p.trail.shift()

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.95
        p.vy *= 0.95
        p.opacity -= 0.02

        if (p.opacity <= 0) {
          particles.splice(i, 1)
          continue
        }

        // Draw trail
        if (p.trail.length > 1) {
          ctx.beginPath()
          const firstTrail = p.trail[0]
          if (firstTrail) {
            ctx.moveTo(firstTrail.x, firstTrail.y)
            for (let j = 1; j < p.trail.length; j++) {
              const pt = p.trail[j]
              if (pt) ctx.lineTo(pt.x, pt.y)
            }
          }
          ctx.strokeStyle = `${p.color}${toHexAlpha(p.opacity * 0.5 * fadeOp)}`
          ctx.lineWidth = p.size * 0.5
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${toHexAlpha(p.opacity * fadeOp)}`
        ctx.fill()
      }

      // Combo counter
      if (comboCount > 0 && progress < 85) {
        ctx.font = `bold ${40 + comboCount * 2}px Arial`
        ctx.textAlign = 'center'
        ctx.fillStyle = `rgba(255, 215, 0, ${0.8 * fadeOp})`
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 20
        ctx.fillText(`${comboCount} HIT!`, centerX, height * 0.15)
        ctx.shadowBlur = 0
      }

      ctx.restore()

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// VERSION: SHOCKWAVE PLUS (Ultimate Energy)
// ========================================

function ShockwavePlusAnimation({ canvasRef, onProgress }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onProgress: (p: number) => void }) {
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = window.innerWidth, height = window.innerHeight
    canvas.width = width; canvas.height = height
    const centerX = width / 2, centerY = height / 2
    startTimeRef.current = performance.now()

    // Multi-layered shockwaves
    interface MegaRing {
      radius: number; maxRadius: number; opacity: number; width: number
      color: string; speed: number; distortion: number
    }
    const rings: MegaRing[] = []

    // Energy particles in vortex
    const vortexParticles: { angle: number; radius: number; size: number; speed: number; color: string; opacity: number }[] = []
    for (let i = 0; i < 100; i++) {
      vortexParticles.push({
        angle: random(0, Math.PI * 2), radius: random(50, 300),
        size: random(2, 6), speed: random(0.02, 0.05),
        color: randomChoice(['#00BFFF', '#1E90FF', '#00CED1', '#FFFFFF', '#FF00FF']),
        opacity: random(0.5, 1)
      })
    }

    // Lightning arcs
    interface LightningArc { points: { x: number; y: number }[]; opacity: number; color: string }
    const arcs: LightningArc[] = []

    // Core state
    let coreSize = 0, corePulse = 0
    let chargeLevel = 0
    let lastRingTime = 0
    let burstMode = false

    // Orbiting energy orbs
    const orbs: { angle: number; radius: number; size: number; speed: number; color: string; trail: { x: number; y: number }[] }[] = []
    for (let i = 0; i < 6; i++) {
      orbs.push({
        angle: (i / 6) * Math.PI * 2, radius: 150, size: 15,
        speed: 0.03, color: randomChoice(['#00BFFF', '#FF00FF', '#00FF00', '#FFFF00']),
        trail: []
      })
    }

    const ENERGY_COLORS = ['#00BFFF', '#1E90FF', '#4169E1', '#00CED1', '#40E0D0', '#FF00FF', '#00FF88']

    const createLightningArc = (): LightningArc => {
      const points: { x: number; y: number }[] = []
      const startAngle = random(0, Math.PI * 2)
      const endAngle = startAngle + random(Math.PI / 4, Math.PI / 2) * (random(0, 1) > 0.5 ? 1 : -1)
      const segments = 10

      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const angle = startAngle + (endAngle - startAngle) * t
        const baseRadius = coreSize * 1.5 + t * 100
        const jitter = random(-30, 30)
        points.push({
          x: centerX + Math.cos(angle) * (baseRadius + jitter),
          y: centerY + Math.sin(angle) * (baseRadius + jitter)
        })
      }

      return { points, opacity: 1, color: randomChoice(ENERGY_COLORS) }
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(100, (elapsed / 6000) * 100)
      onProgress(progress)
      const fadeOp = progress > 85 ? 1 - (progress - 85) / 15 : 1

      // Dynamic background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      bgGrad.addColorStop(0, '#0a0520')
      bgGrad.addColorStop(0.3, '#050210')
      bgGrad.addColorStop(1, '#000005')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Distortion effect (simulated)
      if (burstMode) {
        ctx.save()
        ctx.globalAlpha = 0.1 * fadeOp
        ctx.drawImage(canvas, random(-5, 5), random(-5, 5))
        ctx.restore()
      }

      // Charge phase
      if (progress < 35) {
        chargeLevel = progress / 35
        coreSize = 30 + chargeLevel * 70

        // Charging particles converging
        for (const p of vortexParticles) {
          p.radius = Math.max(50, p.radius - 1)
          p.angle += p.speed * (1 + chargeLevel)
        }
      } else {
        burstMode = true
        coreSize = 100 + Math.sin(corePulse) * 30
        corePulse += 0.15

        // Create shockwaves
        if (elapsed - lastRingTime > 300 && progress < 85) {
          const colorSet = randomChoice(ENERGY_COLORS)
          for (let i = 0; i < 3; i++) {
            rings.push({
              radius: coreSize + i * 20, maxRadius: Math.max(width, height) * 0.8,
              opacity: 1, width: random(8, 20), color: colorSet,
              speed: 15 + i * 5, distortion: random(0, Math.PI * 2)
            })
          }
          lastRingTime = elapsed

          // Lightning burst
          for (let i = 0; i < 5; i++) {
            arcs.push(createLightningArc())
          }
        }
      }

      // Draw vortex particles
      for (const p of vortexParticles) {
        if (progress >= 35) {
          p.radius = Math.min(500, p.radius + 2)
        }
        p.angle += p.speed

        const x = centerX + Math.cos(p.angle) * p.radius
        const y = centerY + Math.sin(p.angle) * p.radius

        ctx.beginPath()
        ctx.arc(x, y, p.size * (burstMode ? 1.5 : 1), 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${toHexAlpha(p.opacity * fadeOp)}`
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Draw orbiting energy orbs with trails
      for (const orb of orbs) {
        orb.angle += orb.speed * (burstMode ? 2 : 1)
        const orbRadius = burstMode ? orb.radius + Math.sin(elapsed * 0.01) * 50 : orb.radius * chargeLevel
        const orbX = centerX + Math.cos(orb.angle) * orbRadius
        const orbY = centerY + Math.sin(orb.angle) * orbRadius

        orb.trail.push({ x: orbX, y: orbY })
        if (orb.trail.length > 20) orb.trail.shift()

        // Draw trail
        if (orb.trail.length > 1) {
          ctx.beginPath()
          const first = orb.trail[0]
          if (first) ctx.moveTo(first.x, first.y)
          for (let i = 1; i < orb.trail.length; i++) {
            const pt = orb.trail[i]
            if (pt) ctx.lineTo(pt.x, pt.y)
          }
          ctx.strokeStyle = `${orb.color}${toHexAlpha(0.5 * fadeOp)}`
          ctx.lineWidth = orb.size * 0.5
          ctx.stroke()
        }

        // Draw orb
        const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orb.size * 2)
        orbGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fadeOp})`)
        orbGrad.addColorStop(0.3, `${orb.color}${toHexAlpha(0.8 * fadeOp)}`)
        orbGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(orbX, orbY, orb.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = orbGrad
        ctx.fill()
      }

      // Draw shockwave rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]
        if (!ring) continue
        ring.radius += ring.speed
        ring.opacity = 1 - ring.radius / ring.maxRadius

        if (ring.opacity <= 0) {
          rings.splice(i, 1)
          continue
        }

        // Distorted ring
        ctx.beginPath()
        for (let j = 0; j <= 60; j++) {
          const angle = (j / 60) * Math.PI * 2
          const distort = Math.sin(angle * 6 + ring.distortion) * (ring.radius * 0.02)
          const r = ring.radius + distort
          const x = centerX + Math.cos(angle) * r
          const y = centerY + Math.sin(angle) * r
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.closePath()

        // Multi-layer glow
        ctx.strokeStyle = `${ring.color}${toHexAlpha(ring.opacity * 0.2 * fadeOp)}`
        ctx.lineWidth = ring.width * 4
        ctx.stroke()

        ctx.strokeStyle = `${ring.color}${toHexAlpha(ring.opacity * 0.5 * fadeOp)}`
        ctx.lineWidth = ring.width * 2
        ctx.stroke()

        ctx.strokeStyle = `${ring.color}${toHexAlpha(ring.opacity * fadeOp)}`
        ctx.lineWidth = ring.width
        ctx.stroke()

        ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity * 0.8 * fadeOp})`
        ctx.lineWidth = 2
        ctx.stroke()

        ring.distortion += 0.1
      }

      // Draw lightning arcs
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i]
        if (!arc) continue
        arc.opacity -= 0.05

        if (arc.opacity <= 0) {
          arcs.splice(i, 1)
          continue
        }

        ctx.beginPath()
        const firstPoint = arc.points[0]
        if (firstPoint) {
          ctx.moveTo(firstPoint.x, firstPoint.y)
          for (let j = 1; j < arc.points.length; j++) {
            const pt = arc.points[j]
            if (pt) ctx.lineTo(pt.x, pt.y)
          }
        }
        ctx.strokeStyle = `${arc.color}${toHexAlpha(arc.opacity * fadeOp)}`
        ctx.lineWidth = 3
        ctx.shadowColor = arc.color
        ctx.shadowBlur = 20
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Draw core
      // Outer corona
      const coronaGrad = ctx.createRadialGradient(centerX, centerY, coreSize * 0.8, centerX, centerY, coreSize * 3)
      coronaGrad.addColorStop(0, `rgba(0, 200, 255, ${0.6 * fadeOp})`)
      coronaGrad.addColorStop(0.3, `rgba(100, 0, 255, ${0.3 * fadeOp})`)
      coronaGrad.addColorStop(0.6, `rgba(255, 0, 128, ${0.15 * fadeOp})`)
      coronaGrad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreSize * 3, 0, Math.PI * 2)
      ctx.fillStyle = coronaGrad
      ctx.fill()

      // Core glow layers
      for (let layer = 3; layer >= 0; layer--) {
        const layerSize = coreSize * (1 + layer * 0.3)
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, layerSize)
        if (layer === 0) {
          coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * fadeOp})`)
          coreGrad.addColorStop(0.5, `rgba(150, 220, 255, ${0.8 * fadeOp})`)
          coreGrad.addColorStop(1, `rgba(0, 150, 255, ${0.4 * fadeOp})`)
        } else {
          const colors = ['rgba(0, 200, 255, ', 'rgba(128, 0, 255, ', 'rgba(255, 0, 128, ']
          const color = colors[(layer - 1) % 3] ?? 'rgba(0, 200, 255, '
          coreGrad.addColorStop(0, `${color}${0.3 / layer * fadeOp})`)
          coreGrad.addColorStop(1, 'transparent')
        }
        ctx.beginPath()
        ctx.arc(centerX, centerY, layerSize, 0, Math.PI * 2)
        ctx.fillStyle = coreGrad
        ctx.fill()
      }

      // Hexagonal energy pattern in core
      if (progress > 30) {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(elapsed * 0.002)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * fadeOp})`
        ctx.lineWidth = 2

        for (let ring = 1; ring <= 3; ring++) {
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2
            const r = coreSize * 0.3 * ring
            const x = Math.cos(angle) * r, y = Math.sin(angle) * r
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.stroke()
        }
        ctx.restore()
      }

      // Power level indicator
      if (progress < 85) {
        const powerText = progress < 35 ? `CHARGING... ${Math.floor(chargeLevel * 100)}%` : 'MAXIMUM POWER!'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillStyle = `rgba(0, 200, 255, ${0.9 * fadeOp})`
        ctx.shadowColor = '#00BFFF'
        ctx.shadowBlur = 15
        ctx.fillText(powerText, centerX, height * 0.1)
        ctx.shadowBlur = 0
      }

      if (progress < 100) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef, onProgress])
  return null
}

// ========================================
// Main Component
// ========================================

export function TutorialConfetti({ standalone = false, onComplete, version = 'fireworks' }: TutorialConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const [showSubMessage, setShowSubMessage] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return
    setMounted(true)
    const t1 = setTimeout(() => setShowMessage(true), 800)
    const t2 = setTimeout(() => setShowSubMessage(true), 1400)
    const t3 = setTimeout(() => onComplete?.(), 6500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete, dismissed])

  const handleProgress = useCallback((p: number) => setProgress(p), [])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    onComplete?.()
  }, [onComplete])

  if (!mounted || dismissed) return null

  const messageOpacity = progress > 85 ? Math.max(0, 1 - (progress - 85) / 15) : 1

  const getAccentColor = () => {
    switch (version) {
      case 'aurora': return { main: '#00ff87', sub: '#60efff' }
      case 'geometric': return { main: '#667eea', sub: '#764ba2' }
      case 'cyber': return { main: '#00ffff', sub: '#ff00ff' }
      case 'code': return { main: '#61afef', sub: '#c678dd' }
      case 'sakura': return { main: '#FFB7C5', sub: '#FF69B4' }
      case 'ocean': return { main: '#00CED1', sub: '#4682B4' }
      case 'galaxy': return { main: '#DDA0DD', sub: '#8A2BE2' }
      case 'stylish': return { main: '#333333', sub: '#666666' }
      case 'naruto': return { main: '#FF6B35', sub: '#4A9DFF' }
      case 'mystic': return { main: '#C9A959', sub: '#FFD700' }
      case 'retro': return { main: '#FF00FF', sub: '#00FFFF' }
      case 'fantasy': return { main: '#DDA0DD', sub: '#FFB6C1' }
      case 'lightning': return { main: '#87CEEB', sub: '#E0FFFF' }
      case 'slash': return { main: '#FFFFFF', sub: '#C0C0C0' }
      case 'phoenix': return { main: '#FF6B00', sub: '#FFD700' }
      case 'royal': return { main: '#FFD700', sub: '#4169E1' }
      case 'shockwave': return { main: '#00BFFF', sub: '#1E90FF' }
      case 'royalPlus': return { main: '#FFD700', sub: '#4B0082' }
      case 'slashPlus': return { main: '#FFFFFF', sub: '#FF4500' }
      case 'shockwavePlus': return { main: '#00FFFF', sub: '#FF00FF' }
      default: return { main: '#FFD700', sub: '#FFC125' }
    }
  }

  const accent = getAccentColor()

  const content = (
    <div className={`fixed inset-0 ${standalone ? 'z-[10001]' : 'z-[10000]'} overflow-hidden cursor-pointer`}
         onClick={handleDismiss}
         style={{ pointerEvents: 'auto' }}>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {version === 'fireworks' && <FireworksAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'aurora' && <AuroraAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'geometric' && <GeometricAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'cyber' && <CyberAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'code' && <CodeAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'sakura' && <SakuraAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'ocean' && <OceanAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'galaxy' && <GalaxyAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'stylish' && <StylishAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'naruto' && <NarutoAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'mystic' && <MysticAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'retro' && <RetroAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'fantasy' && <FantasyAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'lightning' && <LightningAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'slash' && <SlashAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'phoenix' && <PhoenixAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'royal' && <RoyalAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'shockwave' && <ShockwaveAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'royalPlus' && <RoyalPlusAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'slashPlus' && <SlashPlusAnimation canvasRef={canvasRef} onProgress={handleProgress} />}
      {version === 'shockwavePlus' && <ShockwavePlusAnimation canvasRef={canvasRef} onProgress={handleProgress} />}

      {showMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ opacity: messageOpacity }}>
          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in-down">
              <div className="w-16 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent.main}60, transparent)` }} />
              <div className="text-sm tracking-[0.3em] font-light" style={{ color: `${accent.main}cc` }}>CONGRATULATIONS</div>
              <div className="w-16 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent.main}60, transparent)` }} />
            </div>

            <h1 className="text-5xl md:text-6xl font-extralight tracking-wide text-center animate-scale-in"
                style={{
                  background: `linear-gradient(135deg, ${accent.main} 0%, #FFF8DC 25%, ${accent.main} 50%, ${accent.sub} 75%, ${accent.main} 100%)`,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s linear infinite, scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}>
              Complete
            </h1>

            {showSubMessage && (
              <div className="mt-8 text-center animate-fade-in-up">
                <p className="text-lg md:text-xl font-light tracking-wide" style={{ color: 'rgba(255,248,240,0.9)' }}>
                  チュートリアルを完了しました
                </p>
                <p className="mt-3 text-sm tracking-widest" style={{ color: `${accent.main}b3` }}>
                  ✦ Welcome to your new journey ✦
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent.sub}40, transparent)` }} />
              <div className="w-2 h-2 rotate-45" style={{ backgroundColor: `${accent.main}99` }} />
              <div className="w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent.sub}40, transparent)` }} />
            </div>
          </div>
        </div>
      )}

      {/* Click to skip hint */}
      {standalone && (
        <div className="absolute bottom-8 left-0 right-0 text-center animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <p className="text-sm text-white/50">クリックでスキップ</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        @keyframes scale-in { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fade-in-down { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in-up { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
        .animate-scale-in { animation: scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
    </div>
  )

  return createPortal(content, document.body)
}
