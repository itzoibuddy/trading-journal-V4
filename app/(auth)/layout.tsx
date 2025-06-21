'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/')
    }
  }, [status, session, router])

  // Don't show loading spinner, just render children
  // The individual auth pages will handle their own loading states
  if (status === 'authenticated') {
    return null
  }

  return <div className="min-h-screen">{children}</div>
} 