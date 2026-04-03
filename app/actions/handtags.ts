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
