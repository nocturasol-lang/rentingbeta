import Link from 'next/link'
import { CosyNav } from '@/components/public/cosy/nav'
import { CosyFooter } from '@/components/public/cosy/footer'
import {
  Body,
  Btn,
  Display,
  Eyebrow,
  Reveal,
  RevealText,
} from '@/components/public/cosy/primitives'

export default function RootNotFound() {
  return (
    <div className="cosy flex min-h-screen flex-col">
      <CosyNav bookHref="/#apartments" />

      <div
        style={{
          flex: 1,
          padding: '120px 72px 100px',
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <Reveal>
          <Eyebrow style={{ marginBottom: 20 }}>Error · 404</Eyebrow>
        </Reveal>
        <RevealText
          text="We couldn't find that page."
          size={56}
          italic
          delay={100}
          style={{ marginBottom: 22, lineHeight: 1.1 }}
        />
        <Reveal delay={500}>
          <Body
            size={15}
            color="var(--cosy-ink-soft)"
            style={{ maxWidth: 520, margin: '0 auto 36px' }}
          >
            It may have moved, or the link is wrong. Have a look at the apartments, or write if
            you&apos;re stuck.
          </Body>
        </Reveal>
        <Reveal delay={650}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Btn variant="primary">Back to the house</Btn>
            </Link>
            <a href="mailto:georgia@georgiascosyrooms.gr" style={{ textDecoration: 'none' }}>
              <Btn variant="ghost">Write to Georgia</Btn>
            </a>
          </div>
        </Reveal>

        <Reveal delay={800}>
          <div style={{ marginTop: 72 }}>
            <Display size={20} italic color="var(--cosy-ink-mute)">
              Or one of the apartments:
            </Display>
            <div
              style={{
                display: 'flex',
                gap: 20,
                justifyContent: 'center',
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <Link
                  key={n}
                  href={`/properties/georgias-cozy-rooms-${n}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Body size={13} color="var(--cosy-ink)" weight={500}>
                    No. {String(n).padStart(2, '0')} ·{' '}
                    <span
                      className="cosy-display"
                      style={{ fontStyle: 'italic', fontSize: 18 }}
                    >
                      Cosy Rooms #{n}
                    </span>
                  </Body>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <CosyFooter />
    </div>
  )
}
