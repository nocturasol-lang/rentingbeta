'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { trpc } from '@/lib/trpc'
import { countries } from '@/lib/countries'
import {
  Body,
  Btn,
  Chip,
  Display,
  Eyebrow,
  Label,
  Photo,
  Reveal,
} from '@/components/public/cosy/primitives'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BookingFlowProps {
  propertyId: string
  propertyName: string
  propertyTitle: string
  propertyAddress: string
  propertyImage: string | null
  propertyImageAlt: string
  slug: string
  checkIn: string
  checkOut: string
  initialGuests: number
  maxGuests: number
  pricePerNightCents: number
  cleaningFeeCents: number
  currency: string
}

interface GuestDetails {
  guestName: string
  guestEmail: string
  guestPhone: string
  guestCount: number
  guestIdNumber: string
  guestIdType: 'PASSPORT' | 'NATIONAL_ID'
  guestNationality: string
  guestDateOfBirth: string
  guestResidenceCountry: string
}

function formatLong(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function BookingFlow({
  propertyId,
  propertyName,
  propertyTitle,
  propertyAddress,
  propertyImage,
  propertyImageAlt,
  slug,
  checkIn,
  checkOut,
  initialGuests,
  maxGuests,
  pricePerNightCents,
  cleaningFeeCents,
  currency,
}: BookingFlowProps) {
  const [step, setStep] = React.useState(1)
  const [guest, setGuest] = React.useState<GuestDetails>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: Math.min(initialGuests, maxGuests),
    guestIdNumber: '',
    guestIdType: 'PASSPORT',
    guestNationality: '',
    guestDateOfBirth: '',
    guestResidenceCountry: '',
  })
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [bookingRef, setBookingRef] = React.useState<string | null>(null)
  const [error, setError] = React.useState('')

  const { data: availability, isLoading: checkingAvailability } =
    trpc.availability.check.useQuery(
      { propertyId, checkIn, checkOut },
      { enabled: !!checkIn && !!checkOut }
    )

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret)
      setBookingRef(data.reference)
      setStep(3)
    },
    onError: (err) => setError(err.message),
  })

  function handleGuestSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    createBooking.mutate({
      propertyId,
      checkIn,
      checkOut,
      guestName: guest.guestName.trim(),
      guestEmail: guest.guestEmail.trim(),
      guestPhone: guest.guestPhone.trim(),
      guestCount: guest.guestCount,
      guestIdNumber: guest.guestIdNumber.trim(),
      guestIdType: guest.guestIdType,
      guestNationality: guest.guestNationality,
      guestDateOfBirth: guest.guestDateOfBirth,
      guestResidenceCountry: guest.guestResidenceCountry,
    })
  }

  const symbol = currency === 'EUR' ? '€' : currency
  const total = availability?.breakdown?.totalCents ?? null
  const missingDates = !checkIn || !checkOut

  return (
    <div>
      <StepIndicator step={step} />

      {/* Layout: left = current step, right = summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 40,
          marginTop: 40,
          alignItems: 'start',
        }}
      >
        <div>
          {missingDates && (
            <Card>
              <Display size={28} italic style={{ marginBottom: 14 }}>
                Pick your dates first
              </Display>
              <Body color="var(--cosy-ink-mute)" style={{ marginBottom: 22 }}>
                Choose an arrival and departure on the apartment page before continuing.
              </Body>
              <Link href={`/properties/${slug}#availability-picker`}>
                <Btn variant="primary">Back to the apartment</Btn>
              </Link>
            </Card>
          )}

          {!missingDates && step === 1 && (
            <StepReview
              checkingAvailability={checkingAvailability}
              available={availability?.available}
              nights={availability?.nights ?? null}
              breakdown={availability?.breakdown ?? null}
              symbol={symbol}
              onContinue={() => setStep(2)}
              slug={slug}
            />
          )}

          {step === 2 && (
            <StepDetails
              guest={guest}
              setGuest={setGuest}
              maxGuests={maxGuests}
              error={error}
              pending={createBooking.isPending}
              onBack={() => setStep(1)}
              onSubmit={handleGuestSubmit}
            />
          )}

          {step === 3 && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StepPayment
                bookingRef={bookingRef!}
                guestEmail={guest.guestEmail}
                totalCents={total ?? 0}
                symbol={symbol}
                onBack={() => setStep(2)}
              />
            </Elements>
          )}
        </div>

        <BookingSummary
          propertyTitle={propertyTitle}
          propertyName={propertyName}
          propertyAddress={propertyAddress}
          propertyImage={propertyImage}
          propertyImageAlt={propertyImageAlt}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={availability?.nights ?? null}
          guests={guest.guestCount}
          pricePerNightCents={pricePerNightCents}
          cleaningFeeCents={cleaningFeeCents}
          totalCents={total}
          symbol={symbol}
        />
      </div>
    </div>
  )
}

// ─── Step indicator ──────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ['Review', 'Your details', 'Payment']
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 0',
        flexWrap: 'wrap',
      }}
    >
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--cosy-r-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done || active ? 'var(--cosy-ink)' : 'var(--cosy-peach)',
                  color: done || active ? '#fff' : 'var(--cosy-ink)',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                }}
              >
                {done ? '✓' : String(n).padStart(2, '0')}
              </div>
              <Body
                size={12}
                weight={active ? 600 : 400}
                color={active ? 'var(--cosy-ink)' : 'var(--cosy-ink-mute)'}
                style={{ textTransform: 'uppercase', letterSpacing: 1.4 }}
              >
                {label}
              </Body>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 32, height: 1, background: 'var(--cosy-line)' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Card wrapper ──────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <div
        style={{
          background: 'var(--cosy-paper)',
          borderRadius: 'var(--cosy-r3)',
          padding: '40px 44px',
          boxShadow: '0 2px 10px rgba(31,31,30,.05)',
        }}
      >
        {children}
      </div>
    </Reveal>
  )
}

// ─── Step 1 · Review ──────────────────────────────────────────

function StepReview({
  checkingAvailability,
  available,
  nights,
  breakdown,
  symbol,
  onContinue,
  slug,
}: {
  checkingAvailability: boolean
  available?: boolean
  nights: number | null
  breakdown: {
    pricePerNightCents: number
    nightsTotalCents: number
    cleaningFeeCents: number
    totalCents: number
  } | null
  symbol: string
  onContinue: () => void
  slug: string
}) {
  return (
    <Card>
      <Eyebrow style={{ marginBottom: 14 }}>Step one</Eyebrow>
      <Display size={34} italic style={{ marginBottom: 22 }}>
        Review your stay
      </Display>

      {checkingAvailability && (
        <Body color="var(--cosy-ink-mute)">Checking availability…</Body>
      )}

      {!checkingAvailability && available === false && (
        <>
          <Body color="var(--cosy-ink-soft)" style={{ marginBottom: 22 }}>
            These dates are no longer available. They may have been taken on Booking.com or
            Airbnb while you were browsing.
          </Body>
          <Link href={`/properties/${slug}#availability-picker`}>
            <Btn variant="primary">Pick different dates</Btn>
          </Link>
        </>
      )}

      {!checkingAvailability && available && breakdown && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <SummaryRow
              label={`${symbol}${(breakdown.pricePerNightCents / 100).toFixed(0)} × ${nights} ${nights === 1 ? 'night' : 'nights'}`}
              value={`${symbol}${(breakdown.nightsTotalCents / 100).toFixed(0)}`}
            />
            {breakdown.cleaningFeeCents > 0 && (
              <SummaryRow
                label="Cleaning"
                value={`${symbol}${(breakdown.cleaningFeeCents / 100).toFixed(0)}`}
              />
            )}
            <SummaryRow label="Tourist tax" value="—" />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '18px 0',
              borderTop: '1px dashed var(--cosy-line)',
              marginBottom: 24,
            }}
          >
            <Display size={20}>Total</Display>
            <Display size={32} italic>
              {symbol}
              {(breakdown.totalCents / 100).toFixed(0)}
            </Display>
          </div>

          <Body size={12} color="var(--cosy-ink-mute)" style={{ marginBottom: 24 }}>
            You pay directly — no agency fees. Georgia confirms within a few hours.
          </Body>

          <Btn variant="primary" wide onClick={onContinue}>
            Continue to your details
          </Btn>
        </>
      )}
    </Card>
  )
}

// ─── Step 2 · Guest details ──────────────────────────────────────────

function StepDetails({
  guest,
  setGuest,
  maxGuests,
  error,
  pending,
  onBack,
  onSubmit,
}: {
  guest: GuestDetails
  setGuest: (g: GuestDetails) => void
  maxGuests: number
  error: string
  pending: boolean
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <BackButton onClick={onBack} />
        <Eyebrow>Step two</Eyebrow>
      </div>
      <Display size={34} italic style={{ marginBottom: 8 }}>
        Who&apos;s coming?
      </Display>
      <Body color="var(--cosy-ink-mute)" style={{ marginBottom: 28 }}>
        Georgia needs a few details to confirm your stay and meet the Greek tourism registry
        requirements.
      </Body>

      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gap: 16 }}>
          <Field
            id="guestName"
            label="Full name"
            value={guest.guestName}
            onChange={(v) => setGuest({ ...guest, guestName: v })}
            required
            minLength={2}
            autoFocus
          />
          <Field
            id="guestEmail"
            label="Email"
            type="email"
            value={guest.guestEmail}
            onChange={(v) => setGuest({ ...guest, guestEmail: v })}
            required
          />
          <Row2>
            <Field
              id="guestPhone"
              label="Phone"
              type="tel"
              value={guest.guestPhone}
              onChange={(v) => setGuest({ ...guest, guestPhone: v })}
              required
              minLength={5}
            />
            <NumberField
              id="guestCount"
              label="Guests"
              value={guest.guestCount}
              min={1}
              max={maxGuests}
              onChange={(v) => setGuest({ ...guest, guestCount: v })}
            />
          </Row2>

          <div
            style={{
              marginTop: 12,
              paddingTop: 24,
              borderTop: '1px solid var(--cosy-line-soft)',
            }}
          >
            <Chip tone="neutral" style={{ marginBottom: 12 }}>
              Required by Greek law
            </Chip>
            <Body size={12} color="var(--cosy-ink-mute)" style={{ marginBottom: 20 }}>
              Guest details are submitted to the national registry. Used once — not stored
              beyond your stay.
            </Body>
          </div>

          <Row2>
            <SelectField
              id="guestIdType"
              label="ID type"
              value={guest.guestIdType}
              onChange={(v) =>
                setGuest({ ...guest, guestIdType: v as 'PASSPORT' | 'NATIONAL_ID' })
              }
              options={[
                { value: 'PASSPORT', label: 'Passport' },
                { value: 'NATIONAL_ID', label: 'National ID' },
              ]}
            />
            <Field
              id="guestIdNumber"
              label={guest.guestIdType === 'PASSPORT' ? 'Passport number' : 'ID number'}
              value={guest.guestIdNumber}
              onChange={(v) => setGuest({ ...guest, guestIdNumber: v })}
              required
              minLength={3}
            />
          </Row2>

          <Row2>
            <SelectField
              id="guestNationality"
              label="Nationality"
              value={guest.guestNationality}
              onChange={(v) => setGuest({ ...guest, guestNationality: v })}
              options={[
                { value: '', label: 'Select…' },
                ...countries.map((c) => ({ value: c.code, label: c.name })),
              ]}
              required
            />
            <SelectField
              id="guestResidenceCountry"
              label="Country of residence"
              value={guest.guestResidenceCountry}
              onChange={(v) => setGuest({ ...guest, guestResidenceCountry: v })}
              options={[
                { value: '', label: 'Select…' },
                ...countries.map((c) => ({ value: c.code, label: c.name })),
              ]}
              required
            />
          </Row2>

          <Field
            id="guestDateOfBirth"
            label="Date of birth"
            type="date"
            value={guest.guestDateOfBirth}
            onChange={(v) => setGuest({ ...guest, guestDateOfBirth: v })}
            max={today}
            required
          />
        </div>

        {error && (
          <Body
            size={13}
            color="#9b2c2c"
            style={{ marginTop: 18, padding: '10px 14px', background: '#fbeaea', borderRadius: 'var(--cosy-r1)' }}
          >
            {error}
          </Body>
        )}

        <div style={{ marginTop: 28 }}>
          <Btn variant="primary" wide type="submit" onClick={pending ? undefined : undefined}>
            {pending ? 'Creating booking…' : 'Continue to payment'}
          </Btn>
        </div>
      </form>
    </Card>
  )
}

// ─── Step 3 · Payment ──────────────────────────────────────────

function StepPayment({
  bookingRef,
  guestEmail,
  totalCents,
  symbol,
  onBack,
}: {
  bookingRef: string
  guestEmail: string
  totalCents: number
  symbol: string
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [paying, setPaying] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setError('')
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation/${bookingRef}?email=${encodeURIComponent(guestEmail)}`,
      },
    })
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
    }
    setPaying(false)
  }

  // Silence the "router declared but not used" warning — kept for future redirects
  void router

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <BackButton onClick={onBack} />
        <Eyebrow>Step three</Eyebrow>
      </div>
      <Display size={34} italic style={{ marginBottom: 8 }}>
        Payment
      </Display>
      <Body color="var(--cosy-ink-mute)" style={{ marginBottom: 8 }}>
        Secure payment by Stripe. You&apos;ll be redirected to your confirmation when done.
      </Body>
      <Body size={11} color="var(--cosy-ink-mute)" style={{ marginBottom: 24 }}>
        Reference · {bookingRef}
      </Body>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: '20px 20px',
            border: '1px solid var(--cosy-line)',
            borderRadius: 'var(--cosy-r2)',
            marginBottom: 20,
          }}
        >
          <PaymentElement />
        </div>

        {error && (
          <Body
            size={13}
            color="#9b2c2c"
            style={{ marginBottom: 16, padding: '10px 14px', background: '#fbeaea', borderRadius: 'var(--cosy-r1)' }}
          >
            {error}
          </Body>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4 }}>
              Total
            </Label>
            <Display size={28} italic>
              {symbol}
              {(totalCents / 100).toFixed(0)}
            </Display>
          </div>
          <Btn variant="primary" type="submit">
            {paying ? 'Processing…' : 'Pay now'}
          </Btn>
        </div>
      </form>
    </Card>
  )
}

// ─── Right column summary ──────────────────────────────────────────

function BookingSummary({
  propertyTitle,
  propertyName,
  propertyAddress,
  propertyImage,
  propertyImageAlt,
  checkIn,
  checkOut,
  nights,
  guests,
  pricePerNightCents,
  cleaningFeeCents,
  totalCents,
  symbol,
}: {
  propertyTitle: string
  propertyName: string
  propertyAddress: string
  propertyImage: string | null
  propertyImageAlt: string
  checkIn: string
  checkOut: string
  nights: number | null
  guests: number
  pricePerNightCents: number
  cleaningFeeCents: number
  totalCents: number | null
  symbol: string
}) {
  return (
    <Reveal delay={120} dy={30}>
      <div
        style={{
          background: 'var(--cosy-paper)',
          borderRadius: 'var(--cosy-r3)',
          overflow: 'hidden',
          boxShadow: '0 12px 40px -16px rgba(31,31,30,.14)',
          position: 'sticky',
          top: 30,
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '16/10' }}>
          <Photo
            src={propertyImage}
            alt={propertyImageAlt}
            tone="warm"
            fill
            radius={0}
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
          <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
            <Chip
              tone="cream"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                border: 'none',
              }}
            >
              {propertyTitle}
            </Chip>
          </div>
        </div>
        <div style={{ padding: '24px 26px 28px' }}>
          <Display size={22} italic style={{ marginBottom: 4 }}>
            {propertyName.replace(/^Georgia's /, '')}
          </Display>
          <Body size={12} color="var(--cosy-ink-mute)" style={{ marginBottom: 22 }}>
            {propertyAddress}
          </Body>

          <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
            <Pair label="Arrival" value={formatLong(checkIn)} />
            <Pair label="Departure" value={formatLong(checkOut)} />
            <Pair
              label="Length"
              value={nights ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : '—'}
            />
            <Pair label="Guests" value={`${guests}`} />
          </div>

          <div
            style={{
              borderTop: '1px solid var(--cosy-line-soft)',
              paddingTop: 18,
              marginBottom: 18,
              display: 'grid',
              gap: 6,
            }}
          >
            <SummaryRow
              label={
                nights
                  ? `${symbol}${(pricePerNightCents / 100).toFixed(0)} × ${nights}`
                  : `${symbol}${(pricePerNightCents / 100).toFixed(0)} / night`
              }
              value={
                nights
                  ? `${symbol}${((pricePerNightCents * nights) / 100).toFixed(0)}`
                  : '—'
              }
            />
            {cleaningFeeCents > 0 && (
              <SummaryRow
                label="Cleaning"
                value={`${symbol}${(cleaningFeeCents / 100).toFixed(0)}`}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: 14,
              borderTop: '1px dashed var(--cosy-line)',
            }}
          >
            <Display size={18}>Total</Display>
            <Display size={26} italic>
              {totalCents != null ? `${symbol}${(totalCents / 100).toFixed(0)}` : '—'}
            </Display>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

// ─── Small pieces ──────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Body size={13} color="var(--cosy-ink-mute)">
        {label}
      </Body>
      <Body size={13} color="var(--cosy-ink)">
        {value}
      </Body>
    </div>
  )
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Label color="var(--cosy-ink-mute)">{label}</Label>
      <Body size={13} color="var(--cosy-ink)" weight={500}>
        {value}
      </Body>
    </div>
  )
}

function Row2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {children}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--cosy-r-full)',
        border: '1px solid var(--cosy-line)',
        background: 'transparent',
        color: 'var(--cosy-ink)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
      }}
    >
      ←
    </button>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--cosy-r2)',
    border: '1px solid var(--cosy-line)',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    color: 'var(--cosy-ink)',
    outline: 'none',
    background: 'var(--cosy-paper)',
    boxSizing: 'border-box',
  }
}

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required,
  minLength,
  max,
  autoFocus,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  minLength?: number
  max?: string
  autoFocus?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', marginBottom: 6 }}
      >
        <Label color="var(--cosy-ink-mute)">{label}</Label>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        max={max}
        autoFocus={autoFocus}
        style={inputStyle()}
      />
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string
  label: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 6 }}>
        <Label color="var(--cosy-ink-mute)">{label}</Label>
      </label>
      <input
        id={id}
        name={id}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min ?? 1, parseInt(e.target.value, 10) || 1))}
        required
        style={inputStyle()}
      />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 6 }}>
        <Label color="var(--cosy-ink-mute)">{label}</Label>
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ ...inputStyle(), appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--cosy-ink-mute) 50%), linear-gradient(135deg, var(--cosy-ink-mute) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 18px) 50%, calc(100% - 13px) 50%', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
