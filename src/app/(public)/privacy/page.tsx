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
  title: "Privacy Policy — Georgia's Cosy Rooms",
}

const sections: Array<{ heading: string; body: React.ReactNode }> = [
  {
    heading: 'What data we collect',
    body: (
      <>
        When you make a booking, we collect your name, email address, phone number, guest count,
        and the identification details the Greek tourism registry requires (ID type, ID number,
        nationality, date of birth, country of residence). Payment information is processed
        directly by Stripe — card numbers never touch our servers.
      </>
    ),
  },
  {
    heading: 'How we use your data',
    body: (
      <>
        Your information is used only to confirm your booking, communicate with you about your
        stay, and fulfil the legal obligation to register guests with the Greek authorities. We
        do not sell or share your data with third parties for marketing.
      </>
    ),
  },
  {
    heading: 'Data retention',
    body: (
      <>
        Booking records are retained for the period required by Greek accounting and tax
        legislation. Identification details submitted to the tourism registry are removed from
        our systems shortly after your stay ends. You may request earlier deletion of personal
        data at any time.
      </>
    ),
  },
  {
    heading: 'Your rights (GDPR)',
    body: (
      <>
        Under the General Data Protection Regulation you have the right to access, correct,
        export, or delete your personal data, and to withdraw consent at any time. Send any
        request to the address below and we will respond within 30 days.
      </>
    ),
  },
  {
    heading: 'Cookies',
    body: (
      <>
        We use essential cookies to keep you signed in during a booking. No tracking or
        advertising cookies are used. No third-party analytics run on these pages.
      </>
    ),
  },
]

export default function PrivacyPage() {
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
            <Label color="var(--cosy-ink)">Privacy</Label>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <Eyebrow style={{ marginBottom: 14 }}>Last updated · April 2026</Eyebrow>
        </Reveal>
        <RevealText text="Privacy policy" size={60} italic delay={120} style={{ marginBottom: 24 }} />
        <Reveal delay={500}>
          <Body size={15} color="var(--cosy-ink-soft)" style={{ lineHeight: 1.75, maxWidth: 620 }}>
            We keep as little as we can, for as long as the law requires us to, and never share
            what we do keep. This page explains in detail.
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
            <Eyebrow style={{ color: 'var(--cosy-accent-soft)', marginBottom: 12 }}>Contact</Eyebrow>
            <Display size={28} italic color="var(--cosy-cream)" style={{ marginBottom: 14 }}>
              Questions about your data?
            </Display>
            <Body size={14} color="rgba(251,243,232,0.75)" style={{ lineHeight: 1.75 }}>
              Write to{' '}
              <a
                href="mailto:georgia@georgiascosyrooms.gr"
                style={{ color: 'var(--cosy-cream)', textDecoration: 'underline' }}
              >
                georgia@georgiascosyrooms.gr
              </a>{' '}
              and we&apos;ll reply within 30 days.
            </Body>
          </div>
        </Reveal>
      </div>

      <CosyFooter />
    </>
  )
}
