'use client'

import * as React from 'react'
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

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[public-error]', error)
  }, [error])

  return (
    <>
      <CosyNav bookHref="/#apartments" />

      <div
        style={{
          padding: '120px 72px 100px',
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <Reveal>
          <Eyebrow style={{ marginBottom: 20 }}>Something went wrong</Eyebrow>
        </Reveal>
        <RevealText
          text="Sorry — we hit a snag."
          size={56}
          italic
          delay={100}
          style={{ marginBottom: 22, lineHeight: 1.1 }}
        />
        <Reveal delay={500}>
          <Body size={15} color="var(--cosy-ink-soft)" style={{ maxWidth: 520, margin: '0 auto 36px' }}>
            The page didn&apos;t load as expected. Try again, and if it keeps happening please let
            Georgia know — we&apos;ll sort it out.
          </Body>
        </Reveal>

        {error.digest && (
          <Reveal delay={600}>
            <Body
              size={11}
              color="var(--cosy-ink-mute)"
              className="cosy-mono"
              style={{ marginBottom: 28, letterSpacing: 2 }}
            >
              Ref · {error.digest}
            </Body>
          </Reveal>
        )}

        <Reveal delay={700}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn variant="primary" onClick={() => reset()}>
              Try again
            </Btn>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Btn variant="ghost">Back to the house</Btn>
            </Link>
            <a
              href="mailto:georgia@georgiascosyrooms.gr"
              style={{ textDecoration: 'none' }}
            >
              <Btn variant="ghost">Write to Georgia</Btn>
            </a>
          </div>
        </Reveal>

        {process.env.NODE_ENV === 'development' && (
          <Reveal delay={900}>
            <div
              style={{
                marginTop: 60,
                padding: '18px 22px',
                background: 'var(--cosy-paper)',
                borderRadius: 'var(--cosy-r2)',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(31,31,30,.05)',
              }}
            >
              <Display size={14} italic color="var(--cosy-ink-mute)" style={{ marginBottom: 8 }}>
                Dev-only message
              </Display>
              <Body
                size={12}
                color="var(--cosy-ink-soft)"
                className="cosy-mono"
                style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
              >
                {error.message}
              </Body>
            </div>
          </Reveal>
        )}
      </div>

      <CosyFooter />
    </>
  )
}
