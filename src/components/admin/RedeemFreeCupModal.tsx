'use client'

import { useState, useEffect, useMemo } from 'react'
import { Gift, X, Search, Check, Loader2, Sparkles, Coffee } from 'lucide-react'

export interface CustomerSummary {
  id: string
  name: string
  username: string
  phone?: string | null
  stamps: number
  freeRedeems: number
  totalCups: number
}

export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  isActive: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  customer: CustomerSummary
  menuItems: MenuItem[]
  isPending: boolean
  onConfirmRedeem: (menuItemId?: string, menuItemName?: string, note?: string) => void
}

export default function RedeemFreeCupModal({
  isOpen,
  onClose,
  customer,
  menuItems,
  isPending,
  onConfirmRedeem,
}: Props) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPending, onClose])

  // Extract unique categories from active items
  const categories = useMemo(() => {
    const activeItems = menuItems.filter((i) => i.isActive)
    const cats = Array.from(new Set(activeItems.map((i) => i.category))).filter(Boolean)
    return ['all', ...cats]
  }, [menuItems])

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isActive) return false
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      }
      return true
    })
  }, [menuItems, selectedCategory, search])

  if (!isOpen) return null

  const handleSelectMenuRedeem = () => {
    if (!selectedItem) return
    onConfirmRedeem(selectedItem.id, selectedItem.name, note.trim())
  }

  const handleQuickRedeem = () => {
    onConfirmRedeem(undefined, undefined, note.trim() || undefined)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-5 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Gift className="w-5 h-5 text-emerald-100 fill-emerald-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-1.5">
                <span>แลกเครื่องดื่มฟรี 1 แก้ว</span>
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  🎁 สิทธิ์คงเหลือ {customer.freeRedeems}
                </span>
              </h2>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                ลูกค้า: <strong className="text-white">{customer.name}</strong>
                {customer.phone && ` (${customer.phone})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Search & Category Filter */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อเมนูที่ต้องการแลก..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categories.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? '✨ ทั้งหมด' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu Items Grid */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                <span>คลิกเลือกเมนูที่ลูกค้าแลก</span>
              </span>
              {selectedItem && (
                <span className="text-emerald-700 font-extrabold text-[11px] animate-in fade-in">
                  เลือกแล้ว: {selectedItem.name}
                </span>
              )}
            </label>

            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">ไม่พบเมนูที่ค้นหา</p>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setSelectedCategory('all')
                    }}
                    className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                  >
                    ล้างการค้นหา
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(isSelected ? null : item)}
                      className={`text-left p-3 rounded-2xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs ring-2 ring-emerald-400/40'
                          : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">
                            {item.category}
                          </span>
                          <span className="text-[11px] text-gray-400 line-through">
                            {item.price} ฿
                          </span>
                          <span className="text-[11px] font-black text-emerald-700">ฟรี 0 ฿</span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'border border-gray-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น หวาน 25%, ไม่ใส่น้ำเชื่อม, แก้วใหญ่..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 space-y-2.5 shrink-0">
          {/* Primary Action Button (If menu item selected) */}
          <button
            type="button"
            onClick={handleSelectMenuRedeem}
            disabled={!selectedItem || isPending}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-98 disabled:from-gray-300 disabled:to-gray-300 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึกการแลก...</span>
              </>
            ) : selectedItem ? (
              <>
                <Sparkles className="w-4 h-4 fill-emerald-200 text-emerald-200" />
                <span>ยืนยันแลกฟรี: {selectedItem.name} (0 ฿)</span>
              </>
            ) : (
              <span>โปรดเลือกเมนูด้านบนเพื่อยืนยัน</span>
            )}
          </button>

          {/* Secondary Quick Action & Cancel Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQuickRedeem}
              disabled={isPending}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-emerald-50 active:scale-98 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="แลกทันทีโดยไม่ต้องระบุเมนู สำหรับช่วงเวลาคิวเร่งรีบ"
            >
              <span>⚡ แลกด่วน (ไม่ระบุเมนู)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 active:scale-98 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
