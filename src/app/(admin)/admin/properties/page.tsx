'use client'

import * as React from 'react'
import Link from 'next/link'
import { Copy, RefreshCw, Share2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  SyncStatusTone,
} from '@/components/admin/cosy/primitives'

type Property = {
  id: string
  name: string
  slug: string
  pricePerNightCents: number
  cleaningFeeCents: number
  bedrooms: number
  bathrooms: number
  maxGuests: number
  size: number | null
  isActive: boolean
  icalUrl: string | null
  icalSyncStatus: string
  icalLastSyncedAt: Date | string | null
  _count: { bookings: number; externalBlocks: number }
}

function extractTitle(name: string): string {
  const match = name.match(/#(\d+)/)
  return match ? `Cosy Rooms #${match[1]}` : name
}

export default function PropertiesPage() {
  const { data: properties, isLoading, refetch } = trpc.admin.properties.list.useQuery()

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        eyebrow="Inventory"
        title="Apartments"
        subtitle="Rates, cleaning, iCal — adjust without leaving the list."
      />

      {isLoading ? (
        <Panel>
          <div
            className="cosy-sans"
            style={{ fontSize: 13, color: 'var(--cosy-ink-mute)' }}
          >
            Loading…
          </div>
        </Panel>
      ) : !properties || properties.length === 0 ? (
        <Panel>
          <EmptyState title="No properties yet" body="Seed the database or add one manually." />
        </Panel>
      ) : (
        <Panel padding={0}>
          <TableHeaderRow />
          {properties.map((property) => (
            <PropertyRow
              key={property.id}
              property={property as Property}
              onMutated={() => refetch()}
            />
          ))}
        </Panel>
      )}
    </div>
  )
}

function TableHeaderRow() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) 110px 110px 150px 160px 40px',
        gap: 16,
        padding: '14px 26px',
        borderBottom: '1px solid var(--cosy-line)',
        background: 'var(--cosy-peach-soft)',
      }}
    >
      {['Apartment', 'Rate /night', 'Cleaning', 'Bookings', 'iCal import', ''].map((h) => (
        <div
          key={h}
          className="cosy-sans"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            color: 'var(--cosy-ink-mute)',
          }}
        >
          {h}
        </div>
      ))}
    </div>
  )
}

function PropertyRow({
  property,
  onMutated,
}: {
  property: Property
  onMutated: () => void
}) {
  const title = extractTitle(property.name)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) 110px 110px 150px 160px 40px',
        gap: 16,
        alignItems: 'center',
        padding: '18px 26px',
        borderBottom: '1px solid var(--cosy-line-soft)',
      }}
    >
      {/* Apartment */}
      <div style={{ minWidth: 0 }}>
        <Link
          href={`/admin/properties/${property.id}`}
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div
            className="cosy-display"
            style={{
              fontStyle: 'italic',
              fontSize: 19,
              color: 'var(--cosy-ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          <div
            className="cosy-sans"
            style={{
              fontSize: 11,
              color: 'var(--cosy-ink-mute)',
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {property.bedrooms} bed · {property.bathrooms} bath · up to {property.maxGuests}
            {property.size ? ` · ${property.size} m²` : ''}
            {!property.isActive && ' · Inactive'}
          </div>
        </Link>
      </div>

      {/* Rate — inline edit */}
      <InlineMoneyField
        valueCents={property.pricePerNightCents}
        field="pricePerNightCents"
        propertyId={property.id}
        onSaved={onMutated}
      />

      {/* Cleaning — inline edit */}
      <InlineMoneyField
        valueCents={property.cleaningFeeCents}
        field="cleaningFeeCents"
        propertyId={property.id}
        onSaved={onMutated}
      />

      {/* Bookings */}
      <div>
        <div
          className="cosy-display"
          style={{ fontStyle: 'italic', fontSize: 18, color: 'var(--cosy-ink)' }}
        >
          {property._count.bookings}
        </div>
        <div
          className="cosy-sans"
          style={{ fontSize: 10, color: 'var(--cosy-ink-mute)', marginTop: 2 }}
        >
          {property._count.externalBlocks} external blocks
        </div>
      </div>

      {/* iCal sync */}
      <IcalCell property={property} onMutated={onMutated} />

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ShareButton propertyId={property.id} />
      </div>
    </div>
  )
}

function InlineMoneyField({
  valueCents,
  field,
  propertyId,
  onSaved,
}: {
  valueCents: number
  field: 'pricePerNightCents' | 'cleaningFeeCents'
  propertyId: string
  onSaved: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState(String(Math.round(valueCents / 100)))
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  React.useEffect(() => {
    if (!editing) setValue(String(Math.round(valueCents / 100)))
  }, [valueCents, editing])

  const mutation = trpc.admin.properties.update.useMutation({
    onSuccess: () => {
      setStatus('saved')
      window.setTimeout(() => setStatus('idle'), 1600)
      setEditing(false)
      onSaved()
    },
    onError: () => setStatus('error'),
  })

  function commit() {
    const asNumber = parseInt(value, 10)
    if (Number.isNaN(asNumber) || asNumber < 0) {
      setValue(String(Math.round(valueCents / 100)))
      setEditing(false)
      return
    }
    const cents = asNumber * 100
    if (cents === valueCents) {
      setEditing(false)
      return
    }
    setStatus('saving')
    mutation.mutate({
      id: propertyId,
      [field]: cents,
    } as Parameters<typeof mutation.mutate>[0])
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="cosy-display" style={{ fontStyle: 'italic', color: 'var(--cosy-ink-mute)' }}>
          €
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setValue(String(Math.round(valueCents / 100)))
              setEditing(false)
            }
          }}
          autoFocus
          className="cosy-display"
          style={{
            width: '100%',
            minWidth: 60,
            padding: '4px 6px',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--cosy-ink)',
            border: '1px solid var(--cosy-ink)',
            borderRadius: 'var(--cosy-r1)',
            background: 'var(--cosy-paper)',
            outline: 'none',
          }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
      }}
    >
      <span
        className="cosy-display"
        style={{
          fontStyle: 'italic',
          fontSize: 20,
          color: 'var(--cosy-ink)',
        }}
      >
        €{Math.round(valueCents / 100)}
      </span>
      {status === 'saving' && (
        <span
          className="cosy-sans"
          style={{ fontSize: 10, color: 'var(--cosy-ink-mute)' }}
        >
          saving…
        </span>
      )}
      {status === 'saved' && (
        <span className="cosy-sans" style={{ fontSize: 10, color: '#3f7a4f' }}>
          saved
        </span>
      )}
      {status === 'error' && (
        <span className="cosy-sans" style={{ fontSize: 10, color: '#9b2c2c' }}>
          error
        </span>
      )}
    </button>
  )
}

function IcalCell({
  property,
  onMutated,
}: {
  property: Property
  onMutated: () => void
}) {
  const syncMutation = trpc.admin.ical.sync.useMutation({
    onSuccess: () => {
      window.setTimeout(() => onMutated(), 1500)
    },
  })
  if (!property.icalUrl) {
    return (
      <div
        className="cosy-sans"
        style={{ fontSize: 11, color: 'var(--cosy-ink-mute)' }}
      >
        Not configured
      </div>
    )
  }
  const lastSync = property.icalLastSyncedAt
    ? new Date(property.icalLastSyncedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusPill tone={SyncStatusTone(property.icalSyncStatus)}>
          {property.icalSyncStatus}
        </StatusPill>
        <button
          type="button"
          onClick={() => syncMutation.mutate({ propertyId: property.id })}
          disabled={syncMutation.isPending}
          aria-label="Sync iCal"
          style={{
            width: 26,
            height: 26,
            borderRadius: 'var(--cosy-r-full)',
            border: '1px solid var(--cosy-line)',
            background: 'var(--cosy-paper)',
            color: 'var(--cosy-ink-mute)',
            cursor: syncMutation.isPending ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw
            className="h-3 w-3"
            style={{ animation: syncMutation.isPending ? 'spin 1s linear infinite' : undefined }}
          />
        </button>
      </div>
      {lastSync && (
        <div
          className="cosy-sans"
          style={{ fontSize: 10, color: 'var(--cosy-ink-mute)' }}
        >
          Synced {lastSync}
        </div>
      )}
    </div>
  )
}

function ShareButton({ propertyId }: { propertyId: string }) {
  const [copied, setCopied] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        const url = `${window.location.origin}/api/ical/${propertyId}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Copy iCal export URL"
      title="Copy iCal export URL"
      style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--cosy-r-full)',
        border: '1px solid var(--cosy-line)',
        background: hover ? 'var(--cosy-peach-soft)' : 'var(--cosy-paper)',
        color: 'var(--cosy-ink-mute)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 140ms',
      }}
    >
      {copied ? <Copy className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
    </button>
  )
}
