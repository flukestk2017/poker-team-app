import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

// Returns the user's topic library (date = '_topics_')
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const topics = await db.handTag.findMany({
    where: { userId: session.user.id, date: '_topics_' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, tagText: true },
  })

  return NextResponse.json(topics)
}
