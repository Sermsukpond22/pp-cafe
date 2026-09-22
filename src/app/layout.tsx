import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PP Cafe — สะสมแต้ม',
  description: 'ระบบสะสมแต้มร้าน PP Cafe ซื้อครบ 10 แก้ว รับฟรี 1 แก้ว',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#059669',
              color: '#fff',
              borderRadius: '12px',
              fontFamily: 'inherit',
            },
          }}
        />
      </body>
    </html>
  )
}
