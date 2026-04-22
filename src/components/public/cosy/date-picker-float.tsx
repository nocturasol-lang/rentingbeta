'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Btn, Label, Reveal } from './primitives'

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

export function FloatingDatePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initCheckIn = searchParams.get('checkIn')
  const initCheckOut = searchParams.get('checkOut')
  const initGuests = searchParams.get('guests')

  const today = new Date()
  const defaultIn = initCheckIn ? new Date(initCheckIn) : addDays(today, 7)
  const defaultOut = initCheckOut ? new Date(initCheckOut) : addDays(today, 11)

  const [checkIn, setCheckIn] = React.useState(defaultIn)
  const [checkOut, setCheckOut] = React.useState(defaultOut)
  const [guests, setGuests] = React.useState(initGuests ? Number(initGuests) : 2)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('checkIn', toISODate(checkIn))
    params.set('checkOut', toISODate(checkOut))
    params.set('guests', String(guests))
    router.push(`/?${params.toString()}#apartments`)
  }

  return (
    <div style={{ padding: '0 72px', marginTop: -44, position: 'relative', zIndex: 5 }}>
      <Reveal delay={200}>
        <form
          onSubmit={onSubmit}
          style={{
            background: 'var(--cosy-paper)',
            borderRadius: 'var(--cosy-r3)',
            padding: '10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 4,
            maxWidth: 820,
            margin: '0 auto',
            boxShadow:
              '0 20px 60px -20px rgba(31,31,30,.35), 0 4px 12px rgba(31,31,30,.08)',
          }}
        >
          <DateField
            label="Arrival"
            value={checkIn}
            onChange={(v) => {
              setCheckIn(v)
              if (v >= checkOut) setCheckOut(addDays(v, 4))
            }}
            min={toISODate(today)}
          />
          <DateField
            label="Departure"
            value={checkOut}
            onChange={setCheckOut}
            min={toISODate(addDays(checkIn, 1))}
          />
          <GuestsField value={guests} onChange={setGuests} />
          <Btn
            variant="primary"
            type="submit"
            style={{ margin: 4, padding: '0 28px' }}
          >
            Check
          </Btn>
        </form>
      </Reveal>
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: Date
  onChange: (d: Date) => void
  min?: string
}) {
  return (
    <label
      style={{
        padding: '14px 20px',
        cursor: 'text',
        position: 'relative',
        display: 'block',
      }}
    >
      <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4, fontSize: 9 }}>
        {label}
      </Label>
      <div
        className="cosy-display"
        style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--cosy-ink)' }}
      >
        {formatDisplay(value)}
      </div>
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

function GuestsField({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label style={{ padding: '14px 20px', cursor: 'pointer', position: 'relative', display: 'block' }}>
      <Label color="var(--cosy-ink-mute)" style={{ marginBottom: 4, fontSize: 9 }}>
        Guests
      </Label>
      <div
        className="cosy-display"
        style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--cosy-ink)' }}
      >
        {value} {value === 1 ? 'adult' : 'adults'}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
          appearance: 'none',
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
