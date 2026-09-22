interface StampCardProps {
  stamps: number
  stampsRequired: number
  freeRedeems: number
}

export default function StampCard({ stamps, stampsRequired, freeRedeems }: StampCardProps) {
  const progress = Math.min(100, (stamps / stampsRequired) * 100)

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-white">
        <div>
          <p className="text-emerald-100 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            แต้มสะสมเครื่องดื่ม
          </p>
          <p className="font-black text-3xl sm:text-4xl mt-0.5 tracking-tight">
            {stamps} <span className="text-emerald-200 text-lg sm:text-xl font-bold">/ {stampsRequired} แก้ว</span>
          </p>
        </div>
        {freeRedeems > 0 && (
          <div className="bg-white/95 text-emerald-900 border border-white/50 rounded-2xl px-3.5 py-1.5 text-xs sm:text-sm font-black shadow-sm flex items-center gap-1.5">
            <span>🎁</span>
            <span>ฟรี ×{freeRedeems} แก้ว</span>
          </div>
        )}
      </div>

      {/* Stamps Grid - 10 Slots */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-5">
          {Array.from({ length: stampsRequired }).map((_, i) => {
            const filled = i < stamps
            return (
              <div
                key={i}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center text-2xl sm:text-3xl
                  transition-all duration-300 relative border-2
                  ${filled
                    ? 'bg-emerald-50 border-emerald-500 shadow-xs scale-100'
                    : 'bg-gray-50 border-dashed border-gray-200 opacity-40'
                  }
                `}
              >
                <span>{filled ? '☕' : '⚪'}</span>
                <span className={`text-[10px] font-bold mt-0.5 ${filled ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {i + 1}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-100">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-center text-sm sm:text-base font-bold text-gray-700 mt-4">
          {stamps === 0
            ? `ซื้อครบ ${stampsRequired} แก้ว รับน้ำฟรี 1 แก้ว!`
            : stamps >= stampsRequired
            ? '🎉 ครบ 10 แก้วแล้ว! แจ้งพนักงานเพื่อแลกน้ำฟรีได้เลย'
            : `อีก ${stampsRequired - stamps} แก้ว จะได้รับน้ำฟรี 1 แก้ว!`}
        </p>
      </div>
    </div>
  )
}
