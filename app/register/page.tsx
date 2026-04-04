'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Password ไม่ตรงกัน')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setSuccess(data.message)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
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
          <h1 className="text-xl font-semibold" style={{ color: '#2C2825' }}>สมัครสมาชิก</h1>
          <p className="mt-1 text-sm" style={{ color: '#8C7B6B' }}>DEKpocarr</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #DDD5C8' }}
        >
          {success ? (
            <div
              className="p-4 rounded-lg text-sm"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}
            >
              {success}
              <br />
              <Link href="/login" className="underline mt-2 inline-block font-medium">
                กลับไปหน้า Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
                >
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#2C2825' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
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
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="กรอก email"
                  required
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
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
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
                  ยืนยัน Password
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="กรอก password อีกครั้ง"
                  required
                  className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all"
                  style={{
                    border: '1px solid #DDD5C8',
                    background: '#FAF8F5',
                    color: '#2C2825',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#8B6F47', color: '#FAF8F5' }}
              >
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>

              <p className="text-center text-sm" style={{ color: '#8C7B6B' }}>
                มีบัญชีแล้ว?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: '#8B6F47' }}>
                  Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
