'use client'

import { useActionState, useState, useEffect } from 'react'
import { addStamps, redeemFreeCup } from '@/app/actions/stamps'
import toast from 'react-hot-toast'
import { Plus, Minus, Trash2, Coffee, ShoppingBag, CheckCircle } from 'lucide-react'

interface Customer {
  id: string
  name: string
  username: string
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
}

export default function AddStampForm({ customers, menuItems, stampsRequired }: Props) {
  const [stampState, stampAction, stampPending] = useActionState(addStamps, undefined)
  const [redeemState, redeemAction, redeemPending] = useActionState(redeemFreeCup, undefined)

  const [searchCustomer, setSearchCustomer] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Mode: 'menu' | 'manual'
  const [entryMode, setEntryMode] = useState<'menu' | 'manual'>('menu')
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [cart, setCart] = useState<CartItem[]>([])
  const [manualCups, setManualCups] = useState(1)
  const [note, setNote] = useState('')

  // Filter customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      c.username.toLowerCase().includes(searchCustomer.toLowerCase())
  )

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
      : 0

  useEffect(() => {
    if (stampState?.success) {
      toast.success(stampState.message || 'บันทึกสำเร็จ!', { duration: 4500 })
      setCart([])
      setManualCups(1)
      setNote('')
      if (selectedCustomer) {
        const found = customers.find((c) => c.id === selectedCustomer.id)
        if (found) setSelectedCustomer(found)
      }
    } else if (stampState?.message) {
      toast.error(stampState.message)
    }
  }, [stampState])

  useEffect(() => {
    if (redeemState?.success) {
      toast.success(redeemState.message || 'แลกน้ำฟรีสำเร็จ!')
    } else if (redeemState?.message) {
      toast.error(redeemState.message)
    }
  }, [redeemState])

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
    <div className="space-y-5">
      {/* 1. ค้นหาลูกค้า */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
        <label className="block text-sm sm:text-base font-bold text-gray-900 mb-2">
          1. เลือกลูกค้าที่จะสะสมแต้ม
        </label>
        <input
          type="text"
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          placeholder="พิมพ์ชื่อ หรือ username ลูกค้า..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
        />
        {searchCustomer && (
          <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto border border-gray-100 rounded-xl p-1.5 bg-gray-50/50">
            {filteredCustomers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">ไม่พบรายชื่อลูกค้า</p>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c)
                    setSearchCustomer('')
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-emerald-100/70 bg-white transition flex items-center justify-between border border-gray-100 shadow-2xs"
                >
                  <div>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">{c.name}</p>
                    <p className="text-gray-500 text-xs">@{c.username}</p>
                  </div>
                  <span className="text-xs sm:text-sm bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full border border-emerald-200">
                    {c.stamps}/{stampsRequired} แต้ม
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* เมื่อเลือกลูกค้าแล้ว */}
      {selectedCustomer && (
        <>
          {/* Card แสดงสถานะลูกค้า */}
          <div className="bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-black text-emerald-950 text-base sm:text-lg">{selectedCustomer.name}</h3>
                <p className="text-emerald-800 text-xs sm:text-sm font-medium">
                  @{selectedCustomer.username} · ยอดซื้อสะสม {selectedCustomer.totalCups} แก้ว
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-red-500 text-2xl font-bold p-1 leading-none"
                title="เปลี่ยนลูกค้า"
              >
                ×
              </button>
            </div>

            {/* Stamp Dots */}
            <div className="flex gap-2 flex-wrap my-3 p-3 bg-white/80 rounded-xl border border-emerald-100">
              {Array.from({ length: stampsRequired }).map((_, i) => (
                <span
                  key={i}
                  className={`text-lg sm:text-xl transition-all ${
                    i < selectedCustomer.stamps ? 'opacity-100 scale-105' : 'opacity-20'
                  }`}
                >
                  ☕
                </span>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 font-bold">
              แต้มปัจจุบัน: <span className="text-emerald-700 text-sm sm:text-base">{selectedCustomer.stamps}/{stampsRequired} แก้ว</span>
              {selectedCustomer.freeRedeems > 0 && (
                <span className="text-amber-700 font-extrabold ml-2">
                  (มีสิทธิ์แลกฟรี {selectedCustomer.freeRedeems} แก้ว! 🎉)
                </span>
              )}
            </p>
          </div>

          {/* ปุ่มแลกน้ำฟรี ถ้ามีสิทธิ์ */}
          {selectedCustomer.freeRedeems > 0 && (
            <form action={redeemAction} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <input type="hidden" name="userId" value={selectedCustomer.id} />
              <div>
                <p className="font-black text-amber-950 text-sm sm:text-base">🎁 สิทธิ์แลกน้ำฟรี</p>
                <p className="text-xs sm:text-sm text-amber-800 font-medium">มีสิทธิ์แลกฟรีคงเหลือ {selectedCustomer.freeRedeems} แก้ว</p>
              </div>
              <button
                type="submit"
                disabled={redeemPending}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-amber-300 text-white font-black px-5 py-3 rounded-xl text-sm sm:text-base transition shadow-sm"
              >
                {redeemPending ? 'กำลังแลก...' : 'แลกน้ำฟรี 1 แก้ว'}
              </button>
            </form>
          )}

          {/* 2. เลือกสินค้า / เมนู */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
              <label className="text-sm sm:text-base font-bold text-gray-900">2. เลือกเมนูที่ลูกค้าสั่ง</label>
              <div className="flex bg-gray-100 p-1 rounded-xl text-xs sm:text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setEntryMode('menu')}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition ${
                    entryMode === 'menu' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  เลือกตามเมนู
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('manual')}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition ${
                    entryMode === 'manual' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  กรอกจำนวนแก้วเอง
                </button>
              </div>
            </div>

            {/* Mode A: เลือกตามเมนู */}
            {entryMode === 'menu' ? (
              <div className="space-y-4">
                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Menu Item Grid - Large Tap Targets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                  {filteredMenu.map((item) => {
                    const inCart = cart.find((i) => i.menuItemId === item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addToCart(item)}
                        className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition flex flex-col justify-between relative active:scale-97 ${
                          inCart
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20 bg-white'
                        }`}
                      >
                        {inCart && (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                            {inCart.quantity}
                          </span>
                        )}
                        <p className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 pr-6 leading-tight">
                          {item.name}
                        </p>
                        <p className="text-sm sm:text-base font-black text-emerald-700 mt-2">
                          {item.price} ฿
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* ตะกร้ารายการที่เลือก */}
                {cart.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 space-y-2.5 border border-slate-200">
                    <p className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" /> รายการที่สั่ง ({cart.length} เมนู)
                    </p>
                    <div className="space-y-2 divide-y divide-gray-200/70 max-h-56 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.menuItemId} className="flex items-center justify-between pt-2 text-xs sm:text-sm">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-gray-500 text-xs">{item.price} ฿/แก้ว</p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.menuItemId, -1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-l-xl text-gray-700 active:bg-gray-200"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center font-black text-sm text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.menuItemId, 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-r-xl text-gray-700 active:bg-gray-200"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="font-black text-emerald-700 w-16 text-right text-sm">
                              {(item.price * item.quantity).toLocaleString()} ฿
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.menuItemId)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
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
              <div className="p-6 bg-slate-50 rounded-2xl text-center space-y-3 border border-slate-200">
                <label className="text-sm font-bold text-gray-700">จำนวนแก้วทั้งหมดที่ซื้อ</label>
                <div className="flex items-center justify-center gap-5">
                  <button
                    type="button"
                    onClick={() => setManualCups(Math.max(1, manualCups - 1))}
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-300 text-gray-800 font-black text-2xl hover:bg-gray-100 active:scale-95 shadow-xs"
                  >
                    −
                  </button>
                  <span className="text-4xl sm:text-5xl font-black text-emerald-700 w-20">{manualCups}</span>
                  <button
                    type="button"
                    onClick={() => setManualCups(manualCups + 1)}
                    className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-2xl hover:bg-emerald-700 active:scale-95 shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* สรุปยอดรวม (Summary Bar) */}
            <div className="bg-emerald-700 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs sm:text-sm text-emerald-200 font-semibold">สรุปบิลนี้</p>
                <p className="text-2xl sm:text-3xl font-black tracking-tight">
                  {totalCups} แก้ว {totalAmount > 0 && `· ${totalAmount.toLocaleString()} ฿`}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block text-xs sm:text-sm bg-emerald-800 border border-emerald-500 px-3.5 py-1.5 rounded-full font-black">
                  + {totalCups} แต้ม
                </span>
              </div>
            </div>

            {/* Note input */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                หมายเหตุเพิ่มเติม (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น หวานน้อย, แยกน้ำแข็ง"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              />
            </div>

            {/* Submit Button */}
            <form action={stampAction}>
              <input type="hidden" name="userId" value={selectedCustomer.id} />
              <input type="hidden" name="cups" value={totalCups} />
              <input type="hidden" name="note" value={note} />
              <input
                type="hidden"
                name="itemsJson"
                value={entryMode === 'menu' ? JSON.stringify(cart) : '[]'}
              />

              <button
                type="submit"
                disabled={stampPending || totalCups <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                {stampPending
                  ? 'กำลังบันทึกรายการ...'
                  : `บันทึกรายการ (ได้ ${totalCups} แต้ม)`}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
