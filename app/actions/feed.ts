"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createPost({
  userId,
  content,
}: {
  userId: string
  content: string
}) {
  await db.feedPost.create({
    data: { userId, content },
  })

  revalidatePath("/feed")
}

export async function addComment({
  postId,
  userId,
  content,
}: {
  postId: string
  userId: string
  content: string
}) {
  await db.feedComment.create({
    data: { postId, userId, content },
  })

  revalidatePath("/feed")
}
