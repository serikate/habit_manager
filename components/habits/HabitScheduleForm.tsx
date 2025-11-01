'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { HabitScheduleForm, WeeklySchedule, DaySchedule } from '@/types'

const scheduleSchema = z.object({
  quickPattern: z.enum(['weekdays', 'everyday', 'weekends', 'custom']),
  quickTime: z.string().min(1, '時間を選択してください'),
  detailSchedule: z.any().optional(),
  selectedPreset: z.string().optional(),
})

interface HabitScheduleFormProps {
  initialSchedule?: WeeklySchedule
  onScheduleChange: (schedule: WeeklySchedule) => void
}

export default function HabitScheduleForm({
  initialSchedule = {},
  onScheduleChange
}: HabitScheduleFormProps) {
  const [activeTab, setActiveTab] = useState<'simple' | 'detail' | 'preset'>('simple')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<HabitScheduleForm>({
    resolver: zodResolver(scheduleSchema) as any,
    defaultValues: {
      quickPattern: 'weekdays',
      quickTime: '06:00',
      detailSchedule: initialSchedule
    }
  })

  const quickPattern = watch('quickPattern')
  const quickTime = watch('quickTime')

  // quickPatternとquickTimeの変更を監視して自動適用
  useEffect(() => {
    if (quickPattern !== 'custom') {
      let newSchedule: WeeklySchedule = {}

      switch (quickPattern) {
        case 'weekdays':
          newSchedule = {
            monday: { enabled: true, time: quickTime },
            tuesday: { enabled: true, time: quickTime },
            wednesday: { enabled: true, time: quickTime },
            thursday: { enabled: true, time: quickTime },
            friday: { enabled: true, time: quickTime }
          }
          break
        case 'everyday':
          newSchedule = {
            monday: { enabled: true, time: quickTime },
            tuesday: { enabled: true, time: quickTime },
            wednesday: { enabled: true, time: quickTime },
            thursday: { enabled: true, time: quickTime },
            friday: { enabled: true, time: quickTime },
            saturday: { enabled: true, time: quickTime },
            sunday: { enabled: true, time: quickTime }
          }
          break
        case 'weekends':
          newSchedule = {
            saturday: { enabled: true, time: quickTime },
            sunday: { enabled: true, time: quickTime }
          }
          break
      }

      setValue('detailSchedule', newSchedule)
      onScheduleChange(newSchedule)
    }
  }, [quickPattern, quickTime, setValue, onScheduleChange])

  // プリセットパターン
  const presets = [
    {
      id: 'morning-person',
      name: '🌅 朝活型',
      description: '平日 06:00\n週末 08:00',
      schedule: {
        monday: { enabled: true, time: '06:00' },
        tuesday: { enabled: true, time: '06:00' },
        wednesday: { enabled: true, time: '06:00' },
        thursday: { enabled: true, time: '06:00' },
        friday: { enabled: true, time: '06:00' },
        saturday: { enabled: true, time: '08:00' },
        sunday: { enabled: true, time: '08:00' }
      }
    },
    {
      id: 'night-owl',
      name: '🌙 夜型',
      description: '平日 21:00\n週末 22:00',
      schedule: {
        monday: { enabled: true, time: '21:00' },
        tuesday: { enabled: true, time: '21:00' },
        wednesday: { enabled: true, time: '21:00' },
        thursday: { enabled: true, time: '21:00' },
        friday: { enabled: true, time: '21:00' },
        saturday: { enabled: true, time: '22:00' },
        sunday: { enabled: true, time: '22:00' }
      }
    },
    {
      id: 'workout-pattern',
      name: '💪 筋トレ型',
      description: '火木土 19:00',
      schedule: {
        tuesday: { enabled: true, time: '19:00' },
        thursday: { enabled: true, time: '19:00' },
        saturday: { enabled: true, time: '19:00' }
      }
    },
    {
      id: 'study-pattern',
      name: '📚 勉強型',
      description: '平日 20:00\n土日 14:00',
      schedule: {
        monday: { enabled: true, time: '20:00' },
        tuesday: { enabled: true, time: '20:00' },
        wednesday: { enabled: true, time: '20:00' },
        thursday: { enabled: true, time: '20:00' },
        friday: { enabled: true, time: '20:00' },
        saturday: { enabled: true, time: '14:00' },
        sunday: { enabled: true, time: '14:00' }
      }
    },
    {
      id: 'exercise-pattern',
      name: '🏃‍♂️ 運動型',
      description: '月水金 06:00\n土日 09:00',
      schedule: {
        monday: { enabled: true, time: '06:00' },
        wednesday: { enabled: true, time: '06:00' },
        friday: { enabled: true, time: '06:00' },
        saturday: { enabled: true, time: '09:00' },
        sunday: { enabled: true, time: '09:00' }
      }
    }
  ]

  // 簡単設定の適用
  const applyQuickSetting = () => {
    let newSchedule: WeeklySchedule = {}

    switch (quickPattern) {
      case 'weekdays':
        newSchedule = {
          monday: { enabled: true, time: quickTime },
          tuesday: { enabled: true, time: quickTime },
          wednesday: { enabled: true, time: quickTime },
          thursday: { enabled: true, time: quickTime },
          friday: { enabled: true, time: quickTime }
        }
        break
      case 'everyday':
        newSchedule = {
          monday: { enabled: true, time: quickTime },
          tuesday: { enabled: true, time: quickTime },
          wednesday: { enabled: true, time: quickTime },
          thursday: { enabled: true, time: quickTime },
          friday: { enabled: true, time: quickTime },
          saturday: { enabled: true, time: quickTime },
          sunday: { enabled: true, time: quickTime }
        }
        break
      case 'weekends':
        newSchedule = {
          saturday: { enabled: true, time: quickTime },
          sunday: { enabled: true, time: quickTime }
        }
        break
      case 'custom':
        setActiveTab('detail')
        return
    }

    setValue('detailSchedule', newSchedule)
    onScheduleChange(newSchedule)
  }

  // プリセット適用
  const applyPreset = (preset: typeof presets[0]) => {
    setValue('detailSchedule', preset.schedule)
    setValue('selectedPreset', preset.id)
    onScheduleChange(preset.schedule)
  }

  // 詳細設定の更新
  const updateDetailSchedule = (day: keyof WeeklySchedule, daySchedule: DaySchedule) => {
    const currentSchedule = getValues('detailSchedule') || {}
    const newSchedule = {
      ...currentSchedule,
      [day]: daySchedule
    }
    setValue('detailSchedule', newSchedule)
    onScheduleChange(newSchedule)
  }

  // 一括適用
  const applyToSelectedDays = () => {
    const currentSchedule = getValues('detailSchedule') || {}
    const timeToApply = document.getElementById('bulk-time') as HTMLInputElement
    const time = timeToApply?.value || '06:00'

    const newSchedule = { ...currentSchedule }

    // チェックされている曜日に時間を適用
    Object.keys(newSchedule).forEach(day => {
      const daySchedule = newSchedule[day as keyof WeeklySchedule]
      if (daySchedule?.enabled) {
        newSchedule[day as keyof WeeklySchedule] = {
          ...daySchedule,
          time
        }
      }
    })

    setValue('detailSchedule', newSchedule)
    onScheduleChange(newSchedule)
  }

  const currentDetailSchedule = watch('detailSchedule') || {}
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels = ['月', '火', '水', '木', '金', '土', '日']

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">実行スケジュール設定</h3>
        <p className="text-sm text-gray-600">習慣をいつ実行するかを設定してください</p>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'simple', name: '簡単設定' },
            { id: 'detail', name: '詳細設定' },
            { id: 'preset', name: 'プリセット' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 簡単設定タブ */}
      {activeTab === 'simple' && (
        <div className="space-y-4">
          <div>
            <label className="text-base font-medium text-gray-900">🎯 実行パターンを選択</label>
            <div className="mt-4 space-y-3">
              {[
                { value: 'weekdays', label: '平日のみ（月-金）' },
                { value: 'everyday', label: '毎日（月-日）' },
                { value: 'weekends', label: '週末のみ（土-日）' },
                { value: 'custom', label: 'カスタム設定' }
              ].map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={option.value}
                    type="radio"
                    value={option.value}
                    {...register('quickPattern')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor={option.value} className="ml-3 text-sm text-gray-700">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {quickPattern !== 'custom' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <label className="text-sm font-medium text-gray-900">⏰ 実行時間を選択</label>
              <input
                type="time"
                {...register('quickTime')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              {/* クイック選択ボタン */}
              <div>
                <p className="text-xs text-gray-600 mb-2">よく使う時間:</p>
                <div className="flex flex-wrap gap-2">
                  {['05:00', '06:00', '07:00', '12:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setValue('quickTime', time)}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500">※ パターンや時間を変更すると自動的に適用されます</p>
            </div>
          )}
        </div>
      )}

      {/* 詳細設定タブ */}
      {activeTab === 'detail' && (
        <div className="space-y-6">
          <div>
            <label className="text-base font-medium text-gray-900 mb-4 block">📋 曜日別の個別設定</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dayNames.map((day, index) => {
                const daySchedule = currentDetailSchedule[day as keyof WeeklySchedule] || { enabled: false }
                return (
                  <div key={day} className="space-y-2 p-3 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${day}-enabled`}
                        checked={daySchedule.enabled}
                        onChange={(e) => updateDetailSchedule(day as keyof WeeklySchedule, {
                          enabled: e.target.checked,
                          time: daySchedule.time || '06:00'
                        })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${day}-enabled`} className="ml-2 text-sm font-medium text-gray-900">
                        {dayLabels[index]}
                      </label>
                    </div>
                    <input
                      type="time"
                      value={daySchedule.time || '06:00'}
                      onChange={(e) => updateDetailSchedule(day as keyof WeeklySchedule, {
                        enabled: daySchedule.enabled,
                        time: e.target.value
                      })}
                      disabled={!daySchedule.enabled}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                    {/* 個別のクイック選択 */}
                    {daySchedule.enabled && (
                      <div className="flex flex-wrap gap-1">
                        {['06:00', '12:00', '19:00', '21:00'].map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => updateDetailSchedule(day as keyof WeeklySchedule, {
                              enabled: daySchedule.enabled,
                              time: time
                            })}
                            className="px-2 py-0.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 一括操作 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">🔧 一括操作</h4>
              <p className="text-xs text-gray-600 mt-1">選択中の曜日に一括適用</p>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="bulk-time" className="text-sm text-gray-700">時間:</label>
              <input
                type="time"
                id="bulk-time"
                defaultValue="19:00"
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={applyToSelectedDays}
                className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                適用
              </button>
            </div>
            {/* 一括適用用クイック選択 */}
            <div>
              <p className="text-xs text-gray-600 mb-2">よく使う時間:</p>
              <div className="flex flex-wrap gap-2">
                {['06:00', '07:00', '12:00', '18:00', '19:00', '20:00', '21:00'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      const bulkTimeInput = document.getElementById('bulk-time') as HTMLInputElement
                      if (bulkTimeInput) {
                        bulkTimeInput.value = time
                      }
                    }}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* プリセットタブ */}
      {activeTab === 'preset' && (
        <div className="space-y-4">
          <div>
            <label className="text-base font-medium text-gray-900 mb-4 block">📚 よく使うパターン</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    watch('selectedPreset') === preset.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 mb-1">{preset.name}</div>
                  <div className="text-sm text-gray-600 whitespace-pre-line">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}