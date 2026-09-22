'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, Users, ArrowUpDown, Trash2, AlertTriangle, Pencil } from 'lucide-react'
import { deleteCustomer } from '@/app/actions/admin'
import EditCustomerModal from './EditCustomerModal'
import toast from 'react-hot-toast'

export interface CustomerItem {
  id: string
  name: string
  username: string
  phone: string | null
  stamps: number
  totalCups: number
  freeRedeems: number
  createdAt: Date | string
}

interface CustomerListClientProps {
  customers: CustomerItem[]
  stampsRequired: number
  isSuperAdmin?: boolean
}

type FilterType = 'all' | 'free' | 'near' | 'regular'
type SortType = 'recent' | 'totalCups' | 'stamps' | 'name'

export default function CustomerListClient({
  customers,
  stampsRequired,
  isSuperAdmin = false,
}: CustomerListClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('recent')
  const [deleteTarget, setDeleteTarget] = useState<CustomerItem | null>(null)
  const [editTarget, setEditTarget] = useState<CustomerItem | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    startDeleteTransition(async () => {
      const formData = new FormData()
      formData.set('userId', deleteTarget.id)
      const res = await deleteCustomer(undefined, formData)

      if (res?.success) {
        toast.success(res.message || 'ลบลูกค้าสำเร็จ')
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(res?.message || 'เกิดข้อผิดพลาดในการลบลูกค้า')
      }
    })
  }

  const freeCount = useMemo(
    () => customers.filter((c) => c.freeRedeems > 0).length,
    [customers]
  )
  const nearCount = useMemo(
    () => customers.filter((c) => c.stamps >= stampsRequired - 2).length,
    [customers, stampsRequired]
  )
  const regularCount = useMemo(
    () => customers.filter((c) => c.totalCups >= 10).length,
    [customers]
  )

  const filtered = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase().replace(/[\s-]/g, '')

    const matches = customers.filter((c) => {
      if (cleanSearch) {
        const cleanName = c.name.toLowerCase().replace(/[\s-]/g, '')
        const cleanUsername = c.username.toLowerCase().replace(/[\s-]/g, '')
        const cleanPhone = (c.phone || '').replace(/[\s-]/g, '')
        const matchSearch =
          cleanName.includes(cleanSearch) ||
          cleanUsername.includes(cleanSearch) ||
          cleanPhone.includes(cleanSearch)

        if (!matchSearch) return false
      }

      if (filter === 'free') return c.freeRedeems > 0
      if (filter === 'near') return c.stamps >= stampsRequired - 2
      if (filter === 'regular') return c.totalCups >= 10
      return true
    })

    return [...matches].sort((a, b) => {
      if (sort === 'totalCups') return b.totalCups - a.totalCups
      if (sort === 'stamps') return b.stamps - a.stamps
      if (sort === 'name') return a.name.localeCompare(b.name, 'th')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [customers, search, filter, sort, stampsRequired])

  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เบอร์โทร หรือ @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              title="ล้างคำค้นหา"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-2xl border border-gray-200 shadow-2xs self-start sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">เรียง:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="text-xs sm:text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="recent">ล่าสุด</option>
            <option value="totalCups">ยอดซื้อสะสม</option>
            <option value="stamps">แต้มสะสม</option>
            <option value="name">ชื่อ ก-ฮ</option>
          </select>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none w-full max-w-full min-w-0">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
            filter === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          ทั้งหมด
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              filter === 'all' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('free')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
            filter === 'free'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
          }`}
        >
          🎁 มีสิทธิ์แลกฟรี
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              filter === 'free' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {freeCount}
          </span>
        </button>

        <button
          onClick={() => setFilter('near')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
            filter === 'near'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
          }`}
        >
          ☕ แต้มใกล้ครบ
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              filter === 'near' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {nearCount}
          </span>
        </button>

        <button
          onClick={() => setFilter('regular')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
            filter === 'regular'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
          }`}
        >
          ⭐ ลูกค้าประจำ (10+ แก้ว)
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              filter === 'regular' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {regularCount}
          </span>
        </button>
      </div>

      {/* Customer Count Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          แสดง {filtered.length} จากทั้งหมด {customers.length} คน
        </span>
        {(search || filter !== 'all') && (
          <button
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
            className="text-emerald-600 hover:text-emerald-700 font-bold"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Customer List Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 font-bold text-sm">
              {customers.length === 0
                ? 'ยังไม่มีลูกค้าในระบบ'
                : 'ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไขการค้นหา'}
            </p>
            {customers.length > 0 && (
              <button
                onClick={() => {
                  setSearch('')
                  setFilter('all')
                }}
                className="mt-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3.5 py-1.5 rounded-xl transition"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3.5 sm:p-5 hover:bg-emerald-50/40 transition active:bg-gray-50 gap-2.5 sm:gap-4"
            >
              <Link
                href={`/admin/customers/${c.id}`}
                className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {c.name}
                    </p>
                    <span className="text-xs text-gray-400 font-normal">
                      @{c.username}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {c.phone && <span>📞 {c.phone}</span>}
                    <span>· สะสม {c.totalCups} แก้ว</span>
                  </p>

                  {/* Badges for Mobile (< sm) */}
                  <div className="flex items-center gap-1.5 mt-1.5 sm:hidden">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ☕ {c.stamps}/{stampsRequired} แต้ม
                    </span>
                    {c.freeRedeems > 0 && (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        🎁 ฟรี {c.freeRedeems}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {/* Desktop Stamp Display (hidden on mobile, shown on sm:) */}
                <Link href={`/admin/customers/${c.id}`} className="hidden sm:block text-right shrink-0">
                  <div className="flex gap-1 justify-end">
                    {Array.from({ length: stampsRequired }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs sm:text-sm ${i < c.stamps ? 'opacity-100' : 'opacity-20'}`}
                      >
                        ☕
                      </span>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mt-1">
                    {c.stamps}/{stampsRequired} แต้ม ({c.totalCups} แก้ว)
                  </p>
                  {c.freeRedeems > 0 && (
                    <span className="inline-block text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full mt-0.5">
                      🎁 ฟรี {c.freeRedeems} แก้ว
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setEditTarget(c)
                  }}
                  className="p-2 sm:p-2.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                  title="แก้ไขข้อมูลลูกค้า"
                >
                  <Pencil className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeleteTarget(c)
                    }}
                    className="p-2 sm:p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="ลบลูกค้า (Super Admin)"
                  >
                    <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Super Admin Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-gray-900 text-lg">ยืนยันการลบลูกค้า</h3>
              <p className="text-sm text-gray-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ{' '}
                <strong className="text-red-600 font-bold">{deleteTarget.name}</strong>?
              </p>
              <p className="text-xs text-gray-400">
                ⚠️ แต้มสะสมและประวัติการซื้อทั้งหมดของลูกค้านี้จะถูกลบถาวร
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black text-sm rounded-xl transition shadow-sm"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      <EditCustomerModal
        customer={editTarget}
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  )
}
