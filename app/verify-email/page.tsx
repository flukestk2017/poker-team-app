import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) redirect('/login')

  const user = await db.user.findUnique({
    where: { verifyToken: token },
  })

  if (!user || !user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
    redirect('/login?error=token-expired')
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      isActive: true,
      emailVerified: new Date(),
      verifyToken: null,
      verifyTokenExpiry: null,
    },
  })

  redirect('/login?verified=true')
}
