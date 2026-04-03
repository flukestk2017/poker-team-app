"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveJournal({
  userId,
  date,
  sessionNote,
  quickJournal,
}: {
  userId: string
  date: string
  sessionNote: string
  quickJournal: string
}) {
  await db.journalEntry.upsert({
    where: { userId_date: { userId, date } },
    update: { sessionNote, quickJournal },
    create: { userId, date, sessionNote, quickJournal },
  })

  revalidatePath("/journal")
}
