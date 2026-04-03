import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import JournalEditor from "@/components/journal-editor"

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

export default async function JournalPage() {
  const session = await auth()
  const today = getTodayDate()

  const entry = await db.journalEntry.findUnique({
    where: { userId_date: { userId: session!.user.id, date: today } },
  })

  const dateLabel = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400">{dateLabel}</p>
        <h1 className="text-xl font-semibold text-gray-900 mt-0.5">Journal</h1>
      </div>

      <JournalEditor
        userId={session!.user.id}
        date={today}
        initialSessionNote={entry?.sessionNote ?? ""}
        initialQuickJournal={entry?.quickJournal ?? ""}
      />
    </div>
  )
}
