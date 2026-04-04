import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tags = await db.screenshotTag.findMany({
    where: { screenshotId: id },
    include: { handTag: true },
  })
  return NextResponse.json(tags.map(t => t.handTag))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { tagTexts } = await req.json() // array of tag text strings

  // Remove all existing tags for this screenshot
  await db.screenshotTag.deleteMany({ where: { screenshotId: id } })

  if (!tagTexts || tagTexts.length === 0) {
    return NextResponse.json({ success: true })
  }

  const today = new Date().toISOString().split('T')[0]

  for (const text of tagTexts) {
    const cleanText = text.replace(/^#/, '').trim().toLowerCase()
    if (!cleanText) continue

    // Find existing topic HandTag first, then any HandTag with matching text
    let handTag = await db.handTag.findFirst({
      where: {
        userId: session.user.id,
        tagText: { equals: cleanText, mode: 'insensitive' },
        date: '_topics_',
      },
    }) ?? await db.handTag.findFirst({
      where: {
        userId: session.user.id,
        tagText: { equals: cleanText, mode: 'insensitive' },
      },
    })

    if (!handTag) {
      // สร้าง topic ใหม่ถ้ายังไม่มี
      handTag = await db.handTag.create({
        data: {
          userId: session.user.id,
          tagText: cleanText,
          date: '_topics_',
        },
      })
    }

    await db.screenshotTag.upsert({
      where: {
        screenshotId_handTagId: {
          screenshotId: id,
          handTagId: handTag.id,
        },
      },
      update: {},
      create: {
        screenshotId: id,
        handTagId: handTag.id,
      },
    })
  }

  return NextResponse.json({ success: true })
}
