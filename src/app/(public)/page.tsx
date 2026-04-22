import { createServerCaller } from '@/lib/trpc-server'
import Link from 'next/link'
import { CosyHero } from '@/components/public/cosy/hero'
import { FloatingDatePicker } from '@/components/public/cosy/date-picker-float'
import {
  CosyPropertyCard,
  type CosyPropertyCardData,
} from '@/components/public/cosy/property-card'
import { WholeHouseBlock } from '@/components/public/cosy/whole-house'
import { CosyFooter } from '@/components/public/cosy/footer'
import {
  Body,
  Display,
  Eyebrow,
  Photo,
  Reveal,
  RevealText,
} from '@/components/public/cosy/primitives'

const numberWords = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

function extractNumber(name: string, fallbackIndex: number): string {
  const match = name.match(/#(\d+)/)
  const n = match ? Number(match[1]) : fallbackIndex + 1
  return String(n).padStart(2, '0')
}

function buildSubtitle(p: {
  bedrooms: number
  maxGuests: number
  size: number | null
}): string {
  const bedPart = p.bedrooms >= 2
    ? `${numberWords[p.bedrooms - 1] ?? p.bedrooms} bedrooms`
    : 'One bedroom'
  const guestsPart = p.maxGuests >= 3
    ? `sleeps ${numberWords[p.maxGuests - 1] ?? p.maxGuests}`
    : `for ${p.maxGuests === 1 ? 'one' : 'two'}`
  const sizePart = p.size ? `${p.size} m²` : null
  return [bedPart, guestsPart, sizePart].filter(Boolean).join(' · ')
}

function buildTag(p: {
  bedrooms: number
  maxGuests: number
  reviewCount: number | null
  amenities: string[]
}): string {
  if (p.bedrooms >= 3 || p.maxGuests >= 6) return 'Family maisonette'
  if (p.amenities?.some((a) => /balcony|view/i.test(a))) return 'Balcony view'
  if ((p.reviewCount ?? 0) > 50) return 'Most reviewed'
  return 'Couples'
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}) {
  const params = await searchParams
  const trpc = await createServerCaller()

  const properties = await trpc.properties.list({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests ? parseInt(params.guests, 10) : undefined,
  })

  const heroImage = properties.find((p) => p.images.length > 0)?.images[0]?.url ?? null

  const cards: CosyPropertyCardData[] = properties.map((p, i) => ({
    slug: p.slug,
    number: extractNumber(p.name, i),
    name: p.name,
    subtitle: buildSubtitle(p),
    pricePerNight: Math.round(p.pricePerNightCents / 100),
    currency: p.currency,
    reviewScore: p.reviewScore,
    reviewCount: p.reviewCount,
    tag: buildTag(p),
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.alt ?? p.name,
    index: i,
    unavailable: params.checkIn && params.checkOut ? p.available === false : undefined,
  }))

  return (
    <>
      <CosyHero heroImageUrl={heroImage} />

      <FloatingDatePicker />

      {/* Intro */}
      <div
        style={{
          padding: '130px 72px 80px',
          textAlign: 'center',
          maxWidth: 820,
          margin: '0 auto',
        }}
      >
        <Reveal>
          <Eyebrow style={{ marginBottom: 20 }}>A small house by the sea</Eyebrow>
        </Reveal>
        <RevealText
          text="Rooms that feel like a quiet Greek home, not a listing."
          size={44}
          italic
          delay={100}
          style={{ lineHeight: 1.15 }}
        />
        <Reveal delay={600}>
          <Body
            size={15}
            color="var(--cosy-ink-soft)"
            style={{ maxWidth: 560, margin: '26px auto 0' }}
          >
            Georgia runs these four apartments herself. Guests come back. The coffee tray, the
            pointed directions to the quiet taverna, the door opened in person — all included.
          </Body>
        </Reveal>
      </div>

      {/* Property grid */}
      <section id="apartments" style={{ padding: '0 72px 100px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 40,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Reveal>
              <Eyebrow style={{ marginBottom: 10 }}>The Apartments</Eyebrow>
            </Reveal>
            <Reveal delay={100}>
              <Display size={36} italic>
                Choose your room
              </Display>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <Link
              href="/properties"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Body size={13} color="var(--cosy-ink)" weight={600}>
                Browse all apartments
              </Body>
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
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
            </Link>
          </Reveal>
        </div>

        {/* Browse thumbnail CTA */}
        <BrowseThumbnail heroImageUrl={heroImage} />


        {cards.length === 0 ? (
          <Reveal>
            <div
              style={{
                background: 'var(--cosy-paper)',
                borderRadius: 'var(--cosy-r3)',
                padding: '64px 48px',
                textAlign: 'center',
              }}
            >
              <Display size={28} italic style={{ marginBottom: 12 }}>
                No rooms match those dates.
              </Display>
              <Body color="var(--cosy-ink-mute)">Try different dates or fewer guests.</Body>
            </div>
          </Reveal>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24,
            }}
          >
            {cards.map((c) => (
              <CosyPropertyCard key={c.slug} data={c} />
            ))}
          </div>
        )}

        <WholeHouseBlock />
      </section>

      <CosyFooter />
    </>
  )
}

function BrowseThumbnail({ heroImageUrl }: { heroImageUrl: string | null }) {
  return (
    <Reveal delay={200} dy={30}>
      <Link
        href="/properties"
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
          minHeight: 260,
        }}
      >
        <div style={{ position: 'relative', minHeight: 220 }}>
          <Photo
            src={heroImageUrl}
            alt="Browse all apartments"
            tone="sage"
            fill
            radius={0}
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
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
            4 apartments · Kavala
          </div>
        </div>
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
          <Body size={14} color="var(--cosy-ink-soft)" style={{ lineHeight: 1.65, maxWidth: 420 }}>
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
