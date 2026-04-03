"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureUserTasks } from "@/app/actions/user-tasks"
import { revalidatePath } from "next/cache"

export async function toggleTask({ date, taskKey }: { date: string; taskKey: string }) {
  const session = await auth()
  const userId = session!.user.id

  const existing = await db.dailyTask.findUnique({
    where: { userId_date_taskKey: { userId, date, taskKey } },
  })

  if (existing) {
    await db.dailyTask.update({
      where: { userId_date_taskKey: { userId, date, taskKey } },
      data: { completed: !existing.completed },
    })
  } else {
    await db.dailyTask.create({
      data: { userId, date, taskKey, completed: true },
    })
  }

  revalidatePath("/tasks")
}

export async function setTaskDeadline({
  date,
  taskKey,
  deadline,
  notifyHoursBefore,
}: {
  date: string
  taskKey: string
  deadline: string | null
  notifyHoursBefore?: number | null
}) {
  const session = await auth()
  const userId = session!.user.id

  const data = {
    deadline: deadline ? new Date(deadline) : null,
    ...(notifyHoursBefore !== undefined && { notifyHoursBefore: notifyHoursBefore }),
  }

  await db.dailyTask.upsert({
    where: { userId_date_taskKey: { userId, date, taskKey } },
    update: data,
    create: { userId, date, taskKey, completed: false, ...data },
  })

  revalidatePath("/tasks")
}

export async function getMonthTasks({ year, month }: { year: number; month: number }) {
  const session = await auth()
  const userId = session!.user.id

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const [completedTasks, total] = await Promise.all([
    db.dailyTask.findMany({
      where: { userId, date: { gte: startDate, lte: endDate }, completed: true },
    }),
    db.userTask.count({ where: { userId } }),
  ])

  const taskTotal = total > 0 ? total : 5

  const byDate: Record<string, { completed: number; total: number }> = {}
  completedTasks.forEach((t) => {
    if (!byDate[t.date]) byDate[t.date] = { completed: 0, total: taskTotal }
    byDate[t.date].completed++
  })

  return { byDate, total: taskTotal }
}

export async function getDayTasks({ date }: { date: string }) {
  const session = await auth()
  const userId = session!.user.id

  await ensureUserTasks(userId)

  const [userTasks, records] = await Promise.all([
    db.userTask.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    db.dailyTask.findMany({ where: { userId, date } }),
  ])

  const taskMap = new Map(records.map((t) => [t.taskKey, t]))

  return userTasks.map((task) => ({
    key: task.taskKey,
    label: task.label,
    completed: taskMap.get(task.taskKey)?.completed ?? false,
    deadline: taskMap.get(task.taskKey)?.deadline?.toISOString() ?? null,
    notifyHoursBefore: taskMap.get(task.taskKey)?.notifyHoursBefore ?? null,
  }))
}
