"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getDiscordSettings() {
  const session = await auth()
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: { discordWebhook: true, notifyHoursBefore: true },
  })
  return user
}

export async function saveDiscordSettings({
  discordWebhook,
  notifyHoursBefore,
}: {
  discordWebhook: string
  notifyHoursBefore: number
}) {
  const session = await auth()
  await db.user.update({
    where: { id: session!.user.id },
    data: {
      discordWebhook: discordWebhook.trim() || null,
      notifyHoursBefore: Math.max(1, notifyHoursBefore),
    },
  })
  revalidatePath("/settings")
}
