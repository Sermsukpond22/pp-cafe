import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import StoreQRCode from '@/components/admin/StoreQRCode'

export default async function StoreQRCodePage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  return (
    <div className="p-4 md:p-6 pb-24 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">📱 QR Code ประจำร้าน</h1>
        <p className="text-sm text-gray-500 mt-1">
          สำหรับตั้งหน้าร้าน ให้ลูกค้าสแกนเพื่อเข้าเว็บหรือสมัครสมาชิก
        </p>
      </div>

      <StoreQRCode />
    </div>
  )
}
