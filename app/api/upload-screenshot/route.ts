import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const id = nanoid(10)
    const filePath = `${id}.png`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage
      .from('screenshots')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath)
    return NextResponse.json({ id, url: data.publicUrl, path: filePath })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
