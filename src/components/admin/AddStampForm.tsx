'use client'

import { useState, useTransition } from 'react'
import { addStamps, redeemFreeCup } from '@/app/actions/stamps'
import toast from 'react-hot-toast'
import {
  Plus,
  Minus,
  Trash2,
  Coffee,
  ShoppingBag,
  Phone,
  Zap,
  Search,
  X,
  UserPlus,
  SearchX,
  RotateCcw,
  Gift,
  Check,
  Loader2,
} from 'lucide-react'
import QuickAddCustomerModal, { CustomerSummary } from './QuickAddCustomerModal'

interface Customer {
  id: string
  name: string
  username: string
  phone?: string | null
  stamps: number
  freeRedeems: number
  totalCups: number
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  isActive: boolean
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface Props {
  customers: Customer[]
  menuItems: MenuItem[]
  stampsRequired: number
  initialUserId?: string
}

export default function AddStampForm({
  customers,
  menuItems,
  stampsRequired,
  initialUserId,
}: Props) {
  const [stampPending, startStampTransition] = useTransition()
  const [redeemPending, startRedeemTransition] = useTransition()

  const [createdCustomers, setCreatedCustomers] = useState<Customer[]>([])

  // Combine newly created customers with server-provided customers without duplicates
  const allCustomers = [
    ...createdCustomers.filter((nc) => !customers.some((c) => c.id === nc.id)),
    ...customers,
  ]

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddKey, setQuickAddKey] = useState(0)
  const [quickAddDefaultName, setQuickAddDefaultName] = useState('')
  const [quickAddDefaultPhone, setQuickAddDefaultPhone] = useState('')

  const handleOpenQuickAdd = (searchQuery?: string) => {
    const query = (searchQuery ?? searchCustomer).trim()
    const cleanDigits = query.replace(/[\s-]/g, '')
    if (cleanDigits && /^[0-9]+$/.test(cleanDigits)) {
      setQuickAddDefaultPhone(cleanDigits)
      setQuickAddDefaultName('')
    } else {
      setQuickAddDefaultPhone('')
      setQuickAddDefaultName(query)
    }
    setQuickAddKey((k) => k + 1)
    setIsQuickAddOpen(true)
  }

  const handleCustomerCreated = (newCust: CustomerSummary) => {
    setCreatedCustomers((prev) => [newCust, ...prev.filter((c) => c.id !== newCust.id)])
    setSelectedCustomer(newCust)
    setSearchCustomer('')
  }

  const [searchCustomer, setSearchCustomer] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    if (initialUserId) {
      return customers.find((c) => c.id === initialUserId) || null
    }
    return null
  })

  // Mode: 'menu' | 'manual'
  const [entryMode, setEntryMode] = useState<'menu' | 'manual'>('menu')
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [cart, setCart] = useState<CartItem[]>([])
  const [manualCups, setManualCups] = useState(1)
  const [manualPricePerCup, setManualPricePerCup] = useState(50)
  const [note, setNote] = useState('')

  // Keep customer data up to date when customers list revalidates
  const activeCustomer = selectedCustomer
    ? allCustomers.find((c) => c.id === selectedCustomer.id) || selectedCustomer
    : null

  // Filter customers by name, username, or phone
  const cleanSearch = searchCustomer.trim().toLowerCase()
  const cleanSearchDigits = searchCustomer.replace(/[\s-]/g, '')

  const filteredCustomers = allCustomers.filter((c) => {
    if (!cleanSearch) return false
    const matchName = c.name.toLowerCase().includes(cleanSearch)
    const matchUsername = c.username.toLowerCase().includes(cleanSearch)
    const matchPhone = c.phone
      ? c.phone.replace(/[\s-]/g, '').includes(cleanSearchDigits)
      : false
    return matchName || matchUsername || matchPhone
  })

  const isSearching = cleanSearch.length > 0
  const displayedCustomers = isSearching ? filteredCustomers : allCustomers.slice(0, 8)

  // Filter active menu items
  const activeMenu = menuItems.filter((m) => m.isActive)
  const categories = ['ทั้งหมด', ...Array.from(new Set(activeMenu.map((m) => m.category)))]
  const filteredMenu = activeMenu.filter(
    (m) => selectedCategory === 'ทั้งหมด' || m.category === selectedCategory
  )

  // Calculate totals
  const totalCups =
    entryMode === 'menu'
      ? cart.reduce((sum, item) => sum + item.quantity, 0)
      : manualCups

  const totalAmount =
    entryMode === 'menu'
      ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : manualCups * manualPricePerCup

  const handleStampAction = (formData: FormData) => {
    startStampTransition(async () => {
      const res = await addStamps(undefined, formData)
      if (res?.success) {
        toast.success(res.message || 'บันทึกสำเร็จ!', { duration: 4500 })
        setCart([])
        setManualCups(1)
        setNote('')
        if (selectedCustomer) {
          const found = allCustomers.find((c) => c.id === selectedCustomer.id)
          if (found) setSelectedCustomer(found)
        }
      } else if (res?.message) {
        toast.error(res.message)
      }
    })
  }

  const handleRedeemAction = (formData: FormData) => {
    startRedeemTransition(async () => {
      const res = await redeemFreeCup(undefined, formData)
      if (res?.success) {
        toast.success(res.message || 'แลกน้ำฟรีสำเร็จ!')
        if (selectedCustomer) {
          const found = allCustomers.find((c) => c.id === selectedCustomer.id)
          if (found) setSelectedCustomer(found)
        }
      } else if (res?.message) {
        toast.error(res.message)
      }
    })
  }

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id)
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId))
  }

  return (
    <div className="space-y-4">
      {/* ─── 1. เลือกลูกค้า หรือ แสดงข้อมูลลูกค้าที่เลือกแล้ว ─── */}
      {!activeCustomer ? (
        <div className="bg-white rounded-2xl shadow-xs p-4 sm:p-5 border border-gray-100 space-y-3.5">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-2xs">
                1
              </span>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                เลือกลูกค้าเพื่อสะสมแต้ม
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleOpenQuickAdd()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>+ ลูกค้าใหม่</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, username..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50/70 text-sm placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchCustomer && (
              <button
                type="button"
                onClick={() => setSearchCustomer('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Area */}
          {allCustomers.length === 0 ? (
            /* Case A: Database is empty */
            <div className="py-8 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">ยังไม่มีข้อมูลลูกค้าในระบบ</h3>
              <p className="text-xs text-gray-500 mt-0.5 max-w-xs mx-auto">
                เพิ่มข้อมูลลูกค้าเพื่อเริ่มสะสมแต้มและบันทึกยอดขาย
              </p>
              <button
                type="button"
                onClick={() => handleOpenQuickAdd()}
                className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>+ เพิ่มลูกค้าด่วน</span>
              </button>
            </div>
          ) : isSearching && filteredCustomers.length === 0 ? (
            /* Case B: Searched but not found */
            <div className="py-6 px-4 text-center bg-amber-50/50 rounded-2xl border border-amber-200/80">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <SearchX className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">
                ไม่พบข้อมูลสำหรับ &ldquo;<span className="text-emerald-700 font-extrabold">{searchCustomer}</span>&rdquo;
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                ลูกค้าใหม่ยังไม่มีบัญชีใช่ไหม? เพิ่มข้อมูลด่วนแล้วสะสมแต้มได้ทันที
              </p>
              <button
                type="button"
                onClick={() => handleOpenQuickAdd(searchCustomer)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>+ เพิ่มลูกค้าด่วนด้วยข้อมูลนี้</span>
              </button>
            </div>
          ) : (
            /* Case C: Normal Customer List */
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 text-xs font-semibold text-gray-500">
                <span>
                  {isSearching
                    ? `ผลการค้นหา (${filteredCustomers.length} คน)`
                    : `ลูกค้าล่าสุด (${displayedCustomers.length} คน)`}
                </span>
                {!isSearching && allCustomers.length > 8 && (
                  <span className="text-[11px] text-gray-400 font-normal">
                    (พิมพ์ค้นหาเพื่อดูลูกค้าคนอื่น)
                  </span>
                )}
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {displayedCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(c)
                      setSearchCustomer('')
                    }}
                    className="w-full text-left p-2.5 sm:p-3 rounded-xl hover:bg-emerald-50/70 active:bg-emerald-100/70 bg-white transition flex items-center justify-between border border-gray-200/80 hover:border-emerald-300 shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 group-hover:bg-emerald-200">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <span className="text-gray-400 text-xs font-normal">@{c.username}</span>
                        </p>
                        <p className="text-gray-500 text-xs flex items-center gap-2 mt-0.5">
                          {c.phone && <span>📞 {c.phone}</span>}
                          <span>· ซื้อสะสม {c.totalCups} แก้ว</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200/60">
                        {c.stamps}/{stampsRequired} แต้ม
                      </span>
                      {c.freeRedeems > 0 && (
                        <span className="block text-[11px] text-amber-600 font-extrabold mt-0.5">
                          🎁 ฟรี {c.freeRedeems}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Active Customer Card (เมื่อเลือกลูกค้าแล้ว) */
        <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                {activeCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-gray-900 text-base sm:text-lg truncate">
                    {activeCustomer.name}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-md">
                    @{activeCustomer.username}
                  </span>
                </div>
                <p className="text-gray-500 text-xs flex items-center gap-2 mt-0.5 flex-wrap">
                  {activeCustomer.phone && (
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> {activeCustomer.phone}
                    </span>
                  )}
                  <span>· สะสมทั้งหมด {activeCustomer.totalCups} แก้ว</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="shrink-0 text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="เปลี่ยนลูกค้า"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>เปลี่ยน</span>
            </button>
          </div>

          {/* Stamp Status Bar */}
          <div className="mt-3.5 pt-3 border-t border-emerald-100">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-emerald-900">
                แต้มสะสม: <strong className="text-emerald-700 text-sm font-black">{activeCustomer.stamps}/{stampsRequired}</strong> แก้ว
              </span>
              <span className="text-gray-400 font-normal">
                {stampsRequired - activeCustomer.stamps > 0
                  ? `(ขาดอีก ${stampsRequired - activeCustomer.stamps} แก้ว รับฟรี 1 แก้ว)`
                  : '🎉 ครบสิทธิ์แลกฟรีแล้ว!'}
              </span>
            </div>

            {/* Stamp grid */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {Array.from({ length: stampsRequired }).map((_, i) => (
                <div
                  key={i}
                  className={`h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    i < activeCustomer.stamps
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white/80 border border-emerald-200/70 text-gray-300'
                  }`}
                >
                  {i < activeCustomer.stamps ? '☕' : i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. ส่วนเลือกเครื่องดื่ม & บันทึกแต้ม (แสดงเมื่อเลือกลูกค้าแล้ว) ─── */}
      {activeCustomer && (
        <>
          {/* ปุ่มแลกน้ำฟรี ถ้ามีสิทธิ์ */}
          {activeCustomer.freeRedeems > 0 && (
            <form
              action={handleRedeemAction}
              className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/15 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs"
            >
              <input type="hidden" name="userId" value={activeCustomer.id} />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-amber-950 text-sm">สิทธิ์แลกน้ำฟรี 🎁</p>
                  <p className="text-xs text-amber-800 font-medium">
                    คงเหลือ {activeCustomer.freeRedeems} แก้ว
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={redeemPending}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-amber-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs shrink-0 cursor-pointer"
              >
                {redeemPending ? 'กำลังแลก...' : 'แลกฟรี 1 แก้ว'}
              </button>
            </form>
          )}

          {/* Card: เลือกเมนูที่ลูกค้าสั่ง */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-2xs">
                  2
                </span>
                <label className="text-sm sm:text-base font-bold text-gray-900">
                  เลือกเมนูที่ลูกค้าสั่ง
                </label>
              </div>

              {/* Mode switch */}
              <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEntryMode('menu')}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    entryMode === 'menu'
                      ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  เลือกตามเมนู
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('manual')}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    entryMode === 'manual'
                      ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ระบุจำนวนแก้ว
                </button>
              </div>
            </div>

            {/* Mode A: เลือกตามเมนู */}
            {entryMode === 'menu' ? (
              <div className="space-y-4">
                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full max-w-full min-w-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Menu Item Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-0.5">
                  {filteredMenu.map((item) => {
                    const inCart = cart.find((i) => i.menuItemId === item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addToCart(item)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between relative active:scale-97 cursor-pointer ${
                          inCart
                            ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/30'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20 bg-white'
                        }`}
                      >
                        {inCart && (
                          <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                            {inCart.quantity}
                          </span>
                        )}
                        <p className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 pr-5 leading-tight">
                          {item.name}
                        </p>
                        <p className="text-sm font-black text-emerald-700 mt-2">
                          {item.price} ฿
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* ตะกร้ารายการที่เลือก */}
                {cart.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 border border-gray-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 pb-1 border-b border-gray-200/60">
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>รายการที่เลือก ({cart.length})</span>
                      </span>
                      <span className="text-gray-400 font-normal">แตะ + / − เพื่อปรับจำนวน</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {cart.map((item) => (
                        <div key={item.menuItemId} className="flex items-center justify-between pt-1.5 text-xs sm:text-sm">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-gray-400 text-xs">{item.price} ฿/แก้ว</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.menuItemId, -1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-l-xl text-gray-700 active:bg-gray-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-bold text-xs text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.menuItemId, 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-r-xl text-gray-700 active:bg-gray-200 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-bold text-emerald-700 w-14 text-right text-xs sm:text-sm">
                              {(item.price * item.quantity).toLocaleString()} ฿
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.menuItemId)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-lg cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Mode B: ระบุจำนวนแก้วเอง */
              <div className="p-5 bg-gray-50 rounded-2xl text-center space-y-4 border border-gray-200/80">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-700 block mb-2">
                    จำนวนแก้วทั้งหมดที่ซื้อ
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setManualCups(Math.max(1, manualCups - 1))}
                      className="w-12 h-12 rounded-xl bg-white border border-gray-300 text-gray-800 font-black text-xl hover:bg-gray-100 active:scale-95 shadow-xs cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-4xl sm:text-5xl font-black text-emerald-700 w-20">
                      {manualCups}
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualCups(manualCups + 1)}
                      className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xl hover:bg-emerald-700 active:scale-95 shadow-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 block mb-2">
                    ราคาต่อแก้ว (บาท)
                  </label>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {[40, 45, 50, 55, 60].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setManualPricePerCup(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          manualPricePerCup === p
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {p}฿
                      </button>
                    ))}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        value={manualPricePerCup}
                        onChange={(e) => setManualPricePerCup(Math.max(0, Number(e.target.value)))}
                        className="w-12 text-center font-bold text-xs text-gray-800 outline-none"
                      />
                      <span className="text-xs text-gray-400 font-medium">฿</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    รวม {manualCups} แก้ว × {manualPricePerCup} ฿ ={' '}
                    <strong className="text-emerald-700 font-bold">
                      {(manualCups * manualPricePerCup).toLocaleString()} บาท
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* สรุปยอดรวม (Summary Bar) */}
            <div className="bg-emerald-800 text-white rounded-2xl p-4 sm:p-4.5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-emerald-200 font-medium">ยอดสั่งซื้อทั้งหมด</p>
                <p className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                  {totalCups} แก้ว {totalAmount > 0 && `· ${totalAmount.toLocaleString()} ฿`}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm bg-emerald-700/80 border border-emerald-500/50 px-3 py-1 rounded-full font-black">
                  <Coffee className="w-3.5 h-3.5 text-amber-300" />
                  <span>+{totalCups} แต้ม</span>
                </span>
              </div>
            </div>

            {/* Note input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                หมายเหตุเพิ่มเติม (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น หวานน้อย, แยกน้ำแข็ง"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
              />
            </div>

            {/* Submit Button พร้อมชื่อผู้ใช้ชัดเจน */}
            <form action={handleStampAction}>
              <input type="hidden" name="userId" value={activeCustomer.id} />
              <input type="hidden" name="cups" value={totalCups} />
              <input type="hidden" name="totalAmount" value={totalAmount} />
              <input type="hidden" name="note" value={note} />
              <input
                type="hidden"
                name="itemsJson"
                value={entryMode === 'menu' ? JSON.stringify(cart) : '[]'}
              />

              <button
                type="submit"
                disabled={stampPending || totalCups <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold py-3.5 sm:py-4 rounded-2xl transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed"
              >
                {stampPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังบันทึกรายการ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>บันทึกแต้มให้ {activeCustomer.name} · +{totalCups} แก้ว</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Quick Add Customer Modal */}
      {isQuickAddOpen && (
        <QuickAddCustomerModal
          key={quickAddKey}
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          defaultName={quickAddDefaultName}
          defaultPhone={quickAddDefaultPhone}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </div>
  )
}
