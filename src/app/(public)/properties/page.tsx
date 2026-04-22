import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerCaller } from '@/lib/trpc-server'
import { CosyNav } from '@/components/public/cosy/nav'
import { CosyFooter } from '@/components/public/cosy/footer'
import { FloatingDatePicker } from '@/components/public/cosy/date-picker-float'
import {
  CosyPropertyCard,
  type CosyPropertyCardData,
} from '@/components/public/cosy/property-card'
import { WholeHouseBlock } from '@/components/public/cosy/whole-house'
import {
  Body,
  Display,
  Eyebrow,
  Label,
  Reveal,
  RevealText,
} from '@/components/public/cosy/primitives'

export const metadata: Metadata = {
  title: "Apartments — Georgia's Cosy Rooms",
  description:
    'Four cosy apartments by the sea in Kavala, Greece. Browse availability and book direct — no agency fees.',
}

const numberWords = [
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
]

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
  const bedPart =
    p.bedrooms >= 2
      ? `${numberWords[p.bedrooms - 1] ?? p.bedrooms} bedrooms`
      : 'One bedroom'
  const guestsPart =
    p.maxGuests >= 3
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

export default async function PropertiesListPage({
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

  const filterActive = !!(params.checkIn && params.checkOut)
  const availableCount = cards.filter((c) => !c.unavailable).length

  return (
    <>
      <CosyNav bookHref="#apartments" />

      {/* Title block */}
      <div style={{ padding: '40px 72px 28px' }}>
        <Reveal>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Label>Home</Label>
            </Link>
            <span style={{ color: 'var(--cosy-ink-mute)', fontSize: 11 }}>/</span>
            <Label color="var(--cosy-ink)">Apartments</Label>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <Eyebrow style={{ marginBottom: 14 }}>Four quiet rooms by the Aegean</Eyebrow>
        </Reveal>
        <RevealText
          text="Our apartments."
          size={72}
          italic
          delay={120}
          style={{ marginBottom: 18 }}
        />
        <Reveal delay={500}>
          <Body
            size={15}
            color="var(--cosy-ink-soft)"
            style={{ maxWidth: 640, lineHeight: 1.75 }}
          >
            Four homes within one small house in Kavala, Greece — each self-contained, each
            booked directly with Georgia. Pick your dates to check availability, or browse all
            four and the whole-house option below.
          </Body>
        </Reveal>
      </div>

      {/* Filter bar */}
      <FloatingDatePicker
        variant="inline"
        submitTo="/properties"
        submitHash="#apartments"
      />

      {/* Filter status */}
      {filterActive && (
        <div style={{ padding: '28px 72px 0', maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <Body size={13} color="var(--cosy-ink-mute)" style={{ textAlign: 'center' }}>
              {availableCount > 0
                ? `${availableCount} of ${cards.length} apartments available for your dates.`
                : 'None of the apartments are free for those exact dates — try a different window.'}
            </Body>
          </Reveal>
        </div>
      )}

      {/* Grid */}
      <section id="apartments" style={{ padding: '60px 72px 60px' }}>
        <Reveal>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 32,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <Display size={30} italic>
              {filterActive ? 'Available for your dates' : 'All four apartments'}
            </Display>
            <Body size={12} color="var(--cosy-ink-mute)">
              Whole house available · from €295 / night
            </Body>
          </div>
        </Reveal>

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
                No apartments match those dates.
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
