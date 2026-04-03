'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Screenshot {
  id: string
  url: string
  storagePath: string
  takenBy: string | null
  note: string | null
  createdAt: string
}

export function ScreenshotGallery() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<Screenshot | null>(null)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  async function fetchScreenshots() {
    try {
      const res = await fetch('/api/screenshots')
      const data = await res.json()
      setScreenshots(data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScreenshots()
    const interval = setInterval(fetchScreenshots, 10000)
    return () => clearInterval(interval)
  }, [])

  async function deleteScreenshot(id: string) {
    if (!confirm('ลบภาพนี้?')) return
    await fetch(`/api/screenshots/${id}`, { method: 'DELETE' })
    setScreenshots(prev => prev.filter(s => s.id !== id))
    if (lightbox?.id === id) setLightbox(null)
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    clearTimeout(copyTimerRef.current)
    setCopied(true)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  if (loading) {
    return (
      <div className="mt-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Screenshots</h2>
        <p className="text-xs text-gray-400">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">
            Screenshots {screenshots.length > 0 && `(${screenshots.length})`}
          </h2>
          <button
            onClick={fetchScreenshots}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            รีเฟรช
          </button>
        </div>

        {screenshots.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">
              ยังไม่มีภาพ — กด ✂️ หรือ Ctrl+Shift+S เพื่อ Snip
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {screenshots.map((shot) => (
              <div
                key={shot.id}
                className="group relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-video cursor-pointer"
                onClick={() => setLightbox(shot)}
              >
                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.url}
                  alt={shot.note ?? 'screenshot'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                  <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{formatDate(shot.createdAt)}</p>
                    {shot.takenBy && (
                      <p className="text-white/60 text-xs truncate">{shot.takenBy}</p>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteScreenshot(shot.id) }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.note ?? 'screenshot'}
              className="w-full max-h-[70vh] object-contain bg-gray-50"
            />

            <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {formatDate(lightbox.createdAt)}
                </p>
                {lightbox.takenBy && (
                  <p className="text-xs text-gray-400">{lightbox.takenBy}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(lightbox.url)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                    copied
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  )}
                >
                  {copied ? '✅ Copied!' : 'Copy URL'}
                </button>
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  เปิดใน Tab
                </a>
                <button
                  onClick={() => deleteScreenshot(lightbox.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
