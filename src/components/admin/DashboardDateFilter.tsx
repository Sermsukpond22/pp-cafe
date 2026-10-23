'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DashboardPeriod } from '@/lib/utils'

interface DashboardDateFilterProps {
  basePath?: string
  period: DashboardPeriod
  activeDateStr: string
  todayStr: string
}

function shiftDateStr(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0))
  return dt.toISOString().slice(0, 10)
}

export default function DashboardDateFilter({
  basePath = '/admin/dashboard',
  period,
  activeDateStr,
  todayStr,
}: DashboardDateFilterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (query: string) => {
    startTransition(() => {
      router.push(`${basePath}${query}`)
    })
  }

  const handlePreset = (preset: DashboardPeriod) => {
    navigate(`?period=${preset}`)
  }

  const handleDateChange = (newDate: string) => {
    if (!newDate) return
    if (newDate === todayStr) {
      navigate('?period=today')
    } else {
      navigate(`?date=${newDate}`)
    }
  }

  const handleStepDay = (offset: number) => {
    const nextDate = shiftDateStr(activeDateStr, offset)
    if (nextDate > todayStr) return
    handleDateChange(nextDate)
  }

  const isNextDisabled = activeDateStr >= todayStr
  const isSingleDayMode = period === 'today' || period === 'yesterday' || period === 'date'

  const presets: { key: DashboardPeriod; label: string }[] = [
    { key: 'today', label: 'วันนี้' },
    { key: 'yesterday', label: 'เมื่อวาน' },
    { key: '7days', label: '7 วัน' },
    { key: 'month', label: 'เดือนนี้' },
    { key: 'all', label: 'ทั้งหมด' },
  ]

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-opacity ${
        isPending ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      {/* Segmented Control for Quick Periods */}
      <div className="inline-flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/60 overflow-x-auto no-scrollbar">
        {presets.map((item) => {
          const isActive = period === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handlePreset(item.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Compact Date Picker + Prev/Next Day Arrows */}
      <div className="flex items-center gap-1 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => handleStepDay(-1)}
          title="วันก่อนหน้า"
          className="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200 flex items-center justify-center transition active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative flex items-center">
          <Calendar
            className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${
              isSingleDayMode ? 'text-emerald-600' : 'text-gray-400'
            }`}
          />
          <input
            type="date"
            value={activeDateStr}
            max={todayStr}
            onChange={(e) => handleDateChange(e.target.value)}
            title="เลือกดูข้อมูลรายวัน"
            className={`pl-8 pr-2.5 h-8 rounded-lg text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer ${
              isSingleDayMode
                ? 'bg-emerald-50/60 text-emerald-900 border-emerald-300 font-bold'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={() => handleStepDay(1)}
          disabled={isNextDisabled}
          title="วันถัดไป"
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
            isNextDisabled
              ? 'bg-gray-50 text-gray-300 border-gray-200/60 cursor-not-allowed'
              : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200 active:scale-95'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
