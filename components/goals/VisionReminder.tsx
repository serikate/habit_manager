'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useVisionStore } from '@/stores/visionStore'
import { Star, ChevronRight, Plus } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import type { Vision } from '@/types'

// 円形プログレスバー
function CircularProgress({ progress, size = 44 }: { progress: number; size?: number }) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  // 進捗に応じた色
  const getColor = () => {
    if (progress >= 80) return '#10b981' // green
    if (progress >= 50) return '#3b82f6' // blue
    if (progress >= 25) return '#f59e0b' // yellow
    return '#8b5cf6' // purple
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* 背景の円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 進捗の円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// 個別ビジョンカード
function VisionCard({ vision, progress }: { vision: Vision; progress: number }) {
  const deadline = new Date(vision.deadline)
  const daysRemaining = differenceInDays(deadline, new Date())
  const isOverdue = daysRemaining < 0

  return (
    <Link href="/goals" className="block min-w-[200px] flex-shrink-0">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer group h-full">
        <div className="flex items-start gap-3">
          <CircularProgress progress={progress} />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-white/90">
              {vision.title}
            </h4>
            <p className={`text-xs mt-1 ${isOverdue ? 'text-red-300' : 'text-white/60'}`}>
              {isOverdue ? (
                `${Math.abs(daysRemaining)}日超過`
              ) : daysRemaining === 0 ? (
                '今日まで'
              ) : (
                `残り${daysRemaining}日`
              )}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function VisionReminder() {
  const { visions, loading, fetchVisions, calculateVisionProgress } = useVisionStore()
  const [progresses, setProgresses] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchVisions()
  }, [fetchVisions])

  // ビジョンの進捗を取得
  useEffect(() => {
    const loadProgresses = async () => {
      const progressMap: Record<string, number> = {}
      for (const vision of visions) {
        const progress = await calculateVisionProgress(vision.id)
        progressMap[vision.id] = progress
      }
      setProgresses(progressMap)
    }
    if (visions.length > 0) {
      loadProgresses()
    }
  }, [visions, calculateVisionProgress])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl p-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/20 rounded w-24"></div>
            <div className="h-4 bg-white/20 rounded w-48"></div>
          </div>
        </div>
      </div>
    )
  }

  // ビジョンがない場合
  if (visions.length === 0) {
    return (
      <Link href="/goals" className="block">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  1年後ビジョン
                </p>
                <h3 className="font-bold mt-0.5">ビジョンを設定して習慣に意味を持たせよう</h3>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Star className="w-4 h-4 text-yellow-300" />
          <span className="text-sm font-medium">1年後ビジョン</span>
          <span className="text-xs text-white/60">({visions.length}件)</span>
        </div>
        <Link
          href="/goals"
          className="flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors"
        >
          詳細を見る
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ビジョンカードのスクロールエリア */}
      <div className="px-4 pb-4 overflow-x-auto">
        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
          {visions.map((vision) => (
            <VisionCard
              key={vision.id}
              vision={vision}
              progress={progresses[vision.id] || 0}
            />
          ))}
          {/* 追加ボタン */}
          <Link href="/goals" className="block min-w-[80px] flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer h-full flex items-center justify-center">
              <div className="text-center">
                <Plus className="w-6 h-6 text-white/60 mx-auto" />
                <span className="text-xs text-white/60 mt-1 block">追加</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
