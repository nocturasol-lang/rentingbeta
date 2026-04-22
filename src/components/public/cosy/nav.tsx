'use client'

import Link from 'next/link'
import { Btn } from './primitives'

type NavProps = {
  inverted?: boolean
  bookHref?: string
}

const links: Array<{ label: string; href: string }> = [
  { label: 'Apartments', href: '/properties' },
  { label: 'The House', href: '/#whole-house' },
  { label: 'Kavala', href: '/#kavala' },
  { label: 'Contact', href: 'mailto:georgia@georgiascosyrooms.gr' },
]

export function CosyNav({ inverted = false, bookHref = '/#apartments' }: NavProps) {
  const color = inverted ? '#fff' : 'var(--cosy-ink)'
  const mute = inverted ? 'rgba(255,255,255,0.7)' : 'var(--cosy-ink-mute)'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 72px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <Link href="/" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
        <span
          className="cosy-sans"
          style={{
            fontSize: 10,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: mute,
            fontWeight: 600,
          }}
        >
          Est. 2018
        </span>
        <span
          className="cosy-display"
          style={{ fontSize: 22, color, letterSpacing: 0.2, fontStyle: 'italic', fontWeight: 500 }}
        >
          Georgia&apos;s Cosy Rooms
        </span>
      </Link>
      <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="cosy-sans"
            style={{
              fontSize: 12,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              fontWeight: 500,
              color,
              textDecoration: 'none',
            }}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href={bookHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            padding: '10px 18px',
            borderRadius: 'var(--cosy-r-full)',
            background: inverted ? '#fff' : 'var(--cosy-ink)',
            color: inverted ? 'var(--cosy-ink)' : '#fff',
            textDecoration: 'none',
            transition: 'transform 180ms cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          Book direct
        </Link>
      </div>
    </div>
  )
}
