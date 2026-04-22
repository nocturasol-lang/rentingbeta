'use client'

import * as React from 'react'
import Link from 'next/link'
import { Body, Chip, Display, Eyebrow, Photo, Reveal, Star } from './primitives'

const tones = ['warm', 'sand', 'sage', 'sky'] as const

export type CosyPropertyCardData = {
  slug: string
  number: string
  name: string
  subtitle: string
  pricePerNight: number
  currency: string
  reviewScore: number | null
  reviewCount: number | null
  tag: string
  imageUrl: string | null
  imageAlt: string
  index: number
  unavailable?: boolean
}

export function CosyPropertyCard({ data }: { data: CosyPropertyCardData }) {
  const [hover, setHover] = React.useState(false)
  const tone = tones[data.index % tones.length]
  const currency = data.currency === 'EUR' ? '€' : data.currency
  return (
    <Reveal delay={data.index * 90} dy={40}>
      <Link
        href={`/properties/${data.slug}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'block',
          background: 'var(--cosy-paper)',
          borderRadius: 'var(--cosy-r3)',
          overflow: 'hidden',
          boxShadow: hover
            ? '0 20px 40px -16px rgba(31,31,30,.22)'
            : '0 2px 10px rgba(31,31,30,.05)',
          transform: hover ? 'translateY(-6px)' : 'translateY(0)',
          transition:
            'transform 400ms cubic-bezier(.2,.8,.2,1), box-shadow 400ms',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Photo
            label={data.imageUrl ? undefined : data.name.toLowerCase()}
            tone={tone}
            src={data.imageUrl}
            alt={data.imageAlt}
            ratio="16/10"
            radius={0}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div style={{ position: 'absolute', top: 20, left: 20 }}>
            <Chip
              tone="cream"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                border: 'none',
              }}
            >
              {data.tag}
            </Chip>
          </div>
          {data.unavailable && (
            <div style={{ position: 'absolute', top: 20, right: 20 }}>
              <Chip tone="dark" style={{ background: 'rgba(31,31,30,0.82)' }}>
                Unavailable for your dates
              </Chip>
            </div>
          )}
        </div>
        <div style={{ padding: '26px 28px 28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 14,
            }}
          >
            <div>
              <Eyebrow style={{ marginBottom: 8 }}>No. {data.number}</Eyebrow>
              <Display size={26} style={{ marginBottom: 6 }}>
                {data.name}
              </Display>
              <Body size={13} color="var(--cosy-ink-mute)">
                {data.subtitle}
              </Body>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
              <Display size={28} italic color="var(--cosy-ink)" style={{ lineHeight: 1 }}>
                {currency}
                {data.pricePerNight}
              </Display>
              <Body size={10} color="var(--cosy-ink-mute)">
                per night
              </Body>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingTop: 16,
              borderTop: '1px solid var(--cosy-line-soft)',
            }}
          >
            {data.reviewScore != null ? (
              <>
                <Star size={11} color="var(--cosy-ink)" />
                <Body size={12} color="var(--cosy-ink)" weight={600}>
                  {data.reviewScore.toFixed(1)}
                </Body>
                <Body size={12} color="var(--cosy-ink-mute)">
                  · {data.reviewCount ?? 0} reviews
                </Body>
              </>
            ) : (
              <Body size={12} color="var(--cosy-ink-mute)">
                New listing
              </Body>
            )}
            <span style={{ flex: 1 }} />
            <Body size={12} color="var(--cosy-ink)" weight={500}>
              View →
            </Body>
          </div>
        </div>
      </Link>
    </Reveal>
  )
}
