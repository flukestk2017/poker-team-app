import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }

    const existingUsername = await db.user.findUnique({ where: { username } })
    if (existingUsername) {
      return NextResponse.json({ error: 'Username นี้ถูกใช้แล้ว' }, { status: 400 })
    }

    const existingEmail = await db.user.findFirst({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Email นี้ถูกใช้แล้ว' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        displayName: username,
        pin: '',
        role: 'member',
        isActive: false,
        verifyToken,
        verifyTokenExpiry,
      },
    })

    await sendVerificationEmail(email, username, verifyToken)

    return NextResponse.json({
      success: true,
      message: 'สมัครสำเร็จ! กรุณาตรวจสอบ email เพื่อยืนยันบัญชี',
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 })
  }
}
