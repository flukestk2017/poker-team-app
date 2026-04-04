import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'

export default async function CapturesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FAF8F5' }}>
      <Sidebar user={session.user} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
