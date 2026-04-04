'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface HandTag {
  id: string
  tagText: string
}

interface Screenshot {
  id: string
  url: string
  storagePath: string
  takenBy: string | null
  createdAt: string
  user?: { username: string; displayName: string } | null
  tags: { handTag: HandTag }[]
}

function CapturesContent() {
  const searchParams = useSearchParams()
  const latestId = searchParams.get('id')

  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [selected, setSelected] = useState<Screenshot | null>(null)
  const [allTags, setAllTags] = useState<HandTag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [currentTags, setCurrentTags] = useState<HandTag[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedInitialized = useRef(false)

  useEffect(() => {
    Promise.all([fetchScreenshots(), fetchAllTags()]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedInitialized.current || screenshots.length === 0) return
    selectedInitialized.current = true
    const target = latestId ? screenshots.find(s => s.id === latestId) ?? screenshots[0] : screenshots[0]
    selectScreenshot(target)
  }, [screenshots, latestId])

  const fetchScreenshots = async () => {
    const res = await fetch('/api/screenshots')
    const data = await res.json()
    setScreenshots(Array.isArray(data) ? data : [])
  }

  const fetchAllTags = async () => {
    const res = await fetch('/api/handtags')
    const data = await res.json()
    setAllTags(Array.isArray(data) ? data : [])
  }

  const selectScreenshot = (shot: Screenshot) => {
    setSelected(shot)
    setCurrentTags(shot.tags.map(t => t.handTag))
    setTagInput('')
    setSaved(false)
  }

  const addTag = (text: string) => {
    const clean = text.replace(/^#/, '').trim().toLowerCase()
    if (!clean) return
    if (currentTags.find(t => t.tagText === clean)) return
    setCurrentTags(prev => [...prev, { id: 'new-' + clean, tagText: clean }])
    setTagInput('')
    inputRef.current?.focus()
  }

  const removeTag = (tagText: string) => {
    setCurrentTags(prev => prev.filter(t => t.tagText !== tagText))
  }

  const saveTags = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await fetch(`/api/screenshots/${selected.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagTexts: currentTags.map(t => t.tagText) }),
      })
      await Promise.all([fetchScreenshots(), fetchAllTags()])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const filteredScreenshots = filterTag
    ? screenshots.filter(s => s.tags.some(t => t.handTag.tagText === filterTag))
    : screenshots

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: '#8C7B6B' }}>
        <p className="text-sm">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Left sidebar — รายการรูป */}
      <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 272, borderRight: '1px solid #DDD5C8', background: '#FFFFFF' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid #DDD5C8' }}>
          <h1 className="text-sm font-semibold" style={{ color: '#2C2825' }}>Captures</h1>
          <p className="text-xs mt-0.5" style={{ color: '#8C7B6B' }}>{screenshots.length} ภาพ</p>
        </div>

        {/* Filter tags */}
        {allTags.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2 flex flex-wrap gap-1" style={{ borderBottom: '1px solid #DDD5C8' }}>
            <button
              onClick={() => setFilterTag(null)}
              className="text-xs px-2 py-0.5 rounded-full transition-colors"
              style={!filterTag
                ? { background: '#8B6F47', color: '#FAF8F5' }
                : { background: '#EDE5D8', color: '#5C4A32' }}
            >
              ทั้งหมด
            </button>
            {allTags.slice(0, 8).map(tag => (
              <button
                key={tag.id}
                onClick={() => setFilterTag(filterTag === tag.tagText ? null : tag.tagText)}
                className="text-xs px-2 py-0.5 rounded-full transition-colors"
                style={filterTag === tag.tagText
                  ? { background: '#8B6F47', color: '#FAF8F5' }
                  : { background: '#EDE5D8', color: '#5C4A32' }}
              >
                #{tag.tagText}
              </button>
            ))}
          </div>
        )}

        {/* Screenshot list */}
        <div className="flex-1 overflow-y-auto">
          {filteredScreenshots.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-xs" style={{ color: '#8C7B6B' }}>ไม่มีรูป</p>
            </div>
          ) : (
            filteredScreenshots.map(shot => (
              <button
                key={shot.id}
                onClick={() => selectScreenshot(shot)}
                className="w-full flex gap-3 p-3 text-left transition-colors"
                style={{
                  borderBottom: '1px solid #DDD5C8',
                  background: selected?.id === shot.id ? '#EDE5D8' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (selected?.id !== shot.id)
                    (e.currentTarget as HTMLElement).style.background = '#F5F0E8'
                }}
                onMouseLeave={e => {
                  if (selected?.id !== shot.id)
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <img
                  src={shot.url}
                  alt=""
                  className="rounded-md object-cover flex-shrink-0"
                  style={{ width: 56, height: 40, background: '#EDE5D8' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: '#8C7B6B' }}>{formatDate(shot.createdAt)}</p>
                  {shot.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {shot.tags.slice(0, 3).map(t => (
                        <span key={t.handTag.id} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#EDE5D8', color: '#5C4A32' }}>
                          #{t.handTag.tagText}
                        </span>
                      ))}
                      {shot.tags.length > 3 && (
                        <span className="text-xs" style={{ color: '#8C7B6B' }}>+{shot.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main — รูปที่เลือก */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            {/* รูปภาพ */}
            <div className="flex-1 flex items-center justify-center overflow-auto p-6" style={{ background: '#F5F0E8' }}>
              <img
                src={selected.url}
                alt=""
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}
              />
            </div>

            {/* Tag editor */}
            <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid #DDD5C8', background: '#FFFFFF' }}>

              {/* Meta + actions */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs" style={{ color: '#8C7B6B' }}>{formatDate(selected.createdAt)}</p>
                  {selected.user && (
                    <p className="text-xs" style={{ color: '#8C7B6B' }}>โดย {selected.user.displayName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ border: '1px solid #DDD5C8', color: '#2C2825', background: 'transparent' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#EDE5D8')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    เปิดรูป ↗
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(selected.url)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ border: '1px solid #DDD5C8', color: '#2C2825', background: 'transparent' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#EDE5D8')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    Copy URL
                  </button>
                </div>
              </div>

              {/* Topic chips — กดเลือก/ยกเลิก */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {allTags.map(tag => {
                    const isSelected = !!currentTags.find(t => t.tagText === tag.tagText)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => isSelected ? removeTag(tag.tagText) : addTag(tag.tagText)}
                        className="text-sm px-2.5 py-1 rounded-full transition-colors font-medium"
                        style={isSelected
                          ? { background: '#8B6F47', color: '#FAF8F5' }
                          : { background: '#EDE5D8', color: '#5C4A32' }
                        }
                      >
                        #{tag.tagText}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Custom tag input + save */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value.replace(/\s/g, ''))}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        addTag(tagInput)
                      }
                    }}
                    placeholder="หรือพิมพ์ tag เพิ่มเติม... (กด Enter)"
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{
                      border: '1px solid #DDD5C8',
                      background: '#FAF8F5',
                      color: '#2C2825',
                    }}
                    onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = '#8B6F47')}
                    onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = '#DDD5C8')}
                  />
                </div>
                <button
                  onClick={saveTags}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity disabled:opacity-50"
                  style={{ background: '#8B6F47', color: '#FAF8F5' }}
                >
                  {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
                </button>
              </div>

              {/* Selected custom tags (ที่ไม่ได้อยู่ใน topic library) */}
              {currentTags.filter(t => !allTags.find(a => a.tagText === t.tagText)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentTags.filter(t => !allTags.find(a => a.tagText === t.tagText)).map(tag => (
                    <span
                      key={tag.tagText}
                      className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full"
                      style={{ background: '#8B6F47', color: '#FAF8F5' }}
                    >
                      #{tag.tagText}
                      <button
                        onClick={() => removeTag(tag.tagText)}
                        className="leading-none ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: '#8C7B6B' }}>เลือกรูปจากด้านซ้าย</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CapturesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center" style={{ color: '#8C7B6B' }}>
        <p className="text-sm">กำลังโหลด...</p>
      </div>
    }>
      <CapturesContent />
    </Suspense>
  )
}
