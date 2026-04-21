import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: "Sign in · Georgia's Cozy Rooms",
  robots: 'noindex, nofollow',
}

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect('/admin/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Georgia&apos;s Cozy Rooms</h1>
          <p className="text-sm text-muted-foreground">Sign in to your admin dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
