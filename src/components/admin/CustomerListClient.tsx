'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, Users, ArrowUpDown, Trash2, AlertTriangle, Pencil, Plus } from 'lucide-react'
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

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'ทั้งหมด', count: customers.length },
    { key: 'free', label: 'มีสิทธิ์แลกฟรี', count: freeCount },
    { key: 'near', label: 'แต้มใกล้ครบ (8+)', count: nearCount },
    { key: 'regular', label: 'ลูกค้าประจำ (10+ แก้ว)', count: regularCount },
  ]

  return (
    <div className="space-y-4">
      {/* Unified Filter & Search Toolbar Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทรศัพท์ หรือ @username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 h-9 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="ล้างคำค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 h-9 rounded-xl border border-gray-200 self-start sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">เรียงตาม:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="recent">สมัครล่าสุด</option>
              <option value="totalCups">ยอดซื้อสะสมสูงสุด</option>
              <option value="stamps">แต้มปัจจุบันสูงสุด</option>
              <option value="name">ชื่อ ก-ฮ</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-100 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {filterTabs.map((tab) => {
              const active = filter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[11px] ${
                      active ? 'bg-emerald-700 text-emerald-50' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {(search || filter !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Customer List Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600 font-bold text-sm">
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
                className="mt-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3.5 py-1.5 rounded-xl transition"
              >
                แสดงลูกค้าทั้งหมด
              </button>
            )}
          </div>
        ) : (
          filtered.map((c) => {
            const pct = Math.min(100, Math.round((c.stamps / stampsRequired) * 100))
            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50/60 transition gap-3"
              >
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="flex items-center gap-3.5 flex-1 min-w-0 group"
                >
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 group-hover:text-emerald-700 text-sm truncate transition">
                        {c.name}
                      </p>
                      <span className="text-xs text-gray-400">@{c.username}</span>
                      {c.freeRedeems > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80">
                          แลกฟรี {c.freeRedeems} แก้ว
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      {c.phone && <span>โทร: {c.phone}</span>}
                      <span>· ซื้อสะสม {c.totalCups} แก้ว</span>
                    </p>
                  </div>
                </Link>

                {/* Right side: Progress bar + Quick Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 shrink-0">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="w-28 sm:w-32 text-left sm:text-right"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400 font-medium">แต้มสะสม</span>
                      <span className="font-bold text-emerald-700">
                        {c.stamps}/{stampsRequired}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/add-stamp?userId=${c.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition border border-emerald-200/70"
                      title="ให้แต้มลูกค้าคนนี้"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ให้แต้ม</span>
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditTarget(c)
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition cursor-pointer"
                      title="แก้ไขข้อมูลลูกค้า"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeleteTarget(c)
                        }}
                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition cursor-pointer"
                        title="ลบลูกค้า (Super Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Super Admin Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">ยืนยันการลบลูกค้า</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                ต้องการลบข้อมูลของ <strong className="text-red-600">{deleteTarget.name}</strong> หรือไม่?
              </p>
              <p className="text-xs text-gray-400">
                แต้มสะสมและประวัติการซื้อทั้งหมดของลูกค้านี้จะถูกลบถาวร
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-xs sm:text-sm rounded-xl transition"
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
