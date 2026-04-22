'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/trpc'
import { trpc } from '@/lib/trpc'

type BookingPayload = inferRouterOutputs<AppRouter>['bookings']['getByReference']
import { CosyNav } from '@/components/public/cosy/nav'
import { CosyFooter } from '@/components/public/cosy/footer'
import {
  Body,
  Btn,
  Chip,
  CountUp,
  Display,
  Eyebrow,
  Label,
  Reveal,
  RevealText,
} from '@/components/public/cosy/primitives'

function extractPropertyTitle(name: string): string {
  const match = name.match(/#(\d+)/)
  return match ? `Cosy Rooms #${match[1]}` : name
}

function firstName(name: string): string {
  return name.split(' ')[0] ?? name
}

function formatLongDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function splitDate(iso: string): { dow: string; day: string; month: string } {
  const d = new Date(iso)
  const dow = d.toLocaleDateString('en-GB', { weekday: 'short' })
  const day = String(d.getDate())
  const month = d.toLocaleDateString('en-GB', { month: 'long' })
  return { dow, day, month }
}

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = use(params)
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(emailFromUrl)
  const [submitted, setSubmitted] = useState(!!emailFromUrl)

  const { data: booking, isLoading, error } = trpc.bookings.getByReference.useQuery(
    { reference, guestEmail: email },
    { enabled: submitted && !!email }
  )

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <CosyNav bookHref="/#apartments" />

      {!submitted && (
        <div style={{ padding: '60px 72px 100px', display: 'flex', justifyContent: 'center' }}>
          <Reveal>
            <div
              style={{
                background: 'var(--cosy-paper)',
                borderRadius: 'var(--cosy-r3)',
                padding: '48px 56px',
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 12px 40px -16px rgba(31,31,30,.18)',
              }}
            >
              <Eyebrow style={{ marginBottom: 16 }}>View your booking</Eyebrow>
              <Display size={36} italic style={{ marginBottom: 10 }}>
                Reference {reference}
              </Display>
              <Body size={14} color="var(--cosy-ink-mute)" style={{ marginBottom: 28 }}>
                Enter the email you used when booking to view your confirmation.
              </Body>
              <form onSubmit={handleEmailSubmit}>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 'var(--cosy-r2)',
                    border: '1px solid var(--cosy-line)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--cosy-ink)',
                    marginBottom: 16,
                    outline: 'none',
                  }}
                />
                <Btn variant="primary" wide type="submit">
                  View booking
                </Btn>
              </form>
            </div>
          </Reveal>
        </div>
      )}

      {submitted && isLoading && (
        <div style={{ padding: '120px 72px', textAlign: 'center' }}>
          <Body color="var(--cosy-ink-mute)">Loading your booking…</Body>
        </div>
      )}

      {submitted && error && (
        <div style={{ padding: '60px 72px 100px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              background: 'var(--cosy-paper)',
              borderRadius: 'var(--cosy-r3)',
              padding: '48px 56px',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 12px 40px -16px rgba(31,31,30,.18)',
            }}
          >
            <Display size={28} italic style={{ marginBottom: 12 }}>
              Booking not found
            </Display>
            <Body size={14} color="var(--cosy-ink-mute)" style={{ marginBottom: 24 }}>
              Please check your reference and email address.
            </Body>
            <Btn variant="primary" onClick={() => setSubmitted(false)}>
              Try again
            </Btn>
          </div>
        </div>
      )}

      {submitted && booking && <BookingContent booking={booking} emailUsed={email} />}

      <CosyFooter />
    </>
  )
}

function BookingContent({
  booking,
  emailUsed,
}: {
  booking: BookingPayload
  emailUsed: string
}) {
  const title = extractPropertyTitle(booking.property.name)
  const guestFirst = firstName(booking.guestName)
  const symbol = booking.currency === 'EUR' ? '€' : booking.currency
  const totalDisplay = Math.round(booking.totalCents / 100)
  const checkInParts = splitDate(booking.checkIn)
  const checkOutParts = splitDate(booking.checkOut)
  const confirmedLabel = booking.confirmedAt
    ? `Confirmed · ${formatLongDate(booking.confirmedAt)}`
    : 'Reservation received'

  return (
    <>
      {/* Hero */}
      <div
        style={{
          padding: '60px 72px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span style={{ ...dotStyle, top: 80, left: '12%', background: 'var(--cosy-peach)' }} />
        <span style={{ ...dotStyle, top: 160, right: '18%', background: 'var(--cosy-sage)', width: 10, height: 10 }} />
        <span style={{ ...dotStyle, top: 240, left: '22%', background: 'var(--cosy-accent-soft)', width: 6, height: 6 }} />
        <span style={{ ...dotStyle, top: 120, right: '10%', background: 'var(--cosy-sunshine)', width: 7, height: 7 }} />

        <Reveal>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 'var(--cosy-r-full)',
              background: 'var(--cosy-ink)',
              margin: '0 auto 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 40px -12px rgba(31,31,30,.3)',
            }}
          >
            <svg width="38" height="38" viewBox="0 0 28 28" fill="none">
              <path
                d="M7 14l5 5 9-10"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: 30,
                  animation: 'cosy-check-draw 700ms cubic-bezier(.2,.8,.2,1) 400ms forwards',
                }}
              />
            </svg>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <Eyebrow style={{ marginBottom: 16 }}>{confirmedLabel}</Eyebrow>
        </Reveal>
        <RevealText
          text="Your room is waiting."
          size={64}
          italic
          delay={250}
          style={{ marginBottom: 18, textAlign: 'center' }}
        />
        <Reveal delay={800}>
          <Body size={15} color="var(--cosy-ink-soft)" style={{ maxWidth: 520, margin: '0 auto' }}>
            A copy of the reservation has been sent to {emailUsed}. Georgia will meet you at the door.
          </Body>
        </Reveal>
      </div>

      {/* Letter + Ticket */}
      <div
        style={{
          padding: '40px 72px 80px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <Reveal dy={30}>
          <div
            style={{
              background: 'var(--cosy-paper)',
              borderRadius: 'var(--cosy-r3)',
              padding: '56px 64px',
              boxShadow: '0 2px 10px rgba(31,31,30,.05)',
            }}
          >
            <Chip tone="dark" style={{ marginBottom: 24 }}>
              Booking · {booking.reference}
            </Chip>
            <Display size={44} italic style={{ marginBottom: 28 }}>
              Dear {guestFirst},
            </Display>
            <Body size={15} color="var(--cosy-ink-soft)" style={{ marginBottom: 18, lineHeight: 1.75 }}>
              Thank you for choosing {title} for your stay. I&apos;ve written the dates below — please
              check them, and tell me if anything needs changing.
            </Body>
            <Body size={15} color="var(--cosy-ink-soft)" style={{ marginBottom: 18, lineHeight: 1.75 }}>
              A few days before you travel I&apos;ll send the door code and directions from the bus
              stop, in case you miss me. The nearest beach is Kalamitsa — four minutes on foot.
            </Body>
            <Body size={15} color="var(--cosy-ink-soft)" style={{ marginBottom: 32, lineHeight: 1.75 }}>
              I&apos;ll leave a tray on the counter when you arrive — coffee from the roaster down the
              road, olives, and a bottle of local wine.
            </Body>

            <Body size={15} color="var(--cosy-ink-soft)" style={{ marginBottom: 8 }}>
              Until then,
            </Body>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Display size={48} italic color="var(--cosy-ink)" weight={500} style={{ lineHeight: 1 }}>
                Georgia
              </Display>
              <svg
                width="140"
                height="16"
                viewBox="0 0 140 16"
                style={{ position: 'absolute', bottom: -6, left: 0 }}
              >
                <path
                  d="M2,10 Q40,2 75,8 T138,5"
                  stroke="var(--cosy-ink)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 180,
                    strokeDashoffset: 180,
                    animation: 'cosy-sig-draw 1200ms cubic-bezier(.2,.8,.2,1) 900ms forwards',
                  }}
                />
              </svg>
            </div>
            <Body size={12} color="var(--cosy-ink-mute)" style={{ marginTop: 16 }}>
              +30 697 331 4237 · georgia@georgiascosyrooms.gr
            </Body>
          </div>
        </Reveal>

        <Reveal delay={200} dy={30}>
          <div
            style={{
              background: 'var(--cosy-paper)',
              borderRadius: 'var(--cosy-r3)',
              padding: '36px 32px',
              boxShadow: '0 12px 40px -16px rgba(31,31,30,.18)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 6 }}>
                Reservation
              </Label>
              <div
                className="cosy-mono"
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: 4,
                  color: 'var(--cosy-ink)',
                }}
              >
                {booking.reference}
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                borderTop: '1.5px dashed var(--cosy-line)',
                margin: '0 -32px 28px',
              }}
            >
              <span style={cutoutStyle('left')} />
              <span style={cutoutStyle('right')} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Chip tone="dark" style={{ marginBottom: 12 }}>
                {title}
              </Chip>
              <Display size={28} italic>
                {booking.property.address.split(',')[0]}
              </Display>
              <Body size={12} color="var(--cosy-ink-mute)" style={{ marginTop: 4 }}>
                Kavala, Greece
              </Body>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 10,
                alignItems: 'center',
                marginBottom: 28,
                background: 'var(--cosy-peach-soft)',
                borderRadius: 'var(--cosy-r2)',
                padding: '22px 16px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4 }}>
                  Arrival
                </Label>
                <Display size={18}>{checkInParts.dow}</Display>
                <Display size={40} italic color="var(--cosy-ink)" style={{ lineHeight: 1 }}>
                  {checkInParts.day}
                </Display>
                <Body size={11} color="var(--cosy-ink-mute)">
                  {checkInParts.month} · {booking.property.checkInFrom}
                </Body>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--cosy-r-full)',
                    background: 'var(--cosy-paper)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                  }}
                >
                  <Body size={13} color="var(--cosy-ink)" weight={600}>
                    <CountUp to={booking.nights} />
                  </Body>
                </div>
                <Body size={10} color="var(--cosy-ink-mute)">
                  {booking.nights === 1 ? 'night' : 'nights'}
                </Body>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4 }}>
                  Departure
                </Label>
                <Display size={18}>{checkOutParts.dow}</Display>
                <Display size={40} italic color="var(--cosy-ink)" style={{ lineHeight: 1 }}>
                  {checkOutParts.day}
                </Display>
                <Body size={11} color="var(--cosy-ink-mute)">
                  {checkOutParts.month} · {booking.property.checkOutTo}
                </Body>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 22,
                paddingBottom: 22,
                borderBottom: '1px solid var(--cosy-line-soft)',
              }}
            >
              <div>
                <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4 }}>
                  Guest
                </Label>
                <Body size={13} color="var(--cosy-ink)" weight={600}>
                  {booking.guestName} · {booking.guestCount}
                </Body>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4 }}>
                  Paid
                </Label>
                <Body size={14} color="var(--cosy-ink)" weight={600}>
                  {symbol}
                  <CountUp to={totalDisplay} duration={1100} />
                </Body>
              </div>
            </div>

            <Link href={`/properties/${booking.property.slug}`} style={{ display: 'block' }}>
              <Btn variant="primary" wide>
                View apartment
              </Btn>
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Timeline */}
      <div style={{ padding: '0 72px 100px' }}>
        <Reveal>
          <Eyebrow style={{ marginBottom: 16, textAlign: 'center' }}>What happens next</Eyebrow>
        </Reveal>
        <RevealText
          text="Three short steps between now and your arrival."
          size={40}
          italic
          delay={100}
          style={{ textAlign: 'center', marginBottom: 56 }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          {[
            ['A few days before', 'Georgia sends the door code and walking directions from the bus stop.'],
            ['On arrival', `Meet Georgia at ${booking.property.address.split(',')[0]}. She will show you the apartment and the garden.`],
            ['During your stay', 'Text or call any hour. Linens are refreshed on longer stays.'],
          ].map(([w, d], i) => (
            <Reveal key={w} delay={i * 120} dy={30}>
              <div
                style={{
                  background: 'var(--cosy-paper)',
                  borderRadius: 'var(--cosy-r3)',
                  padding: '36px 32px',
                  boxShadow: '0 1px 3px rgba(31,31,30,.05)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--cosy-r-full)',
                    background: 'var(--cosy-peach)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Display size={16} italic color="var(--cosy-ink)">
                    {String(i + 1).padStart(2, '0')}
                  </Display>
                </div>
                <Display size={22} style={{ marginBottom: 12 }}>
                  {w}
                </Display>
                <Body size={13} color="var(--cosy-ink-soft)" style={{ lineHeight: 1.7 }}>
                  {d}
                </Body>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  )
}

const dotStyle: React.CSSProperties = {
  position: 'absolute',
  width: 8,
  height: 8,
  borderRadius: '50%',
}

function cutoutStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    [side]: -14,
    top: -14,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--cosy-cream)',
  }
}
