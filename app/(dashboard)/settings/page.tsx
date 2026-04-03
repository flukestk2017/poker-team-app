import { getDiscordSettings } from "@/app/actions/settings"
import DiscordSettings from "@/components/discord-settings"

export default async function SettingsPage() {
  const settings = await getDiscordSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">ตั้งค่าการแจ้งเตือนและการใช้งาน</p>
      </div>

      <DiscordSettings
        initialWebhook={settings?.discordWebhook ?? null}
        initialHours={settings?.notifyHoursBefore ?? 1}
      />
    </div>
  )
}
