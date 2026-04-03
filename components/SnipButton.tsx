'use client'
import { useEffect, useRef, useState } from 'react'
import { useSnippingTool, type CaptureMode } from '@/hooks/useSnippingTool'
import { cn } from '@/lib/utils'

interface SnipButtonProps {
  onCapture?: (url: string, id: string) => void
  /** ซ่อน dropdown เลือก mode */
  hideModeSelector?: boolean
  defaultMode?: CaptureMode
  /** compact=true → render เป็น icon button w-7 h-7 สำหรับใช้ใน task row */
  compact?: boolean
}

const NATIVE_URL = 'http://127.0.0.1:9374'

export function SnipButton({
  onCapture,
  hideModeSelector = false,
  defaultMode = 'screen',
  compact = false,
}: SnipButtonProps) {
  const [mode, setMode] = useState<CaptureMode>(defaultMode)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ url: string } | { error: string } | null>(null)
  const [nativeLoading, setNativeLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const menuRef = useRef<HTMLDivElement>(null)
  const { capture, reset, status: browserStatus, result, error } = useSnippingTool({ mode })

  // status รวม: native loading มาก่อน, ถ้าไม่มีใช้ browser status
  const status = nativeLoading ? 'selecting' : browserStatus
  const isLoading = nativeLoading || ['selecting', 'uploading', 'capturing'].includes(browserStatus)

  // ── Browser fallback result handler ──────────────────────
  useEffect(() => {
    if (browserStatus === 'done' && result) {
      onCapture?.(result.url, result.id)
      showToast({ url: result.url })
    }
    if (browserStatus === 'error' && error) {
      showToast({ error })
    }
  }, [browserStatus, result, error]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Click outside dropdown ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function showToast(t: { url: string } | { error: string }) {
    clearTimeout(timerRef.current)
    setToast(t)
    timerRef.current = setTimeout(() => {
      setToast(null)
      reset()
    }, 'error' in t ? 5000 : 4000)
  }

  // ── Main capture handler ──────────────────────────────────
  async function handleCapture() {
    if (isLoading) return

    // 1. ลอง native Electron app ก่อน
    try {
      const ping = await fetch(`${NATIVE_URL}/ping`, {
        signal: AbortSignal.timeout(500),
      })
      if (ping.ok) {
        setNativeLoading(true)
        const res = await fetch(`${NATIVE_URL}/snip`, {
          method: 'POST',
          signal: AbortSignal.timeout(30000),
        })
        const data = await res.json()
        setNativeLoading(false)
        if (data.url) {
          onCapture?.(data.url, 'native')
          showToast({ url: data.url })
        }
        // data.error === 'cancelled' → ไม่ทำอะไร
        return
      }
    } catch {
      setNativeLoading(false)
      // native ไม่รัน → fallback browser
    }

    // 2. Browser fallback
    capture()
  }

  // ── Label ปุ่ม ────────────────────────────────────────────
  const btnLabel = (() => {
    if (status === 'uploading') return '⏳ กำลังอัพโหลด...'
    if (status === 'selecting') return '✂️ เลือกพื้นที่...'
    if (status === 'capturing') return '⏳ กำลัง Capture...'
    return '✂️ Snip'
  })()

  return (
    <>
      {compact ? (
        /* ── Compact mode: icon button เดียว ── */
        <button
          title="จับภาพหน้าจอ (Snip)"
          onClick={handleCapture}
          disabled={isLoading}
          className={cn(
            'text-xs w-7 h-7 flex items-center justify-center rounded-md transition-colors',
            isLoading
              ? 'text-blue-400 bg-blue-50'
              : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
          )}
        >
          {isLoading ? '⏳' : '✂️'}
        </button>
      ) : (
        /* ── Full mode: ปุ่ม + dropdown ── */
        <div className="inline-flex rounded-lg border border-gray-200 overflow-visible">
          <button
            onClick={handleCapture}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 rounded-l-lg"
          >
            {btnLabel}
          </button>

          {!hideModeSelector && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                disabled={isLoading}
                className="text-xs px-2 py-1.5 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors border-l border-gray-700 rounded-r-lg"
              >
                ▾
              </button>

              {menuOpen && (
                <div className="absolute top-[calc(100%+4px)] right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[200px] z-[9999]">
                  {(['screen', 'element'] as CaptureMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); setMenuOpen(false) }}
                      className={cn(
                        'flex flex-col w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 border-none cursor-pointer',
                        mode === m ? 'bg-gray-50' : 'bg-white'
                      )}
                    >
                      <span className={cn('text-gray-700', mode === m ? 'font-semibold' : 'font-normal')}>
                        {m === 'screen' ? '🖥 ทั้งหน้าจอ' : '🪟 เฉพาะ UI'}
                      </span>
                      <span className="text-xs text-gray-400 mt-0.5">
                        {m === 'screen'
                          ? 'ลากเลือกพื้นที่บนหน้าจอ (Gyazo-style)'
                          : 'Capture เฉพาะ UI ในเว็บ'}
                      </span>
                    </button>
                  ))}
                  <div className="px-3.5 py-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      💡 ถ้ารัน PokerSnip app อยู่ จะใช้ native mode อัตโนมัติ
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-[99999] border rounded-xl px-4 py-3 shadow-lg text-xs max-w-xs',
            'error' in toast
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          )}
        >
          {'error' in toast ? (
            `⚠️ ${toast.error}`
          ) : (
            <>
              <span className="font-medium">✅ คัดลอกแล้ว!</span>
              <br />
              <span className="opacity-60 break-all">{toast.url}</span>
            </>
          )}
        </div>
      )}
    </>
  )
}
