"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function addHandTag({
  date,
  tagText,
  imageUrl,
  linkUrl,
}: {
  date: string
  tagText: string
  imageUrl?: string
  linkUrl?: string
}) {
  const session = await auth()
  const userId = session!.user.id

  await db.handTag.create({
    data: { userId, date, tagText, imageUrl: imageUrl || null, linkUrl: linkUrl || null },
  })

  revalidatePath("/handtags")
}

export async function deleteHandTag({ id }: { id: string }) {
  await db.handTag.delete({ where: { id } })
  revalidatePath("/handtags")
}

// Topics คือ HandTag ที่มี date = '_topics_' — reusable tag library
export async function addTopic({ tagText }: { tagText: string }) {
  const session = await auth()
  const userId = session!.user.id
  const clean = tagText.replace(/^#/, '').trim().toLowerCase()
  if (!clean) return

  // ป้องกัน duplicate
  const existing = await db.handTag.findFirst({
    where: { userId, date: '_topics_', tagText: { equals: clean, mode: 'insensitive' } },
  })
  if (existing) return

  await db.handTag.create({
    data: { userId, date: '_topics_', tagText: clean },
  })

  revalidatePath("/handtags")
}

export async function deleteTopic({ id }: { id: string }) {
  await db.handTag.delete({ where: { id } })
  revalidatePath("/handtags")
}
