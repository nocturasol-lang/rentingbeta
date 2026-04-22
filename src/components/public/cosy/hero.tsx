'use client'

import { CosyNav } from './nav'
import { Body, Btn, Chip, Photo, Reveal, RevealText } from './primitives'

export function CosyHero({ heroImageUrl }: { heroImageUrl?: string | null }) {
  return (
    <div style={{ position: 'relative', height: 720, overflow: 'hidden' }}>
      <Photo
        tone="dusk"
        src={heroImageUrl ?? null}
        alt="Georgia's Cosy Rooms — Kavala"
        fill
        radius={0}
        sizes="100vw"
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(31,31,30,0.35) 0%, rgba(31,31,30,0.15) 40%, rgba(31,31,30,0.75) 100%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <CosyNav inverted />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 72px 72px',
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <Reveal delay={100}>
              <Chip
                tone="cream"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--cosy-accent)',
                  }}
                />
                Kavala · Greece · Est. 2018
              </Chip>
            </Reveal>
            <RevealText
              text="Four quiet apartments"
              size={84}
              italic
              color="#fff"
              delay={150}
              style={{ marginBottom: 8 }}
            />
            <RevealText
              text="by the Aegean."
              size={84}
              italic
              color="#fff"
              delay={280}
              style={{ marginBottom: 30 }}
            />
            <Reveal delay={900}>
              <Body
                size={16}
                color="rgba(255,255,255,0.88)"
                style={{ maxWidth: 520, marginBottom: 36 }}
              >
                Family-run rooms in a quiet corner of Kavala, a short walk from Kalamitsa Beach.
                Booked only through this page — as they have been since 2018.
              </Body>
            </Reveal>
            <Reveal delay={1050}>
              <div style={{ display: 'flex', gap: 14 }}>
                <Btn
                  variant="primary"
                  onClick={() => {
                    document
                      .getElementById('apartments')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  See the apartments
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M3 6h6M6 3l3 3-3 3" />
                  </svg>
                </Btn>
                <Btn
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    backdropFilter: 'blur(8px)',
                  }}
                  onClick={() => {
                    window.location.href = 'mailto:georgia@georgiascosyrooms.gr'
                  }}
                >
                  A note from Georgia
                </Btn>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
