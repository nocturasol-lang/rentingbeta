import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: "Sign in · Georgia's Cosy Rooms",
  robots: 'noindex, nofollow',
}

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/admin/dashboard')
  }

  return (
    <div
      className="cosy"
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--cosy-paper)',
          borderRadius: 'var(--cosy-r3)',
          padding: '40px 40px 32px',
          boxShadow: '0 12px 40px -16px rgba(31,31,30,.18)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            className="cosy-sans"
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              color: 'var(--cosy-accent)',
              marginBottom: 8,
            }}
          >
            Admin · Est. 2018
          </div>
          <h1
            className="cosy-display"
            style={{
              fontStyle: 'italic',
              fontSize: 30,
              color: 'var(--cosy-ink)',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Georgia&apos;s Cosy Rooms
          </h1>
          <div
            className="cosy-sans"
            style={{
              fontSize: 12,
              color: 'var(--cosy-ink-mute)',
              marginTop: 10,
            }}
          >
            Sign in to the dashboard.
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
