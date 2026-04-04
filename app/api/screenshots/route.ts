import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = session.user.role === 'admin'

  const screenshots = await db.screenshot.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { username: true, displayName: true } },
      tags: { include: { handTag: true } },
    },
  })

  return NextResponse.json(screenshots)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const body = await req.json()
  const { url, storagePath, takenBy, note } = body

  if (!url || !storagePath) {
    return NextResponse.json({ error: 'url and storagePath required' }, { status: 400 })
  }

  const screenshot = await db.screenshot.create({
    data: {
      url,
      storagePath,
      takenBy: session?.user?.username || takenBy || 'desktop-app',
      userId: session?.user?.id || null,
      note: note ?? null,
    },
  })

  return NextResponse.json(screenshot, { status: 201 })
}
