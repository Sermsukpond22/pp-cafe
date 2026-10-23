'use client'

import { useState, useTransition } from 'react'
import { addStamps, redeemFreeCup } from '@/app/actions/stamps'
import toast from 'react-hot-toast'
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Phone,
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
import RedeemFreeCupModal from './RedeemFreeCupModal'

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

const QUICK_NOTES = ['หวานน้อย', 'ไม่หวาน', 'แยกน้ำแข็ง', 'เพิ่มช็อต']

export default function AddStampForm({
  customers,
  menuItems,
  stampsRequired,
  initialUserId,
}: Props) {
  const [stampPending, startStampTransition] = useTransition()
  const [redeemPending, startRedeemTransition] = useTransition()

  const [createdCustomers, setCreatedCustomers] = useState<Customer[]>([])

  const allCustomers = [
    ...createdCustomers.filter((nc) => !customers.some((c) => c.id === nc.id)),
    ...customers,
  ]

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddKey, setQuickAddKey] = useState(0)
  const [quickAddDefaultName, setQuickAddDefaultName] = useState('')
  const [quickAddDefaultPhone, setQuickAddDefaultPhone] = useState('')
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false)

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

  const [entryMode, setEntryMode] = useState<'menu' | 'manual'>('menu')
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [cart, setCart] = useState<CartItem[]>([])
  const [manualCups, setManualCups] = useState(1)
  const [manualPricePerCup, setManualPricePerCup] = useState(50)
  const [note, setNote] = useState('')

  const activeCustomer = selectedCustomer
    ? allCustomers.find((c) => c.id === selectedCustomer.id) || selectedCustomer
    : null

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

  const activeMenu = menuItems.filter((m) => m.isActive)
  const categories = ['ทั้งหมด', ...Array.from(new Set(activeMenu.map((m) => m.category)))]
  const filteredMenu = activeMenu.filter(
    (m) => selectedCategory === 'ทั้งหมด' || m.category === selectedCategory
  )

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
        toast.success(res.message || 'บันทึกสำเร็จ!', { duration: 4000 })
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

  const handleConfirmRedeem = (menuItemId?: string, menuItemName?: string, noteText?: string) => {
    if (!selectedCustomer) return
    const formData = new FormData()
    formData.append('userId', selectedCustomer.id)
    if (menuItemId) formData.append('menuItemId', menuItemId)
    if (menuItemName) formData.append('menuItemName', menuItemName)
    if (noteText) formData.append('note', noteText)

    startRedeemTransition(async () => {
      const res = await redeemFreeCup(undefined, formData)
      if (res?.success) {
        toast.success(res.message || 'แลกน้ำฟรีสำเร็จ!')
        setIsRedeemModalOpen(false)
        setSelectedCustomer((prev) =>
          prev ? { ...prev, freeRedeems: Math.max(0, prev.freeRedeems - 1) } : null
        )
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

  const toggleQuickNote = (chip: string) => {
    setNote((prev) => {
      if (prev.includes(chip)) {
        return prev
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && s !== chip)
          .join(', ')
      }
      return prev.trim() ? `${prev.trim()}, ${chip}` : chip
    })
  }

  return (
    <div>
      {/* ─── STEP 1: เลือกลูกค้า (แสดงเมื่อยังไม่ได้เลือกลูกค้า) ─── */}
      {!activeCustomer ? (
        <div className="bg-white rounded-2xl shadow-xs p-4 sm:p-5 border border-gray-100 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                1. เลือกลูกค้าเพื่อเริ่มรายการ
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ค้นหาจากชื่อ เบอร์โทรศัพท์ หรือเลือกจากรายชื่อล่าสุดด้านล่าง
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenQuickAdd()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ เพิ่มลูกค้าด่วน</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              placeholder="พิมพ์ชื่อ, เบอร์โทร, หรือ @username..."
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

          {/* Customer Grid */}
          {allCustomers.length === 0 ? (
            <div className="py-10 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">ยังไม่มีข้อมูลลูกค้าในระบบ</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                กดปุ่มเพิ่มลูกค้าด่วนเพื่อเริ่มสะสมแต้มครั้งแรก
              </p>
            </div>
          ) : isSearching && filteredCustomers.length === 0 ? (
            <div className="py-8 px-4 text-center bg-gray-50/70 rounded-2xl border border-gray-200/80">
              <SearchX className="w-7 h-7 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">
                ไม่พบลูกค้า &ldquo;<span className="text-emerald-700">{searchCustomer}</span>&rdquo;
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                ต้องการสร้างบัญชีใหม่ให้ลูกค้าคนนี้ทันทีหรือไม่?
              </p>
              <button
                type="button"
                onClick={() => handleOpenQuickAdd(searchCustomer)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ เพิ่มลูกค้าใหม่ด้วยข้อมูลนี้</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-xs font-medium text-gray-500">
                <span>
                  {isSearching
                    ? `ผลการค้นหา (${filteredCustomers.length} คน)`
                    : `ลูกค้าล่าสุด (${displayedCustomers.length} จาก ${allCustomers.length} คน)`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {displayedCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(c)
                      setSearchCustomer('')
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-emerald-50/50 active:bg-emerald-100/50 bg-white transition flex items-center justify-between border border-gray-200/80 hover:border-emerald-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-emerald-100">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {c.name}
                        </p>
                        <p className="text-gray-400 text-xs truncate mt-0.5">
                          {c.phone ? c.phone : `@${c.username}`} · สะสม {c.totalCups} แก้ว
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs bg-gray-100 group-hover:bg-emerald-100 text-gray-700 group-hover:text-emerald-800 font-bold px-2.5 py-1 rounded-lg transition">
                        {c.stamps}/{stampsRequired} แต้ม
                      </span>
                      {c.freeRedeems > 0 && (
                        <span className="block text-[11px] text-amber-600 font-bold mt-1">
                          สิทธิ์แลกฟรี {c.freeRedeems}
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
        /* ─── STEP 2: 2-Column POS Layout เมื่อเลือกลูกค้าแล้ว ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN (7 cols): Customer Banner + Menu Selection */}
          <div className="lg:col-span-7 space-y-4">
            {/* Compact Active Customer Card */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center shrink-0">
                    {activeCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                        {activeCustomer.name}
                      </h3>
                      <span className="text-xs text-gray-400">@{activeCustomer.username}</span>
                    </div>
                    <p className="text-gray-500 text-xs flex items-center gap-2 mt-0.5">
                      {activeCustomer.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {activeCustomer.phone}
                        </span>
                      )}
                      <span>· ซื้อสะสม {activeCustomer.totalCups} แก้ว</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="shrink-0 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>เปลี่ยนลูกค้า</span>
                </button>
              </div>

              {/* Compact 10-slot Stamp Progress */}
              <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">แต้มปัจจุบัน:</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    {activeCustomer.stamps}/{stampsRequired} แต้ม
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1 flex-1 max-w-xs">
                  {Array.from({ length: stampsRequired }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all ${
                        i < activeCustomer.stamps ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Free Redeem Banner if eligible */}
              {activeCustomer.freeRedeems > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-900">
                      ลูกค้ามีสิทธิ์แลกเครื่องดื่มฟรี {activeCustomer.freeRedeems} แก้ว
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRedeemModalOpen(true)}
                    disabled={redeemPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shrink-0 cursor-pointer"
                  >
                    {redeemPending ? 'กำลังแลก...' : 'ใช้สิทธิ์แลกฟรี'}
                  </button>
                </div>
              )}
            </div>

            {/* Menu Picker Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  เลือกเมนูเครื่องดื่ม
                </h2>

                {/* Segmented Mode Switch */}
                <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setEntryMode('menu')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      entryMode === 'menu'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    เลือกตามเมนู
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('manual')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      entryMode === 'manual'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    ระบุจำนวนแก้ว
                  </button>
                </div>
              </div>

              {entryMode === 'menu' ? (
                <div className="space-y-3.5">
                  {/* Category Filter Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Menu Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredMenu.map((item) => {
                      const inCart = cart.find((i) => i.menuItemId === item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addToCart(item)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative active:scale-98 cursor-pointer ${
                            inCart
                              ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                              : 'border-gray-200/90 hover:border-emerald-300 hover:bg-gray-50/60 bg-white'
                          }`}
                        >
                          {inCart && (
                            <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                          <div>
                            <span className="text-[11px] text-gray-400 font-medium block">
                              {item.category}
                            </span>
                            <p className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 pr-5 mt-0.5 leading-snug">
                              {item.name}
                            </p>
                          </div>
                          <p className="text-sm font-black text-emerald-700 mt-2.5">
                            {item.price} ฿
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gray-50/70 rounded-xl text-center space-y-4 border border-gray-200/70">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-2">
                      จำนวนแก้วที่ซื้อ
                    </label>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setManualCups(Math.max(1, manualCups - 1))}
                        className="w-11 h-11 rounded-xl bg-white border border-gray-300 text-gray-800 font-bold text-xl hover:bg-gray-100 active:scale-95 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="text-4xl font-black text-emerald-700 w-16">
                        {manualCups}
                      </span>
                      <button
                        type="button"
                        onClick={() => setManualCups(manualCups + 1)}
                        className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-bold text-xl hover:bg-emerald-700 active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200/80">
                    <label className="text-xs font-semibold text-gray-500 block mb-2">
                      ราคาเฉลี่ยต่อแก้ว (บาท)
                    </label>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {[45, 50, 55, 60, 65].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setManualPricePerCup(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            manualPricePerCup === p
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {p} ฿
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (5 cols): Sticky Order Cart & Checkout */}
          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    สรุปรายการสั่งซื้อ
                  </h3>
                </div>
                {entryMode === 'menu' && cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    ล้างตะกร้า
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {entryMode === 'menu' && (
                <div>
                  {cart.length === 0 ? (
                    <div className="py-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs font-semibold text-gray-500">
                        ยังไม่ได้เลือกเมนูเครื่องดื่ม
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        แตะที่รายการเมนูเพื่อเพิ่มลงตะกร้า
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-0.5">
                      {cart.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs sm:text-sm"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-gray-400 text-xs">{item.price} ฿ / แก้ว</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.menuItemId, -1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-l-lg text-gray-700 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold text-xs text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.menuItemId, 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-r-lg text-gray-700 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-bold text-gray-900 w-14 text-right text-xs sm:text-sm">
                              {(item.price * item.quantity).toLocaleString()} ฿
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.menuItemId)}
                              className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Note Input + Chips */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-600">
                  หมายเหตุออเดอร์
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map((chip) => {
                    const active = note.includes(chip)
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleQuickNote(chip)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {chip}
                      </button>
                    )
                  })}
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ระบุหมายเหตุเพิ่มเติม..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                />
              </div>

              {/* Order Total Box */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>จำนวนเครื่องดื่ม</span>
                  <span className="font-semibold text-gray-900">{totalCups} แก้ว</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>แต้มสะสมที่จะได้รับ</span>
                  <span className="font-bold text-emerald-700">+{totalCups} แต้ม</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200/80">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">ยอดรวมสุทธิ</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700">
                    {totalAmount.toLocaleString()} ฿
                  </span>
                </div>
              </div>

              {/* Submit Form */}
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {stampPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึกรายการ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        ยืนยันบันทึกขาย ({totalCups} แก้ว · {totalAmount.toLocaleString()} ฿)
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
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

      {/* Redeem Free Cup Modal */}
      {activeCustomer && isRedeemModalOpen && (
        <RedeemFreeCupModal
          key={`${activeCustomer.id}-${activeCustomer.freeRedeems}`}
          isOpen={isRedeemModalOpen}
          onClose={() => setIsRedeemModalOpen(false)}
          customer={activeCustomer}
          menuItems={menuItems}
          isPending={redeemPending}
          onConfirmRedeem={handleConfirmRedeem}
        />
      )}
    </div>
  )
}
