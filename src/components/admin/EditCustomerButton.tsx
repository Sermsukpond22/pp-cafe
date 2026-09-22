'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import EditCustomerModal, { CustomerEditable } from './EditCustomerModal'

export default function EditCustomerButton({ customer }: { customer: CustomerEditable }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition shadow-2xs active:scale-95"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>แก้ไขข้อมูล</span>
      </button>

      <EditCustomerModal
        customer={customer}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
