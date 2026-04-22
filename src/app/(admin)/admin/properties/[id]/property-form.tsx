'use client'

import * as React from 'react'
import { amenityList, amenityCategories } from '@/lib/amenities'
import { Panel, PillButton } from '@/components/admin/cosy/primitives'

interface PropertyFormProps {
  property: {
    name: string
    slug: string
    description: string
    address: string
    size: number | null
    pricePerNightCents: number
    cleaningFeeCents: number
    maxGuests: number
    bedrooms: number
    bathrooms: number
    amenities: string[]
    licenseNumber: string | null
    checkInFrom: string
    checkInTo: string
    checkOutFrom: string
    checkOutTo: string
    minNights: number
    isActive: boolean
  }
  onSubmit: (data: Record<string, unknown>) => void
  isPending: boolean
  error?: string
}

export function PropertyForm({ property, onSubmit, isPending, error }: PropertyFormProps) {
  const [form, setForm] = React.useState({
    name: property.name,
    slug: property.slug,
    description: property.description,
    address: property.address,
    size: property.size ?? 0,
    pricePerNightCents: property.pricePerNightCents,
    cleaningFeeCents: property.cleaningFeeCents,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    amenities: property.amenities,
    licenseNumber: property.licenseNumber ?? '',
    checkInFrom: property.checkInFrom,
    checkInTo: property.checkInTo,
    checkOutFrom: property.checkOutFrom,
    checkOutTo: property.checkOutTo,
    minNights: property.minNights,
    isActive: property.isActive,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name: form.name,
      slug: form.slug,
      description: form.description,
      address: form.address,
      size: form.size || undefined,
      pricePerNightCents: form.pricePerNightCents,
      cleaningFeeCents: form.cleaningFeeCents,
      maxGuests: form.maxGuests,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      amenities: form.amenities,
      licenseNumber: form.licenseNumber || null,
      checkInFrom: form.checkInFrom,
      checkInTo: form.checkInTo,
      checkOutFrom: form.checkOutFrom,
      checkOutTo: form.checkOutTo,
      minNights: form.minNights,
      isActive: form.isActive,
    })
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel>
        <FieldGroupTitle>Basics</FieldGroupTitle>
        <FieldRow cols={2}>
          <Field label="Name">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Slug" hint="URL — letters, numbers, dashes">
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              pattern="[a-z0-9-]+"
              style={inputStyle}
            />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Description">
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>
        </FieldRow>
        <FieldRow cols={2}>
          <Field label="Address">
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Licence number" hint="Greek tourism registry id">
            <input
              type="text"
              value={form.licenseNumber}
              onChange={(e) => set('licenseNumber', e.target.value)}
              style={inputStyle}
            />
          </Field>
        </FieldRow>
      </Panel>

      <Panel>
        <FieldGroupTitle>Layout</FieldGroupTitle>
        <FieldRow cols={4}>
          <Field label="Bedrooms">
            <input
              type="number"
              min={1}
              value={form.bedrooms}
              onChange={(e) => set('bedrooms', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              min={1}
              value={form.bathrooms}
              onChange={(e) => set('bathrooms', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </Field>
          <Field label="Max guests">
            <input
              type="number"
              min={1}
              value={form.maxGuests}
              onChange={(e) => set('maxGuests', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </Field>
          <Field label="Size (m²)">
            <input
              type="number"
              min={0}
              value={form.size}
              onChange={(e) => set('size', parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
          </Field>
        </FieldRow>
      </Panel>

      <Panel>
        <FieldGroupTitle>Pricing</FieldGroupTitle>
        <FieldRow cols={3}>
          <Field label="Rate / night (€)">
            <MoneyInput
              cents={form.pricePerNightCents}
              onChange={(c) => set('pricePerNightCents', c)}
            />
          </Field>
          <Field label="Cleaning fee (€)">
            <MoneyInput
              cents={form.cleaningFeeCents}
              onChange={(c) => set('cleaningFeeCents', c)}
            />
          </Field>
          <Field label="Minimum nights">
            <input
              type="number"
              min={1}
              value={form.minNights}
              onChange={(e) => set('minNights', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </Field>
        </FieldRow>
      </Panel>

      <Panel>
        <FieldGroupTitle>Check-in / check-out</FieldGroupTitle>
        <FieldRow cols={4}>
          <Field label="Check-in from">
            <input
              type="text"
              value={form.checkInFrom}
              onChange={(e) => set('checkInFrom', e.target.value)}
              placeholder="14:00"
              style={inputStyle}
            />
          </Field>
          <Field label="Check-in to">
            <input
              type="text"
              value={form.checkInTo}
              onChange={(e) => set('checkInTo', e.target.value)}
              placeholder="20:00"
              style={inputStyle}
            />
          </Field>
          <Field label="Check-out from">
            <input
              type="text"
              value={form.checkOutFrom}
              onChange={(e) => set('checkOutFrom', e.target.value)}
              placeholder="08:00"
              style={inputStyle}
            />
          </Field>
          <Field label="Check-out to">
            <input
              type="text"
              value={form.checkOutTo}
              onChange={(e) => set('checkOutTo', e.target.value)}
              placeholder="10:00"
              style={inputStyle}
            />
          </Field>
        </FieldRow>
      </Panel>

      <Panel>
        <FieldGroupTitle>
          Amenities · {form.amenities.length} selected
        </FieldGroupTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {amenityCategories.map((category) => (
            <div key={category}>
              <div
                className="cosy-sans"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                  color: 'var(--cosy-ink-mute)',
                  marginBottom: 8,
                }}
              >
                {category}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 8,
                }}
              >
                {amenityList
                  .filter((a) => a.category === category)
                  .map(({ key, label }) => {
                    const checked = form.amenities.includes(key)
                    return (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 14px',
                          borderRadius: 'var(--cosy-r-full)',
                          border: checked
                            ? '1px solid var(--cosy-ink)'
                            : '1px solid var(--cosy-line)',
                          background: checked
                            ? 'var(--cosy-peach-soft)'
                            : 'var(--cosy-paper)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 12,
                          color: 'var(--cosy-ink)',
                          transition: 'background 140ms, border-color 140ms',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? form.amenities.filter((a) => a !== key)
                              : [...form.amenities, key]
                            set('amenities', next)
                          }}
                          style={{ accentColor: 'var(--cosy-ink)' }}
                        />
                        <span>{label}</span>
                      </label>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              style={{ accentColor: 'var(--cosy-ink)' }}
            />
            <span
              className="cosy-sans"
              style={{ fontSize: 13, color: 'var(--cosy-ink)' }}
            >
              Published — visible to guests
            </span>
          </label>

          {error && (
            <span
              className="cosy-sans"
              style={{
                fontSize: 12,
                color: '#9b2c2c',
                background: '#fbeaea',
                padding: '6px 12px',
                borderRadius: 'var(--cosy-r1)',
              }}
            >
              {error}
            </span>
          )}

          <PillButton variant="solid" type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save changes'}
          </PillButton>
        </div>
      </Panel>
    </form>
  )
}

// ─── Inputs ──────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--cosy-r2)',
  border: '1px solid var(--cosy-line)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--cosy-ink)',
  outline: 'none',
  background: 'var(--cosy-paper)',
  boxSizing: 'border-box',
}

function FieldGroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="cosy-sans"
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: 'var(--cosy-ink-mute)',
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  )
}

function FieldRow({
  children,
  cols = 1,
}: {
  children: React.ReactNode
  cols?: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 14,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="cosy-sans"
        style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: 'var(--cosy-ink-mute)',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div
          className="cosy-sans"
          style={{ fontSize: 10, color: 'var(--cosy-ink-mute)', marginTop: 4 }}
        >
          {hint}
        </div>
      )}
    </div>
  )
}

function MoneyInput({
  cents,
  onChange,
}: {
  cents: number
  onChange: (cents: number) => void
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        className="cosy-sans"
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--cosy-ink-mute)',
          fontSize: 13,
          pointerEvents: 'none',
        }}
      >
        €
      </span>
      <input
        type="number"
        min={0}
        value={Math.round(cents / 100)}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          onChange(Number.isNaN(v) || v < 0 ? 0 : v * 100)
        }}
        style={{ ...inputStyle, paddingLeft: 28 }}
      />
    </div>
  )
}
