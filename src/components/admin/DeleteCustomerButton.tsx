'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCustomer } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteCustomerButtonProps {
  customerId: string
  customerName: string
}

export default function DeleteCustomerButton({
  customerId,
  customerName,
}: DeleteCustomerButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('userId', customerId)
      const res = await deleteCustomer(undefined, formData)

      if (res?.success) {
        toast.success(res.message || 'ลบลูกค้าสำเร็จ')
        setIsOpen(false)
        router.push('/admin/customers')
        router.refresh()
      } else {
        toast.error(res?.message || 'เกิดข้อผิดพลาดในการลบลูกค้า')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full mt-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl border border-red-200 transition text-sm active:scale-98"
      >
        <Trash2 className="w-4 h-4" />
        <span>ลบลูกค้าคนนี้ (เฉพาะ Super Admin)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-gray-900 text-lg">ยืนยันการลบลูกค้า</h3>
              <p className="text-sm text-gray-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ{' '}
                <strong className="text-red-600 font-bold">{customerName}</strong>?
              </p>
              <p className="text-xs text-gray-400">
                ⚠️ แต้มสะสมและประวัติการซื้อทั้งหมดของลูกค้านี้จะถูกลบถาวร
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black text-sm rounded-xl transition shadow-sm"
              >
                {isPending ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
