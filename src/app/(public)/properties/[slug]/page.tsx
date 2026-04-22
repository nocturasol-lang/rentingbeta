import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerCaller } from '@/lib/trpc-server'
import { CosyNav } from '@/components/public/cosy/nav'
import { CosyFooter } from '@/components/public/cosy/footer'
import { MosaicGallery } from '@/components/public/cosy/mosaic-gallery'
import { BookingPanel } from '@/components/public/cosy/booking-panel'
import {
  Body,
  Chip,
  Display,
  Eyebrow,
  Label,
  Reveal,
  RevealText,
  Star,
} from '@/components/public/cosy/primitives'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trpc = await createServerCaller()
  try {
    const property = await trpc.properties.getBySlug({ slug })
    return {
      title: `${property.name} — Georgia's Cosy Rooms`,
      description: property.description.substring(0, 160),
    }
  } catch {
    return { title: 'Property Not Found' }
  }
}

const numberWords: Record<number, string> = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
}

function extractNumber(name: string): string {
  const match = name.match(/#(\d+)/)
  return match ? match[1].padStart(2, '0') : '01'
}

function extractPropertyTitle(name: string): string {
  // "Georgia's Cozy Rooms #1" → "Cosy Rooms #1"
  const match = name.match(/#(\d+)/)
  return match ? `Cosy Rooms #${match[1]}` : name
}

function buildTag(p: {
  bedrooms: number
  maxGuests: number
  amenities: string[]
}): string {
  if (p.bedrooms >= 3 || p.maxGuests >= 6) return 'Family maisonette'
  if (p.amenities?.some((a) => /balcony|view/i.test(a))) return 'Balcony view'
  return 'For couples'
}

function cancellationText(policy: string): string {
  if (policy === 'FLEXIBLE') return 'Free cancellation up to 24 hours before arrival.'
  if (policy === 'MODERATE') return 'Free cancellation up to 5 days before arrival.'
  return 'Non-refundable.'
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params
  const trpc = await createServerCaller()

  let property
  try {
    property = await trpc.properties.getBySlug({ slug })
  } catch {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: 'Kavala',
      addressCountry: 'GR',
    },
    priceRange: `€${(property.pricePerNightCents / 100).toFixed(0)}`,
    ...(property.reviewScore && property.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: property.reviewScore,
            reviewCount: property.reviewCount,
            bestRating: 10,
          },
        }
      : {}),
  }

  const number = extractNumber(property.name)
  const title = extractPropertyTitle(property.name)
  const tag = buildTag(property)
  const specs: Array<[string, string]> = [
    ['Size', property.size ? `${property.size} m²` : '—'],
    ['Bedrooms', numberWords[property.bedrooms] ?? String(property.bedrooms)],
    ['Bathrooms', numberWords[property.bathrooms] ?? String(property.bathrooms)],
    ['Sleeps', `Up to ${property.maxGuests}`],
    ['Check-in', `${property.checkInFrom}–${property.checkInTo}`],
    ['Check-out', `${property.checkOutFrom}–${property.checkOutTo}`],
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <CosyNav bookHref="#availability-picker" />

      {/* breadcrumb + title */}
      <div style={{ padding: '20px 72px 40px' }}>
        <Reveal>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 28,
            }}
          >
            <Link href="/#apartments" style={{ textDecoration: 'none' }}>
              <Label>Apartments</Label>
            </Link>
            <span style={{ color: 'var(--cosy-ink-mute)', fontSize: 11 }}>/</span>
            <Label color="var(--cosy-ink)">
              No. {number} · {title}
            </Label>
          </div>
        </Reveal>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div>
            <Reveal>
              <Chip tone="dark" style={{ marginBottom: 18 }}>
                {tag}
              </Chip>
            </Reveal>
            <RevealText text={title} size={72} italic delay={100} style={{ marginBottom: 16 }} />
            <Reveal delay={500}>
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {property.reviewScore != null && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Star size={12} color="var(--cosy-ink)" />
                      <Body size={13} color="var(--cosy-ink)" weight={600}>
                        {property.reviewScore.toFixed(1)}
                      </Body>
                      <Body size={13} color="var(--cosy-ink-mute)">
                        · {property.reviewCount ?? 0} reviews
                      </Body>
                    </div>
                    <Body size={13} color="var(--cosy-ink-mute)">
                      ·
                    </Body>
                  </>
                )}
                <Body size={13} color="var(--cosy-ink)">
                  {property.address}
                </Body>
                {property.size && (
                  <>
                    <Body size={13} color="var(--cosy-ink-mute)">
                      ·
                    </Body>
                    <Body size={13} color="var(--cosy-ink)">
                      {property.size} m²
                    </Body>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Mosaic gallery */}
      <MosaicGallery
        images={property.images.map((i) => ({ url: i.url, alt: i.alt }))}
        propertyName={property.name}
      />

      {/* Main grid — content + booking panel */}
      <div
        style={{
          padding: '0 72px 100px',
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 56,
          alignItems: 'start',
        }}
      >
        {/* left — content */}
        <div>
          <Reveal>
            <Eyebrow style={{ marginBottom: 14 }}>About this apartment</Eyebrow>
            <Display size={32} italic style={{ marginBottom: 22, lineHeight: 1.2 }}>
              {property.description.split('\n')[0]?.slice(0, 160) ?? 'A quiet place by the sea.'}
            </Display>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                color: 'var(--cosy-ink-soft)',
                lineHeight: 1.7,
                marginBottom: 40,
                whiteSpace: 'pre-line',
              }}
            >
              {property.description}
            </div>
          </Reveal>

          {/* Specs */}
          <Reveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 40,
              }}
            >
              {specs.map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    background: 'var(--cosy-paper)',
                    borderRadius: 'var(--cosy-r2)',
                    padding: '20px 22px',
                    boxShadow: '0 1px 3px rgba(31,31,30,.05)',
                  }}
                >
                  <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 6 }}>
                    {k}
                  </Label>
                  <Display size={20} italic>
                    {v}
                  </Display>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <Reveal>
              <Eyebrow style={{ marginBottom: 16 }}>Provided</Eyebrow>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 40,
                }}
              >
                {property.amenities.map((a) => (
                  <div
                    key={a}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--cosy-paper)',
                      borderRadius: 'var(--cosy-r-full)',
                      padding: '12px 18px',
                      boxShadow: '0 1px 3px rgba(31,31,30,.04)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      color: 'var(--cosy-ink)',
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'var(--cosy-ink)',
                      }}
                    />
                    {a}
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* House rules */}
          <Reveal>
            <Eyebrow style={{ marginBottom: 16 }}>House rules</Eyebrow>
            <div
              style={{
                background: 'var(--cosy-paper)',
                borderRadius: 'var(--cosy-r2)',
                padding: '22px 24px',
                boxShadow: '0 1px 3px rgba(31,31,30,.05)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <Rule label="Check-in" value={`${property.checkInFrom}–${property.checkInTo}`} />
              <Rule label="Check-out" value={`${property.checkOutFrom}–${property.checkOutTo}`} />
              {property.minNights > 1 && (
                <Rule label="Minimum stay" value={`${property.minNights} nights`} />
              )}
              {property.licenseNumber && (
                <Rule label="License" value={property.licenseNumber} />
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <Rule label="Cancellation" value={cancellationText(property.cancellationPolicy)} />
              </div>
            </div>
          </Reveal>
        </div>

        {/* right — booking panel */}
        <BookingPanel
          propertyId={property.id}
          slug={property.slug}
          pricePerNightCents={property.pricePerNightCents}
          cleaningFeeCents={property.cleaningFeeCents}
          currency={property.currency}
          minNights={property.minNights}
          blockedRanges={property.blockedRanges}
        />
      </div>

      <CosyFooter />
    </>
  )
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4 }}>
        {label}
      </Label>
      <Body size={13} color="var(--cosy-ink)" weight={500}>
        {value}
      </Body>
    </div>
  )
}
