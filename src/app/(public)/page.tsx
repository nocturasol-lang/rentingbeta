import { createServerCaller } from '@/lib/trpc-server'
import { CosyHero } from '@/components/public/cosy/hero'
import { FloatingDatePicker } from '@/components/public/cosy/date-picker-float'
import {
  CosyPropertyCard,
  type CosyPropertyCardData,
} from '@/components/public/cosy/property-card'
import { WholeHouseBlock } from '@/components/public/cosy/whole-house'
import { CosyFooter } from '@/components/public/cosy/footer'
import { Body, Display, Eyebrow, Reveal, RevealText } from '@/components/public/cosy/primitives'

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
            <Body size={12} color="var(--cosy-ink-mute)">
              {cards.length === 1
                ? '1 apartment · whole house available'
                : `${cards.length} apartments · whole house available`}
            </Body>
          </Reveal>
        </div>

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
