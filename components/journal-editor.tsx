"use client"

import { useState, useTransition, useRef } from "react"
import { saveJournal } from "@/app/actions/journal"

interface JournalEditorProps {
  userId: string
  date: string
  initialSessionNote: string
  initialQuickJournal: string
}

export default function JournalEditor({
  userId,
  date,
  initialSessionNote,
  initialQuickJournal,
}: JournalEditorProps) {
  const [sessionNote, setSessionNote] = useState(initialSessionNote)
  const [quickJournal, setQuickJournal] = useState(initialQuickJournal)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSave(note: string, journal: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await saveJournal({ userId, date, sessionNote: note, quickJournal: journal })
        setSaved(true)
      })
    }, 1000)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Notes
        </label>
        <p className="text-xs text-gray-400 mb-3">บันทึกรายละเอียด session เล่น — stake, ระยะเวลา, ผลลัพธ์</p>
        <textarea
          className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
          rows={5}
          placeholder="เช่น NL50 zoom, 3 ชั่วโมง, +2.5 BI, เล่นดีในช่วงแรก..."
          value={sessionNote}
          onChange={(e) => {
            setSessionNote(e.target.value)
            scheduleSave(e.target.value, quickJournal)
          }}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Journal
        </label>
        <p className="text-xs text-gray-400 mb-3">ความคิด ความรู้สึก หรือ insight ที่ได้วันนี้</p>
        <textarea
          className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
          rows={5}
          placeholder="เช่น วันนี้รู้สึกว่า tilt ง่ายตอน downswing ต้องฝึก..."
          value={quickJournal}
          onChange={(e) => {
            setQuickJournal(e.target.value)
            scheduleSave(sessionNote, e.target.value)
          }}
        />
      </div>

      <div className="flex justify-end">
        <span className="text-xs text-gray-400">
          {isPending ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว" : ""}
        </span>
      </div>
    </div>
  )
}
