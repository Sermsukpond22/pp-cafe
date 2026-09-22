'use client'

import { useState, useTransition } from 'react'
import {
  createMenuItem,
  updateMenuItem,
  toggleMenuItem,
  deleteMenuItem,
} from '@/app/actions/menu'
import toast from 'react-hot-toast'
import { Plus, Coffee, Trash2, Power, Pencil, X } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  isActive: boolean
}

export default function MenuManager({ initialMenu }: { initialMenu: MenuItem[] }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const [addErrors, setAddErrors] = useState<Record<string, string[]> | undefined>()
  const [editErrors, setEditErrors] = useState<Record<string, string[]> | undefined>()

  const [isPending, startTransition] = useTransition()

  const categories = ['ทั้งหมด', ...Array.from(new Set(initialMenu.map((m) => m.category)))]

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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบเมนู "${name}" ใช่หรือไม่?`)) {
      startTransition(async () => {
        try {
          await deleteMenuItem(id)
          toast.success(`ลบเมนู "${name}" แล้ว`)
        } catch {
          toast.error('เกิดข้อผิดพลาดในการลบ')
        }
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ค้นหาชื่อเมนู..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-2xs"
          />
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setAddErrors(undefined)
          }}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {showAddForm ? 'ปิดฟอร์ม' : '+ เพิ่มเมนูใหม่'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form action={handleCreate} className="bg-white rounded-3xl shadow-sm border-2 border-emerald-100 p-5 sm:p-6 space-y-4">
          <h3 className="font-black text-gray-900 text-base sm:text-lg flex items-center gap-2">
            <Coffee className="w-5 h-5 text-emerald-600" /> เพิ่มเมนูใหม่เข้าร้าน
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">ชื่อเมนู *</label>
              <input
                name="name"
                placeholder="เช่น ชาเขียวมัทฉะเย็น"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              {addErrors?.name && <p className="text-red-500 text-xs mt-1">{addErrors.name[0]}</p>}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">ราคา (บาท) *</label>
              <input
                name="price"
                type="number"
                step="any"
                min="0"
                placeholder="เช่น 55"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              {addErrors?.price && <p className="text-red-500 text-xs mt-1">{addErrors.price[0]}</p>}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">หมวดหมู่ *</label>
              <input
                name="category"
                placeholder="เช่น กาแฟ, ชา, นม"
                defaultValue="เครื่องดื่ม"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              {addErrors?.category && <p className="text-red-500 text-xs mt-1">{addErrors.category[0]}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setAddErrors(undefined)
              }}
              className="px-5 py-2.5 text-sm sm:text-base text-gray-500 hover:text-gray-700 font-bold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black px-6 py-2.5 rounded-xl text-sm sm:text-base transition shadow-sm"
            >
              {isPending ? 'กำลังบันทึก...' : 'บันทึกเมนู'}
            </button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-base sm:text-lg flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" /> แก้ไขเมนู
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null)
                  setEditErrors(undefined)
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={editingItem.id} />

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">ชื่อเมนู *</label>
                <input
                  name="name"
                  defaultValue={editingItem.name}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-emerald-400 outline-none"
                />
                {editErrors?.name && <p className="text-red-500 text-xs mt-1">{editErrors.name[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">ราคา (บาท) *</label>
                  <input
                    name="price"
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={editingItem.price}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                  {editErrors?.price && <p className="text-red-500 text-xs mt-1">{editErrors.price[0]}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">หมวดหมู่ *</label>
                  <input
                    name="category"
                    defaultValue={editingItem.category}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                  {editErrors?.category && <p className="text-red-500 text-xs mt-1">{editErrors.category[0]}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null)
                    setEditErrors(undefined)
                  }}
                  className="px-5 py-2.5 text-sm sm:text-base text-gray-500 hover:text-gray-700 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black px-6 py-2.5 rounded-xl text-sm sm:text-base transition shadow-sm"
                >
                  {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <Coffee className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-base font-bold text-gray-500">ไม่พบรายการเมนู</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 flex items-center justify-between gap-3 transition ${
                !item.isActive ? 'bg-gray-50/80 opacity-60' : 'hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.name}</h4>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {item.category}
                  </span>
                  {!item.isActive && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                      ปิดขาย
                    </span>
                  )}
                </div>
                <p className="text-base sm:text-lg font-black text-emerald-700 mt-1">{item.price} ฿</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingItem(item)
                    setEditErrors(undefined)
                  }}
                  title="แก้ไขเมนู"
                  className="p-2.5 sm:p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition"
                >
                  <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleToggle(item.id, item.isActive)}
                  title={item.isActive ? 'ปิดการขาย' : 'เปิดการขาย'}
                  className={`p-2.5 sm:p-3 rounded-xl border transition ${
                    item.isActive
                      ? 'border-gray-200 text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                      : 'border-emerald-200 text-emerald-600 bg-emerald-50'
                  }`}
                >
                  <Power className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  title="ลบเมนู"
                  className="p-2.5 sm:p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
