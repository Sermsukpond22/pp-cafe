import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTimeOnly(date: Date | string) {
  return new Date(date).toLocaleTimeString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getBangkokDateString(date: Date | string = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date(date)) // "YYYY-MM-DD"
}

export function shiftBangkokDateString(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0))
  return dt.toISOString().slice(0, 10)
}

export function getBangkokDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000+07:00`)
}

export function getBangkokDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+07:00`)
}

export function getBangkokTodayStart(): Date {
  return getBangkokDayStart(getBangkokDateString())
}

export function getBangkokTodayEnd(): Date {
  return getBangkokDayEnd(getBangkokDateString())
}

export function formatThaiDateFull(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const dt = new Date(`${dateStr}T12:00:00+07:00`)
  return dt.toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatThaiDateShort(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const dt = new Date(`${dateStr}T12:00:00+07:00`)
  return dt.toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

export type DashboardPeriod = 'today' | 'yesterday' | '7days' | 'month' | 'all' | 'date'

export function resolveBangkokFilterRange(
  rawPeriod?: string,
  rawDate?: string
): {
  period: DashboardPeriod
  activeDateStr: string
  todayStr: string
  yesterdayStr: string
  start: Date | null
  end: Date | null
  titleLabel: string
  subtitleLabel: string
  isSingleDay: boolean
} {
  const todayStr = getBangkokDateString()
  const yesterdayStr = shiftBangkokDateString(todayStr, -1)

  if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && (!rawPeriod || rawPeriod === 'date')) {
    if (rawDate === todayStr) {
      return {
        period: 'today',
        activeDateStr: todayStr,
        todayStr,
        yesterdayStr,
        start: getBangkokDayStart(todayStr),
        end: getBangkokDayEnd(todayStr),
        titleLabel: 'วันนี้',
        subtitleLabel: formatThaiDateFull(todayStr),
        isSingleDay: true,
      }
    }
    if (rawDate === yesterdayStr) {
      return {
        period: 'yesterday',
        activeDateStr: yesterdayStr,
        todayStr,
        yesterdayStr,
        start: getBangkokDayStart(yesterdayStr),
        end: getBangkokDayEnd(yesterdayStr),
        titleLabel: 'เมื่อวานนี้',
        subtitleLabel: formatThaiDateFull(yesterdayStr),
        isSingleDay: true,
      }
    }
    return {
      period: 'date',
      activeDateStr: rawDate,
      todayStr,
      yesterdayStr,
      start: getBangkokDayStart(rawDate),
      end: getBangkokDayEnd(rawDate),
      titleLabel: `วันที่ ${formatThaiDateShort(rawDate)}`,
      subtitleLabel: formatThaiDateFull(rawDate),
      isSingleDay: true,
    }
  }

  switch (rawPeriod) {
    case 'yesterday':
      return {
        period: 'yesterday',
        activeDateStr: yesterdayStr,
        todayStr,
        yesterdayStr,
        start: getBangkokDayStart(yesterdayStr),
        end: getBangkokDayEnd(yesterdayStr),
        titleLabel: 'เมื่อวานนี้',
        subtitleLabel: formatThaiDateFull(yesterdayStr),
        isSingleDay: true,
      }
    case '7days': {
      const startStr = shiftBangkokDateString(todayStr, -6)
      return {
        period: '7days',
        activeDateStr: todayStr,
        todayStr,
        yesterdayStr,
        start: getBangkokDayStart(startStr),
        end: getBangkokDayEnd(todayStr),
        titleLabel: '7 วันย้อนหลัง',
        subtitleLabel: `${formatThaiDateShort(startStr)} – ${formatThaiDateShort(todayStr)}`,
        isSingleDay: false,
      }
    }
    case 'month': {
      const monthStartStr = `${todayStr.slice(0, 7)}-01`
      const dt = new Date(`${todayStr}T12:00:00+07:00`)
      const monthName = dt.toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok',
        month: 'long',
        year: 'numeric',
      })
      return {
        period: 'month',
        activeDateStr: todayStr,
        todayStr,
        yesterdayStr,
        start: getBangkokDayStart(monthStartStr),
        end: getBangkokDayEnd(todayStr),
        titleLabel: 'เดือนนี้',
        subtitleLabel: `ประจำเดือน${monthName}`,
        isSingleDay: false,
      }
    }
    case 'all':
      return {
        period: 'all',
        activeDateStr: todayStr,
        todayStr,
        yesterdayStr,
        start: null,
        end: null,
        titleLabel: 'ทั้งหมดทุกช่วงเวลา',
        subtitleLabel: 'ข้อมูลสะสมตั้งแต่เปิดร้าน',
        isSingleDay: false,
      }
    case 'today':
    default:
      return {
        period: 'today',
        activeDateStr: todayStr,
        todayStr,
        yesterdayStr,
        start: getBangkokDayStart(todayStr),
        end: getBangkokDayEnd(todayStr),
        titleLabel: 'วันนี้',
        subtitleLabel: formatThaiDateFull(todayStr),
        isSingleDay: true,
      }
  }
}
