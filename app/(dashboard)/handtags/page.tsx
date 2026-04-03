import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import HandTagList from "@/components/hand-tag-list"

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

export default async function HandTagsPage() {
  const session = await auth()
  const today = getTodayDate()

  const tags = await db.handTag.findMany({
    where: { userId: session!.user.id, date: today },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      tagText: true,
      imageUrl: true,
      linkUrl: true,
      createdAt: true,
    },
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
        <h1 className="text-xl font-semibold text-gray-900 mt-0.5">Hand Tags</h1>
      </div>

      <HandTagList
        date={today}
        initialTags={tags}
      />
    </div>
  )
}
