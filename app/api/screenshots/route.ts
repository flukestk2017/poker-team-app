import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const screenshots = await db.screenshot.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(screenshots)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { url, storagePath, takenBy, note } = body

  if (!url || !storagePath) {
    return NextResponse.json({ error: 'url and storagePath required' }, { status: 400 })
  }

  const screenshot = await db.screenshot.create({
    data: { url, storagePath, takenBy: takenBy ?? null, note: note ?? null },
  })

  return NextResponse.json(screenshot, { status: 201 })
}
