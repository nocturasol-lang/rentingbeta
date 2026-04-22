'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--cosy-r2)',
  border: '1px solid var(--cosy-line)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--cosy-ink)',
  outline: 'none',
  background: 'var(--cosy-paper)',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: 1.6,
  textTransform: 'uppercase',
  color: 'var(--cosy-ink-mute)',
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label htmlFor="email" style={labelStyle}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="admin@georgiascosyrooms.gr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="password" style={labelStyle}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={inputStyle}
        />
      </div>
      {error && (
        <div
          className="cosy-sans"
          style={{
            fontSize: 12,
            color: '#9b2c2c',
            background: '#fbeaea',
            padding: '10px 14px',
            borderRadius: 'var(--cosy-r1)',
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 'var(--cosy-r-full)',
          background: 'var(--cosy-ink)',
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginTop: 6,
          transition: 'opacity 160ms',
        }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
