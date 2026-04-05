import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอก username และ password' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'username หรือ password ไม่ถูกต้อง' }, { status: 401 })
    }

    let isValid = false
    if (user.password) {
      isValid = await bcrypt.compare(String(password), user.password)
    } else if (user.pin) {
      isValid = String(user.pin) === String(password)
    }

    if (!isValid) {
      return NextResponse.json({ error: 'username หรือ password ไม่ถูกต้อง' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'กรุณายืนยัน email ก่อนใช้งาน' }, { status: 403 })
    }

    const snipToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year

    await db.user.update({
      where: { id: user.id },
      data: {
        snipToken,
        snipTokenExpiry: tokenExpiry,
      },
    })

    return NextResponse.json({
      token: snipToken,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    })
  } catch (error) {
    console.error('Snip token error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
