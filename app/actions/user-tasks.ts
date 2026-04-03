"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DAILY_TASKS } from "@/lib/constants"
import { revalidatePath } from "next/cache"

export async function ensureUserTasks(userId: string) {
  const count = await db.userTask.count({ where: { userId } })
  if (count === 0) {
    await db.userTask.createMany({
      data: DAILY_TASKS.map((t, i) => ({
        userId,
        taskKey: t.key,
        label: t.label,
        sortOrder: i,
      })),
    })
  }
}

export async function getUserTasks() {
  const session = await auth()
  const userId = session!.user.id
  await ensureUserTasks(userId)
  return db.userTask.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } })
}

export async function addUserTask({ label }: { label: string }) {
  const session = await auth()
  const userId = session!.user.id
  await ensureUserTasks(userId)

  const count = await db.userTask.count({ where: { userId } })
  await db.userTask.create({
    data: { userId, taskKey: `custom_${Date.now()}`, label, sortOrder: count },
  })

  revalidatePath("/tasks")
}

export async function updateUserTask({ taskKey, label }: { taskKey: string; label: string }) {
  const session = await auth()
  const userId = session!.user.id

  await db.userTask.update({
    where: { userId_taskKey: { userId, taskKey } },
    data: { label },
  })

  revalidatePath("/tasks")
}

export async function deleteUserTask({ taskKey }: { taskKey: string }) {
  const session = await auth()
  const userId = session!.user.id

  await db.userTask.delete({ where: { userId_taskKey: { userId, taskKey } } })
  revalidatePath("/tasks")
}
