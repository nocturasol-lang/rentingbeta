'use client'

import { Body, Btn, Chip, Display, Eyebrow, Label, Photo, Reveal } from './primitives'

export function WholeHouseBlock() {
  return (
    <Reveal delay={200} dy={40}>
      <div
        id="whole-house"
        style={{
          marginTop: 32,
          background: 'var(--cosy-ink)',
          color: 'var(--cosy-cream)',
          borderRadius: 'var(--cosy-r3)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          minHeight: 380,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Photo label="whole house · courtyard" tone="warm" fill radius={0} />
          <Chip
            tone="cream"
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(6px)',
              border: 'none',
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
            All four · book together
          </Chip>
        </div>
        <div
          style={{
            padding: '56px 56px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Eyebrow style={{ marginBottom: 14, color: 'var(--cosy-accent-soft)' }}>
            For larger groups
          </Eyebrow>
          <Display
            size={44}
            italic
            color="var(--cosy-cream)"
            style={{ lineHeight: 1.1, marginBottom: 18 }}
          >
            Or take the
            <br />
            whole house.
          </Display>
          <Body
            size={14}
            color="rgba(251,243,232,0.75)"
            style={{ maxWidth: 360, marginBottom: 30, lineHeight: 1.65 }}
          >
            All four apartments, booked as one — seven bedrooms, two kitchens, the garden and
            BBQ. Weddings, family reunions, friends in from abroad.
          </Body>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
              paddingTop: 24,
              borderTop: '1px solid rgba(251,243,232,0.15)',
              marginBottom: 28,
            }}
          >
            {[
              ['Guests', '15'],
              ['Bedrooms', '7'],
              ['Living area', '232 m²'],
            ].map(([k, v]) => (
              <div key={k}>
                <Label color="rgba(251,243,232,0.5)" style={{ marginBottom: 4 }}>
                  {k}
                </Label>
                <Display size={24} italic color="var(--cosy-cream)">
                  {v}
                </Display>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Btn
              style={{
                background: 'var(--cosy-cream)',
                color: 'var(--cosy-ink)',
              }}
              onClick={() => {
                window.location.href =
                  'mailto:georgia@georgiascosyrooms.gr?subject=Whole%20house%20enquiry'
              }}
            >
              Enquire about the house
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
            <div>
              <Body size={11} color="rgba(251,243,232,0.55)">
                From
              </Body>
              <Display size={22} italic color="var(--cosy-cream)">
                €295 / night
              </Display>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
