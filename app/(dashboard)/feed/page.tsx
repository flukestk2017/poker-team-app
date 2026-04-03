import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import FeedBoard from "@/components/feed-board"

export default async function FeedPage() {
  const session = await auth()

  const posts = await db.feedPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { displayName: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { displayName: true } } },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Team Feed</h1>
        <p className="text-sm text-gray-400 mt-0.5">แชร์ความคืบหน้ากับทีม</p>
      </div>

      <FeedBoard userId={session!.user.id} initialPosts={posts} />
    </div>
  )
}
