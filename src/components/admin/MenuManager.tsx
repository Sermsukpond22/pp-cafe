'use client'

import { useState, useTransition } from 'react'
import {
  createMenuItem,
  updateMenuItem,
  toggleMenuItem,
  deleteMenuItem,
} from '@/app/actions/menu'
import toast from 'react-hot-toast'
import { Plus, Search, Coffee, Trash2, Power, Pencil, X, AlertTriangle } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  isActive: boolean
}

const PRESET_CATEGORIES = ['ชา', 'กาแฟ', 'นม/ช็อกโกแลต', 'สมูทตี้/ผลไม้', 'เบเกอรี่']

export default function MenuManager({ initialMenu }: { initialMenu: MenuItem[] }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addCategoryInput, setAddCategoryInput] = useState('ชา')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editCategoryInput, setEditCategoryInput] = useState('')
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null)

  const [addErrors, setAddErrors] = useState<Record<string, string[]> | undefined>()
  const [editErrors, setEditErrors] = useState<Record<string, string[]> | undefined>()

  const [isPending, startTransition] = useTransition()

  const categories = ['ทั้งหมด', ...Array.from(new Set(initialMenu.map((m) => m.category)))]
  const activeCount = initialMenu.filter((m) => m.isActive).length
  const inactiveCount = initialMenu.length - activeCount

  const filtered = initialMenu.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory
    return matchSearch && matchCategory
  })

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const res = await createMenuItem(undefined, formData)
      if (res?.success) {
        toast.success(res.message || 'บันทึกสำเร็จ')
        setShowAddForm(false)
        setAddErrors(undefined)
      } else {
        if (res?.errors) setAddErrors(res.errors)
        if (res?.message) toast.error(res.message)
      }
    })
  }

  const handleUpdate = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateMenuItem(undefined, formData)
      if (res?.success) {
        toast.success(res.message || 'แก้ไขเมนูสำเร็จ')
        setEditingItem(null)
        setEditErrors(undefined)
      } else {
        if (res?.errors) setEditErrors(res.errors)
        if (res?.message) toast.error(res.message)
      }
    })
  }

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleMenuItem(id, current)
        toast.success(current ? 'ปิดการขายเมนูนี้แล้ว' : 'เปิดการขายเมนูนี้แล้ว')
      } catch {
        toast.error('เกิดข้อผิดพลาด')
      }
    })
  }

  const confirmDelete = () => {
    if (!deletingItem) return
    const target = deletingItem
    startTransition(async () => {
      try {
        await deleteMenuItem(target.id)
        toast.success(`ลบเมนู "${target.name}" แล้ว`)
        setDeletingItem(null)
      } catch {
        toast.error('เกิดข้อผิดพลาดในการลบ')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Unified Toolbar Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเมนู..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 h-9 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setAddErrors(undefined)
            }}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-4 h-9 rounded-xl font-bold text-xs sm:text-sm transition shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'ปิดฟอร์ม' : 'เพิ่มเมนูใหม่'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-100 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat
              const count =
                cat === 'ทั้งหมด'
                  ? initialMenu.length
                  : initialMenu.filter((m) => m.category === cat).length
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[11px] ${
                      active ? 'bg-emerald-700 text-emerald-50' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
            <span>เปิดขาย {activeCount}</span>
            <span>·</span>
            <span>ปิดชั่วคราว {inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Add Menu Form */}
      {showAddForm && (
        <form
          action={handleCreate}
          className="bg-white rounded-2xl shadow-xs border border-emerald-200 p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <Coffee className="w-4 h-4 text-emerald-600" /> เพิ่มเมนูใหม่เข้าร้าน
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อเมนู *</label>
              <input
                name="name"
                placeholder="เช่น ชาเขียวมัทฉะเย็น"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              {addErrors?.name && <p className="text-red-500 text-xs mt-1">{addErrors.name[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ราคา (บาท) *</label>
              <input
                name="price"
                type="number"
                step="any"
                min="0"
                placeholder="เช่น 55"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              {addErrors?.price && (
                <p className="text-red-500 text-xs mt-1">{addErrors.price[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">หมวดหมู่ *</label>
              <input
                name="category"
                value={addCategoryInput}
                onChange={(e) => setAddCategoryInput(e.target.value)}
                placeholder="เช่น กาแฟ, ชา, นม"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_CATEGORIES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAddCategoryInput(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                      addCategoryInput === preset
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              {addErrors?.category && (
                <p className="text-red-500 text-xs mt-1">{addErrors.category[0]}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setAddErrors(undefined)
              }}
              className="px-4 py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition shadow-2xs"
            >
              {isPending ? 'กำลังบันทึก...' : 'บันทึกเมนู'}
            </button>
          </div>
        </form>
      )}

      {/* Menu List Card */}
      <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100 divide-y divide-gray-100 w-full min-w-0">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Coffee className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold text-gray-600">ไม่พบรายการเมนู</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex items-center justify-between gap-3 transition ${
                !item.isActive ? 'bg-gray-50/70 opacity-65' : 'hover:bg-gray-50/50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium shrink-0">
                    {item.category}
                  </span>
                  {!item.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200/70 font-semibold shrink-0">
                      ปิดชั่วคราว
                    </span>
                  )}
                </div>
                <p className="text-sm font-black text-emerald-700 mt-1">{item.price} ฿</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggle(item.id, item.isActive)}
                  title={item.isActive ? 'กดเพื่อปิดการขายชั่วคราว' : 'กดเพื่อเปิดขาย'}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    item.isActive
                      ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {item.isActive ? 'เปิดขายอยู่' : 'เปิดขาย'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setEditingItem(item)
                    setEditCategoryInput(item.category)
                    setEditErrors(undefined)
                  }}
                  title="แก้ไขเมนู"
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingItem(item)}
                  title="ลบเมนู"
                  className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" /> แก้ไขเมนู
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null)
                  setEditErrors(undefined)
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={handleUpdate} className="space-y-3.5">
              <input type="hidden" name="id" value={editingItem.id} />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อเมนู *</label>
                <input
                  name="name"
                  defaultValue={editingItem.name}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                />
                {editErrors?.name && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.name[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ราคา (บาท) *</label>
                  <input
                    name="price"
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={editingItem.price}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                  {editErrors?.price && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.price[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">หมวดหมู่ *</label>
                  <input
                    name="category"
                    value={editCategoryInput}
                    onChange={(e) => setEditCategoryInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                  {editErrors?.category && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.category[0]}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {PRESET_CATEGORIES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditCategoryInput(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                      editCategoryInput === preset
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null)
                    setEditErrors(undefined)
                  }}
                  className="px-4 py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition"
                >
                  {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">ยืนยันการลบเมนู</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                ต้องการลบเมนู <strong className="text-red-600">{deletingItem.name}</strong> ใช่หรือไม่?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-xs sm:text-sm rounded-xl transition"
              >
                {isPending ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
