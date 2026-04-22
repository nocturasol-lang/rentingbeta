import type { Metadata } from 'next'
import Link from 'next/link'
import { CosyNav } from '@/components/public/cosy/nav'
import { CosyFooter } from '@/components/public/cosy/footer'
import {
  Body,
  Display,
  Eyebrow,
  Label,
  Reveal,
  RevealText,
} from '@/components/public/cosy/primitives'

export const metadata: Metadata = {
  title: "Terms of Service — Georgia's Cozy Rooms",
}

const sections: Array<{ heading: string; body: React.ReactNode }> = [
  {
    heading: 'Booking and payment',
    body: (
      <>
        Bookings are confirmed the moment payment succeeds. All amounts are in euro and include
        the cleaning fee shown on the apartment page. Payment is handled by Stripe; we never see
        or store your card details.
      </>
    ),
  },
  {
    heading: 'Cancellation',
    body: (
      <>
        <strong>Flexible rate:</strong> full refund if you cancel up to 24 hours before arrival.
        After that, the first night is charged and the remainder refunded. You can cancel using
        your reference and email on the confirmation page. Refunds arrive via Stripe within
        5–10 business days.
      </>
    ),
  },
  {
    heading: 'Check-in and check-out',
    body: (
      <>
        Standard check-in is 14:00 and check-out 10:00. Times for each apartment appear on its
        page. Earlier check-in and later check-out are often possible — just ask, we live next
        door.
      </>
    ),
  },
  {
    heading: 'House rules',
    body: (
      <>
        Treat the apartment like your own. No smoking indoors. No parties or events. Pets only
        by prior arrangement. Damage beyond ordinary wear is charged to the guest at cost.
      </>
    ),
  },
  {
    heading: 'Liability',
    body: (
      <>
        Georgia&apos;s Cosy Rooms is not responsible for loss or damage to personal belongings
        during your stay. Travel insurance is recommended.
      </>
    ),
  },
  {
    heading: 'Governing law',
    body: (
      <>
        These terms are governed by Greek law. The property is operated under licence by
        Georgia Karasakalidi at 43 Kastamonis, Kavala 65404, Greece.
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <>
      <CosyNav bookHref="/#apartments" />

      <div style={{ padding: '60px 72px 40px', maxWidth: 820, margin: '0 auto' }}>
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Label>Home</Label>
            </Link>
            <span style={{ color: 'var(--cosy-ink-mute)', fontSize: 11 }}>/</span>
            <Label color="var(--cosy-ink)">Terms</Label>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <Eyebrow style={{ marginBottom: 14 }}>Last updated · April 2026</Eyebrow>
        </Reveal>
        <RevealText text="Terms of service" size={60} italic delay={120} style={{ marginBottom: 24 }} />
        <Reveal delay={500}>
          <Body size={15} color="var(--cosy-ink-soft)" style={{ lineHeight: 1.75, maxWidth: 620 }}>
            The plain version: book with a card, arrive when you said, leave the place how you
            found it, and we both have a good summer.
          </Body>
        </Reveal>
      </div>

      <div
        style={{
          padding: '0 72px 80px',
          maxWidth: 820,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        {sections.map((s, i) => (
          <Reveal key={s.heading} delay={i * 80}>
            <div
              style={{
                background: 'var(--cosy-paper)',
                borderRadius: 'var(--cosy-r3)',
                padding: '32px 36px',
                boxShadow: '0 2px 10px rgba(31,31,30,.04)',
              }}
            >
              <Display size={22} italic style={{ marginBottom: 12 }}>
                {s.heading}
              </Display>
              <Body size={14} color="var(--cosy-ink-soft)" style={{ lineHeight: 1.75 }}>
                {s.body}
              </Body>
            </div>
          </Reveal>
        ))}
        <Reveal delay={sections.length * 80}>
          <div
            style={{
              background: 'var(--cosy-ink)',
              color: 'var(--cosy-cream)',
              borderRadius: 'var(--cosy-r3)',
              padding: '36px 40px',
            }}
          >
            <Eyebrow style={{ color: 'var(--cosy-accent-soft)', marginBottom: 12 }}>
              Contact
            </Eyebrow>
            <Display size={28} italic color="var(--cosy-cream)" style={{ marginBottom: 14 }}>
              Questions about these terms?
            </Display>
            <Body size={14} color="rgba(251,243,232,0.75)" style={{ lineHeight: 1.75 }}>
              Write to{' '}
              <a
                href="mailto:georgia@georgiascosyrooms.gr"
                style={{ color: 'var(--cosy-cream)', textDecoration: 'underline' }}
              >
                georgia@georgiascosyrooms.gr
              </a>
              .
            </Body>
          </div>
        </Reveal>
      </div>

      <CosyFooter />
    </>
  )
}
