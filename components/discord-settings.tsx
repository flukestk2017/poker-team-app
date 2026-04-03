"use client"

import { useState, useTransition } from "react"
import { saveDiscordSettings } from "@/app/actions/settings"

interface DiscordSettingsProps {
  initialWebhook: string | null
  initialHours: number
}

export default function DiscordSettings({ initialWebhook, initialHours }: DiscordSettingsProps) {
  const [webhook, setWebhook] = useState(initialWebhook ?? "")
  const [hours, setHours] = useState(initialHours)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaved(false)
    startTransition(async () => {
      await saveDiscordSettings({ discordWebhook: webhook, notifyHoursBefore: hours })
      setSaved(true)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Discord Notifications</h2>
        <p className="text-xs text-gray-400 mt-0.5">แจ้งเตือน deadline ผ่าน Discord Webhook ส่วนตัว</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Discord Webhook URL</label>
          <input
            type="text"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full text-sm border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">แจ้งเตือนก่อน deadline กี่ชั่วโมง</label>
          <input
            type="number"
            min={1}
            max={48}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-24 text-sm border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <span className="ml-2 text-xs text-gray-400">ชั่วโมง</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          บันทึก
        </button>
        {saved && <span className="text-xs text-green-600">บันทึกแล้ว ✓</span>}
      </div>
    </div>
  )
}
