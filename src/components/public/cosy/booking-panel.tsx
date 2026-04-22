'use client'

import * as React from 'react'
import Link from 'next/link'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { trpc } from '@/lib/trpc'
import { Body, Btn, Display, Label, Reveal } from './primitives'

type BlockedRange = { checkIn: string; checkOut: string; source: string }

function formatDisplay(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10))
  return new Date(y, m - 1, d)
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function rangeOverlapsBlocked(
  checkIn: Date,
  checkOut: Date,
  blocked: BlockedRange[]
): boolean {
  return blocked.some((r) => {
    const rStart = parseISO(r.checkIn)
    const rEnd = parseISO(r.checkOut)
    return checkIn < rEnd && rStart < checkOut
  })
}

export function BookingPanel({
  propertyId,
  slug,
  pricePerNightCents,
  cleaningFeeCents,
  currency,
  minNights,
  blockedRanges,
}: {
  propertyId: string
  slug: string
  pricePerNightCents: number
  cleaningFeeCents: number
  currency: string
  minNights: number
  blockedRanges: BlockedRange[]
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const defaultIn = addDays(today, 14)
  const defaultOut = addDays(defaultIn, Math.max(minNights, 3))

  const [checkIn, setCheckIn] = React.useState(defaultIn)
  const [checkOut, setCheckOut] = React.useState(defaultOut)
  const [guests, setGuests] = React.useState(2)

  const nights = differenceInCalendarDays(checkOut, checkIn)
  const validNights = nights >= minNights
  const hasOverlap = validNights && rangeOverlapsBlocked(checkIn, checkOut, blockedRanges)
  const canCheck = validNights && !hasOverlap

  const { data: availability, isLoading } = trpc.availability.check.useQuery(
    {
      propertyId,
      checkIn: toISODate(checkIn),
      checkOut: toISODate(checkOut),
    },
    { enabled: canCheck }
  )

  const symbol = currency === 'EUR' ? '€' : currency
  const priceDisplay = Math.round(pricePerNightCents / 100)
  const totalCents = availability?.breakdown?.totalCents ?? null
  const isAvailable = availability?.available === true

  const bookHref =
    isAvailable && canCheck
      ? `/book/${slug}?checkIn=${toISODate(checkIn)}&checkOut=${toISODate(checkOut)}&guests=${guests}`
      : null

  return (
    <Reveal dy={30}>
      <div
        id="availability-picker"
        style={{
          background: 'var(--cosy-paper)',
          borderRadius: 'var(--cosy-r3)',
          overflow: 'hidden',
          boxShadow:
            '0 12px 40px -16px rgba(31,31,30,.18), 0 2px 8px rgba(31,31,30,.06)',
          position: 'sticky',
          top: 30,
        }}
      >
        <div style={{ padding: '26px 28px 20px', background: 'var(--cosy-peach)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Display size={32} italic color="var(--cosy-ink)">
              {symbol}
              {priceDisplay}
            </Display>
            <Body size={13} color="var(--cosy-ink-mute)">
              per night
            </Body>
          </div>
          <Body size={12} color="var(--cosy-ink-soft)">
            Direct rate — no agency fees.
          </Body>
        </div>
        <div style={{ padding: '20px 28px 28px' }}>
          <div
            style={{
              border: '1px solid var(--cosy-line)',
              borderRadius: 'var(--cosy-r2)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <DateCell
              label="Arrival"
              value={checkIn}
              min={toISODate(today)}
              borderRight
              onChange={(v) => {
                setCheckIn(v)
                if (v >= checkOut) setCheckOut(addDays(v, Math.max(minNights, 2)))
              }}
            />
            <DateCell
              label="Departure"
              value={checkOut}
              min={toISODate(addDays(checkIn, Math.max(minNights, 1)))}
              onChange={setCheckOut}
            />
          </div>
          <GuestsCell value={guests} onChange={setGuests} />

          {bookHref ? (
            <Link href={bookHref} style={{ display: 'block', marginTop: 4 }}>
              <Btn variant="primary" wide>
                Request these dates
              </Btn>
            </Link>
          ) : (
            <Btn
              variant="primary"
              wide
              style={{ opacity: 0.6, cursor: 'not-allowed', marginTop: 4 }}
            >
              {!validNights
                ? `Minimum ${minNights} night${minNights > 1 ? 's' : ''}`
                : hasOverlap
                ? 'Dates unavailable'
                : availability?.available === false
                ? 'Dates unavailable'
                : 'Check dates above'}
            </Btn>
          )}

          <Body
            size={11}
            color="var(--cosy-ink-mute)"
            style={{ marginTop: 12, textAlign: 'center' }}
          >
            Georgia confirms within a few hours.
          </Body>

          {/* Price breakdown */}
          {canCheck && (
            <div
              style={{
                paddingTop: 22,
                marginTop: 22,
                borderTop: '1px solid var(--cosy-line-soft)',
              }}
            >
              {isLoading ? (
                <Body size={12} color="var(--cosy-ink-mute)">
                  Checking availability…
                </Body>
              ) : availability?.available === false ? (
                <Body size={12} color="var(--cosy-ink-soft)">
                  These dates are blocked on at least one channel.
                </Body>
              ) : availability?.breakdown ? (
                <>
                  <Row
                    label={`${symbol}${priceDisplay} × ${nights} night${nights > 1 ? 's' : ''}`}
                    value={`${symbol}${(availability.breakdown.nightsTotalCents / 100).toFixed(0)}`}
                  />
                  {cleaningFeeCents > 0 && (
                    <Row label="Cleaning" value={`${symbol}${(cleaningFeeCents / 100).toFixed(0)}`} />
                  )}
                  <Row label="Tourist tax" value="—" />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      paddingTop: 14,
                      marginTop: 10,
                      borderTop: '1px dashed var(--cosy-line)',
                    }}
                  >
                    <Display size={17}>Total</Display>
                    <Display size={24} italic>
                      {symbol}
                      {totalCents != null ? (totalCents / 100).toFixed(0) : '—'}
                    </Display>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <Body size={12} color="var(--cosy-ink-mute)">
        {label}
      </Body>
      <Body size={12} color="var(--cosy-ink)">
        {value}
      </Body>
    </div>
  )
}

function DateCell({
  label,
  value,
  onChange,
  min,
  borderRight,
}: {
  label: string
  value: Date
  onChange: (d: Date) => void
  min?: string
  borderRight?: boolean
}) {
  return (
    <label
      style={{
        padding: '14px 16px',
        borderRight: borderRight ? '1px solid var(--cosy-line)' : undefined,
        cursor: 'pointer',
        position: 'relative',
        display: 'block',
      }}
    >
      <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4, fontSize: 9 }}>
        {label}
      </Label>
      <Display size={17} italic>
        {formatDisplay(value)}
      </Display>
      <input
        type="date"
        value={toISODate(value)}
        min={min}
        onChange={(e) => {
          if (e.target.value) onChange(parseISODate(e.target.value))
        }}
        onClick={(e) => {
          const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void }
          el.showPicker?.()
        }}
        onFocus={(e) => {
          const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void }
          el.showPicker?.()
        }}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
        }}
      />
    </label>
  )
}

function GuestsCell({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label
      style={{
        border: '1px solid var(--cosy-line)',
        borderRadius: 'var(--cosy-r2)',
        padding: '14px 16px',
        marginBottom: 16,
        display: 'block',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4, fontSize: 9 }}>
        Guests
      </Label>
      <Display size={17} italic>
        {value} {value === 1 ? 'adult' : 'adults'}
      </Display>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  )
}
