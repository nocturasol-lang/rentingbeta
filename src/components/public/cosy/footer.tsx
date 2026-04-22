'use client'

import { Body, Display, Eyebrow, Label, Reveal } from './primitives'

const columns: Array<{ heading: string; items: string[] }> = [
  {
    heading: 'Apartments',
    items: ['Cosy Rooms #1', 'Cosy Rooms #2', 'Cosy Rooms #3', 'Cosy Rooms #4', 'The Whole House'],
  },
  {
    heading: 'About',
    items: ['The House', 'Kavala', 'Things to do', 'Guidebook'],
  },
  {
    heading: 'Contact',
    items: [
      'georgia@georgiascosyrooms.gr',
      '+30 697 331 4237',
      'Instagram',
      'Licensed rentals',
    ],
  },
]

export function CosyFooter() {
  return (
    <div
      style={{
        background: 'var(--cosy-ink)',
        color: 'var(--cosy-cream)',
        padding: '80px 72px 48px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 56,
          marginBottom: 56,
        }}
      >
        <Reveal>
          <Display size={36} italic color="var(--cosy-cream)" style={{ marginBottom: 14 }}>
            Georgia&apos;s Cosy Rooms
          </Display>
          <Body size={13} color="rgba(238,238,233,0.7)" style={{ maxWidth: 320 }}>
            43 Kastamonis · Kavala · Greece. Arrivals from 14:00, departures by 10:00. Booked
            directly since 2018.
          </Body>
        </Reveal>
        {columns.map((c, i) => (
          <Reveal key={c.heading} delay={i * 80}>
            <Eyebrow style={{ marginBottom: 18, color: 'rgba(184,184,179,0.8)' }}>
              {c.heading}
            </Eyebrow>
            {c.items.map((item) => (
              <Body
                key={item}
                size={12}
                color="rgba(238,238,233,0.7)"
                style={{ marginBottom: 10 }}
              >
                {item}
              </Body>
            ))}
          </Reveal>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 24,
          borderTop: '1px solid rgba(238,238,233,0.12)',
        }}
      >
        <Label color="rgba(238,238,233,0.5)">
          © {new Date().getFullYear()} Georgia&apos;s Cosy Rooms
        </Label>
        <Label color="rgba(238,238,233,0.5)">Made in Kavala</Label>
      </div>
    </div>
  )
}
