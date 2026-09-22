'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, Printer, Copy, Check } from 'lucide-react'

export default function StoreQRCode() {
  const [url, setUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const generateQR = useCallback(async (link: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(link, {
        width: 320,
        margin: 2,
        color: {
          dark: '#059669', // emerald-600
          light: '#FFFFFF',
        },
      })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    // Default to window origin or current domain
    const defaultUrl = `${window.location.origin}/register`
    const timer = setTimeout(() => {
      setUrl(defaultUrl)
      void generateQR(defaultUrl)
    }, 0)
    return () => clearTimeout(timer)
  }, [generateQR])

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    generateQR(newUrl)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 print:hidden">
        <label className="block text-sm font-semibold text-gray-700">
          ลิงก์สำหรับสร้าง QR Code (ปกติคือหน้าสมัครสมาชิก)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="https://your-domain.vercel.app/register"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
        </div>
      </div>

      {/* Printable Poster Card */}
      <div id="qr-poster" className="bg-white border-2 border-emerald-500 rounded-3xl p-8 max-w-sm mx-auto shadow-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-3">
          <span className="text-3xl">🧋</span>
        </div>
        <h2 className="text-2xl font-bold text-emerald-800">PP Cafe</h2>
        <p className="text-sm font-medium text-emerald-600 mb-6">สแกนเพื่อสมัครสมาชิก & สะสมแต้ม</p>

        {qrDataUrl ? (
          <div className="flex justify-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Store QR Code" className="w-64 h-64 rounded-xl" />
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <QrCode className="w-12 h-12 text-gray-300 animate-pulse" />
          </div>
        )}

        <div className="bg-emerald-700 text-white rounded-xl py-3 px-4 shadow">
          <p className="font-bold text-base">ซื้อครบ 10 แก้ว แลกฟรี 1 แก้ว!</p>
          <p className="text-xs text-emerald-200 mt-0.5">เปิดดูแต้มได้ทุกที่ทุกเวลา</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 print:hidden">
        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download="pp-cafe-qr.png"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-3 rounded-xl shadow transition"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดรูปภาพ
          </a>
        )}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-3 rounded-xl transition"
        >
          <Printer className="w-4 h-4" />
          พิมพ์ใบตั้งโต๊ะ
        </button>
      </div>
    </div>
  )
}
