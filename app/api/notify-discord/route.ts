import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const now = new Date()
  const MAX_WINDOW_MS = 24 * 3600000

  const tasks = await db.dailyTask.findMany({
    where: {
      completed: false,
      deadline: { gte: now, lte: new Date(now.getTime() + MAX_WINDOW_MS) },
    },
    include: {
      user: { select: { displayName: true, discordWebhook: true, notifyHoursBefore: true } },
    },
  })

  // Group tasks by webhook URL, filtered by each task/user's notify window
  const byWebhook: Record<string, typeof tasks> = {}

  for (const task of tasks) {
    const hours = task.notifyHoursBefore ?? task.user.notifyHoursBefore
    const cutoff = new Date(now.getTime() + hours * 3600000)
    if (new Date(task.deadline!) > cutoff) continue

    const webhook = task.user.discordWebhook || process.env.DISCORD_WEBHOOK_URL
    if (!webhook) continue

    if (!byWebhook[webhook]) byWebhook[webhook] = []
    byWebhook[webhook].push(task)
  }

  if (Object.keys(byWebhook).length === 0) {
    return NextResponse.json({ sent: false, message: "No upcoming deadlines" })
  }

  let totalSent = 0

  for (const [webhook, webhookTasks] of Object.entries(byWebhook)) {
    const lines = webhookTasks.map((t) => {
      const minutesLeft = Math.round((new Date(t.deadline!).getTime() - now.getTime()) / 60000)
      return `⏰ **${t.user.displayName}** — \`${t.taskKey}\` ครบกำหนดใน **${minutesLeft} นาที**`
    })

    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🃏 **Poker Team — Task Deadlines**\n${lines.join("\n")}`,
      }),
    })

    totalSent += webhookTasks.length
  }

  return NextResponse.json({ sent: true, count: totalSent })
}
