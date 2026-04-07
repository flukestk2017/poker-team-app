"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const verified = searchParams.get("verified") === "true"
  const tokenError = searchParams.get("error")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      if (result.error.includes("ยืนยัน email")) {
        setError("กรุณายืนยัน email ก่อน login")
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง")
      }
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
            style={{ background: '#8B6F47' }}
          >
            <span className="text-sm font-bold" style={{ color: '#FAF8F5' }}>DK</span>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: '#2C2825' }}>DEKpocarr</h1>
          <p className="mt-1 text-sm" style={{ color: '#8C7B6B' }}>Poker Team Management</p>
        </div>

        {/* Messages */}
        {verified && (
          <div
            className="mb-4 p-3 rounded-lg text-sm text-center"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}
          >
            ยืนยัน email สำเร็จ! สามารถ login ได้เลย
          </div>
        )}
        {tokenError === 'token-expired' && (
          <div
            className="mb-4 p-3 rounded-lg text-sm text-center"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
          >
            Link ยืนยันหมดอายุแล้ว กรุณาสมัครใหม่
          </div>
        )}
        {tokenError === 'invalid-token' && (
          <div
            className="mb-4 p-3 rounded-lg text-sm text-center"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
          >
            Link ไม่ถูกต้อง
          </div>
        )}

        {/* Form */}
        <div
          className="rounded-2xl p-8 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #DDD5C8' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#2C2825' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอก username"
                required
                autoFocus
                className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: '1px solid #DDD5C8',
                  background: '#FAF8F5',
                  color: '#2C2825',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#2C2825' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: '1px solid #DDD5C8',
                  background: '#FAF8F5',
                  color: '#2C2825',
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-center" style={{ color: '#B91C1C' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#8B6F47', color: '#FAF8F5' }}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            {/* REGISTRATION DISABLED — re-enable by uncommenting below
            <p className="text-center text-sm" style={{ color: '#8C7B6B' }}>
              ยังไม่มีบัญชี?{' '}
              <Link href="/register" className="font-medium hover:underline" style={{ color: '#8B6F47' }}>
                สมัครสมาชิก
              </Link>
            </p>
            */}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#FAF8F5' }} />}>
      <LoginForm />
    </Suspense>
  )
}
