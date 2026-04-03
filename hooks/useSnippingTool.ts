'use client'
import { useCallback, useRef, useState } from 'react'

export type CaptureMode = 'screen' | 'element'
export type SnipStatus = 'idle' | 'selecting' | 'capturing' | 'uploading' | 'done' | 'error'
export interface SnipResult { id: string; url: string }

export function useSnippingTool(options: {
  mode?: CaptureMode
  targetRef?: React.RefObject<HTMLElement>
} = {}) {
  const { mode = 'screen', targetRef } = options
  const [status, setStatus] = useState<SnipStatus>('idle')
  const [result, setResult] = useState<SnipResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const capture = useCallback(async () => {
    setError(null); setResult(null); setStatus('idle')
    try {
      let blob: Blob
      if (mode === 'element') {
        setStatus('capturing')
        const html2canvas = (await import('html2canvas')).default
        const el = targetRef?.current ?? document.body
        const canvas = await html2canvas(el, {
          useCORS: true,
          scale: window.devicePixelRatio || 1,
          logging: false,
        })
        blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
        )
      } else {
        setStatus('selecting')
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' } as MediaTrackConstraints,
          audio: false,
        })
        streamRef.current = stream
        const video = document.createElement('video')
        video.srcObject = stream
        video.muted = true
        await new Promise<void>(r => { video.onloadedmetadata = () => { video.play(); r() } })
        await new Promise(r => setTimeout(r, 150))
        const selection = await showSelectionOverlay(video)
        stream.getTracks().forEach(t => t.stop())
        if (!selection) { setStatus('idle'); return }
        const canvas = document.createElement('canvas')
        canvas.width = selection.w
        canvas.height = selection.h
        canvas.getContext('2d')!.drawImage(
          video,
          selection.x, selection.y, selection.w, selection.h,
          0, 0, selection.w, selection.h
        )
        blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => b ? res(b) : rej(new Error('crop failed')), 'image/png')
        )
      }
      setStatus('uploading')
      const fd = new FormData()
      fd.append('file', blob, 'screenshot.png')
      const res = await fetch('/api/upload-screenshot', { method: 'POST', body: fd })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Upload failed')
      }
      const data: SnipResult = await res.json()
      setResult(data)
      setStatus('done')
      try { await navigator.clipboard.writeText(data.url) } catch { /* clipboard permission denied */ }
      return data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (/Permission denied|NotAllowed|cancel/i.test(msg)) { setStatus('idle'); return }
      setError(msg)
      setStatus('error')
    }
  }, [mode, targetRef])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return { capture, reset, status, result, error }
}

interface SelectionRect { x: number; y: number; w: number; h: number }

function showSelectionOverlay(video: HTMLVideoElement): Promise<SelectionRect | null> {
  return new Promise(resolve => {
    const overlay = document.createElement('div')
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '2147483647',
      cursor: 'crosshair', userSelect: 'none', background: 'rgba(0,0,0,0.3)',
    })

    const box = document.createElement('div')
    Object.assign(box.style, {
      position: 'absolute', display: 'none', boxSizing: 'border-box',
      border: '2px solid #fff', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
      background: 'transparent',
    })
    overlay.appendChild(box)

    const label = document.createElement('div')
    Object.assign(label.style, {
      position: 'absolute', display: 'none',
      background: 'rgba(0,0,0,0.7)', color: '#fff',
      fontSize: '11px', fontFamily: 'monospace',
      padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none',
    })
    overlay.appendChild(label)

    const hint = document.createElement('div')
    Object.assign(hint.style, {
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      color: 'rgba(255,255,255,0.9)', fontSize: '16px',
      fontFamily: 'system-ui,sans-serif', textAlign: 'center',
      lineHeight: '1.7', pointerEvents: 'none',
    })
    hint.innerHTML = 'ลากเพื่อเลือกพื้นที่<br><span style="font-size:12px;opacity:0.6">Esc เพื่อยกเลิก</span>'
    overlay.appendChild(hint)
    document.body.appendChild(overlay)

    let sx = 0, sy = 0, dragging = false

    overlay.addEventListener('mousedown', e => {
      dragging = true; sx = e.clientX; sy = e.clientY
      hint.style.display = 'none'
    })

    overlay.addEventListener('mousemove', e => {
      if (!dragging) return
      const l = Math.min(sx, e.clientX), t = Math.min(sy, e.clientY)
      const w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy)
      Object.assign(box.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px', display: 'block' })
      Object.assign(label.style, { left: l + 'px', top: (t - 22) + 'px', display: 'block' })
      label.textContent = `${w} × ${h}`
    })

    overlay.addEventListener('mouseup', e => {
      if (!dragging) return
      dragging = false
      const l = Math.min(sx, e.clientX), t = Math.min(sy, e.clientY)
      const w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy)
      document.body.removeChild(overlay)
      document.removeEventListener('keydown', onKey)
      if (w < 10 || h < 10) { resolve(null); return }
      resolve({
        x: Math.round(l * video.videoWidth / window.innerWidth),
        y: Math.round(t * video.videoHeight / window.innerHeight),
        w: Math.round(w * video.videoWidth / window.innerWidth),
        h: Math.round(h * video.videoHeight / window.innerHeight),
      })
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay)
        document.removeEventListener('keydown', onKey)
        resolve(null)
      }
    }
    document.addEventListener('keydown', onKey)
  })
}
