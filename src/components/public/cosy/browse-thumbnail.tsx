'use client'

import * as React from 'react'
import Link from 'next/link'
import { Body, Display, Eyebrow, Photo, Reveal } from './primitives'

type CarouselImage = { url: string; alt: string; caption?: string }

export function BrowseThumbnailCarousel({
  images,
  intervalMs = 4500,
}: {
  images: CarouselImage[]
  intervalMs?: number
}) {
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  React.useEffect(() => {
    if (paused || prefersReducedMotion || images.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [paused, prefersReducedMotion, images.length, intervalMs])

  const tones = ['warm', 'sand', 'sage', 'sky'] as const
  const safeImages: CarouselImage[] =
    images.length > 0 ? images : [{ url: '', alt: 'Cosy Rooms' }]

  return (
    <Reveal delay={200} dy={30}>
      <Link
        href="/properties"
        aria-label="Browse all four apartments"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          background: 'var(--cosy-paper)',
          borderRadius: 'var(--cosy-r3)',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(31,31,30,.05)',
          textDecoration: 'none',
          color: 'inherit',
          marginBottom: 32,
          minHeight: 320,
        }}
      >
        {/* Image stack — crossfade */}
        <div style={{ position: 'relative', minHeight: 280 }}>
          {safeImages.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: i === index ? 1 : 0,
                transition: 'opacity 900ms cubic-bezier(.2,.7,.2,1)',
                willChange: 'opacity',
              }}
            >
              <Photo
                src={img.url || null}
                alt={img.alt}
                tone={tones[i % tones.length]}
                fill
                radius={0}
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
            </div>
          ))}

          {/* Chip top-left */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: 'var(--cosy-r-full)',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: 'var(--cosy-ink)',
            }}
          >
            {safeImages.length} apartments · Kavala
          </div>

          {/* Caption for current image */}
          {safeImages[index]?.caption && (
            <div
              key={index}
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                background: 'rgba(31,31,30,0.45)',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                borderRadius: 'var(--cosy-r-full)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: '#fff',
                width: 'fit-content',
                animation: 'cosy-fade-in 600ms ease forwards',
              }}
            >
              {safeImages[index].caption}
            </div>
          )}

          {/* Pill indicators */}
          {safeImages.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 14,
                right: 14,
                display: 'flex',
                gap: 6,
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(6px)',
                borderRadius: 'var(--cosy-r-full)',
              }}
            >
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show apartment ${i + 1}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIndex(i)
                  }}
                  style={{
                    width: i === index ? 22 : 7,
                    height: 7,
                    borderRadius: 999,
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: i === index ? 'var(--cosy-ink)' : 'var(--cosy-ink-mute)',
                    transition:
                      'width 400ms cubic-bezier(.2,.7,.2,1), background 300ms',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Copy side */}
        <div
          style={{
            padding: '44px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Eyebrow>See them side by side</Eyebrow>
          <Display size={34} italic style={{ lineHeight: 1.1 }}>
            Browse all four apartments.
          </Display>
          <Body
            size={14}
            color="var(--cosy-ink-soft)"
            style={{ lineHeight: 1.65, maxWidth: 420 }}
          >
            Pick dates, compare sizes, see what&apos;s free — then book the one that fits your
            stay.
          </Body>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: 'var(--cosy-ink)',
            }}
          >
            Explore the collection
            <span
              aria-hidden
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--cosy-r-full)',
                background: 'var(--cosy-ink)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              →
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  )
}
