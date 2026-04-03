"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { addHandTag, deleteHandTag } from "@/app/actions/handtags"
import { supabase } from "@/lib/supabase"

interface HandTag {
  id: string
  tagText: string
  imageUrl?: string | null
  linkUrl?: string | null
  createdAt: Date
}

interface HandTagListProps {
  date: string
  initialTags: HandTag[]
}

export default function HandTagList({ date, initialTags }: HandTagListProps) {
  const [tags, setTags] = useState(initialTags)
  const [input, setInput] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxUrl(null)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [lightboxUrl])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileName = `${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from("handtag-images")
      .upload(fileName, file, { upsert: true })

    if (error) {
      console.error("Upload error:", error)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from("handtag-images")
      .getPublicUrl(fileName)

    setImageUrl(urlData.publicUrl)
    setUploading(false)
    // reset file input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return

    const optimistic: HandTag = {
      id: `temp-${Date.now()}`,
      tagText: trimmed,
      imageUrl: imageUrl.trim() || null,
      linkUrl: linkUrl.trim() || null,
      createdAt: new Date(),
    }
    setTags((prev) => [...prev, optimistic])
    setInput("")
    setImageUrl("")
    setLinkUrl("")

    startTransition(async () => {
      await addHandTag({
        date,
        tagText: trimmed,
        imageUrl: imageUrl.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
      })
    })
  }

  function handleDelete(id: string) {
    setTags((prev) => prev.filter((t) => t.id !== id))
    if (id.startsWith("temp-")) return
    startTransition(async () => {
      await deleteHandTag({ id })
    })
  }

  return (
    <>
    <div className="space-y-4">
      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <label className="block text-sm font-medium text-gray-700">เพิ่ม Hand Tag</label>

        <input
          className="w-full text-sm border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
          placeholder="เช่น BTN vs BB 3bet pot, missed value river..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          disabled={isPending}
        />

        {/* Image upload */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isPending}
              className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {uploading ? "กำลังอัพโหลด..." : "📎 อัพโหลดรูป"}
            </button>
            {imageUrl && !uploading && (
              <span className="text-xs text-green-600">✓ อัพโหลดแล้ว</span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <input
            className="w-full text-sm border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
            placeholder="หรือวาง Image URL โดยตรง (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={uploading || isPending}
          />

          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="rounded-lg max-h-40 object-contain border border-gray-100"
            />
          )}
        </div>

        <input
          className="w-full text-sm border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
          placeholder="Link URL (optional)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          disabled={isPending}
        />

        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={isPending || uploading || !input.trim()}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            เพิ่ม
          </button>
        </div>
      </div>

      {/* Tags list */}
      {tags.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">ยังไม่มี hand tag วันนี้</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {tags.map((tag) => (
            <div key={tag.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-400 text-xs font-mono shrink-0">#</span>
                  <span className="text-sm text-gray-700">{tag.tagText}</span>
                </div>
                <button
                  onClick={() => handleDelete(tag.id)}
                  disabled={isPending}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              {tag.imageUrl && (
                <img
                  src={tag.imageUrl}
                  alt={tag.tagText}
                  onClick={() => setLightboxUrl(tag.imageUrl!)}
                  className="mt-3 rounded-lg max-h-48 object-contain border border-gray-100 cursor-zoom-in"
                />
              )}

              {tag.linkUrl && (
                <a
                  href={tag.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-blue-500 hover:text-blue-700 underline break-all"
                >
                  {tag.linkUrl}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="lightbox"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-5 text-white text-3xl leading-none hover:text-gray-300 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
