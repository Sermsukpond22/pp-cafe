import { Coffee, Gift } from 'lucide-react'

interface StampCardProps {
  stamps: number
  stampsRequired: number
  freeRedeems: number
}

export default function StampCard({ stamps, stampsRequired, freeRedeems }: StampCardProps) {
  const progress = Math.min(100, (stamps / stampsRequired) * 100)

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 px-5 py-4 flex items-center justify-between text-white">
        <div>
          <p className="text-emerald-200 text-xs font-medium">แต้มสะสมปัจจุบัน</p>
          <p className="font-black text-3xl mt-0.5 tracking-tight">
            {stamps}{' '}
            <span className="text-emerald-200 text-base font-bold">/ {stampsRequired} แก้ว</span>
          </p>
        </div>
        {freeRedeems > 0 && (
          <div className="bg-amber-400 text-amber-950 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            <span>แลกฟรี {freeRedeems} แก้ว</span>
          </div>
        )}
      </div>

      {/* Stamps Grid - 10 Slots */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: stampsRequired }).map((_, i) => {
            const filled = i < stamps
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all border ${
                  filled
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-gray-50 border-dashed border-gray-200 text-gray-300'
                }`}
              >
                <Coffee className={`w-5 h-5 ${filled ? 'text-white' : 'text-gray-300'}`} />
                <span
                  className={`text-xs font-bold mt-1 ${
                    filled ? 'text-emerald-100' : 'text-gray-400'
                  }`}
                >
                  {i + 1}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-center text-xs font-semibold text-gray-600">
            {stamps === 0
              ? `สะสมครบ ${stampsRequired} แก้ว รับเครื่องดื่มฟรี 1 แก้ว`
              : stamps >= stampsRequired
              ? 'ครบสิทธิ์แลกเครื่องดื่มฟรีแล้ว แจ้งพนักงานที่หน้าร้านได้เลย'
              : `อีก ${stampsRequired - stamps} แก้ว จะได้รับสิทธิ์แลกเครื่องดื่มฟรี 1 แก้ว`}
          </p>
        </div>
      </div>
    </div>
  )
}
