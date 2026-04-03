import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const screenshot = await db.screenshot.findUnique({ where: { id } })
  if (!screenshot) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ลบจาก Supabase Storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase.storage.from('screenshots').remove([screenshot.storagePath])

  // ลบจาก database
  await db.screenshot.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
