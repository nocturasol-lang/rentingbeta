'use client'

import * as React from 'react'
import { CheckCircle2, Copy, RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import {
  Panel,
  PillButton,
  StatusPill,
  SyncStatusTone,
} from '@/components/admin/cosy/primitives'

interface ChannelsPanelProps {
  propertyId: string
  icalUrl: string | null
  icalSyncStatus: string
  icalLastSyncedAt: Date | string | null
  externalBlockCount: number
  platformFeePercent: number
  onUpdate: () => void
}

export function ChannelsPanel({
  propertyId,
  icalUrl,
  icalSyncStatus,
  icalLastSyncedAt,
  externalBlockCount,
  platformFeePercent,
  onUpdate,
}: ChannelsPanelProps) {
  const [url, setUrl] = React.useState(icalUrl ?? '')
  const [feePct, setFeePct] = React.useState(platformFeePercent)
  const [urlStatus, setUrlStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [feeStatus, setFeeStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  React.useEffect(() => setUrl(icalUrl ?? ''), [icalUrl])
  React.useEffect(() => setFeePct(platformFeePercent), [platformFeePercent])

  const updateMutation = trpc.admin.properties.update.useMutation()
  const syncMutation = trpc.admin.ical.sync.useMutation({
    onSuccess: () => {
      window.setTimeout(() => onUpdate(), 1500)
    },
  })

  async function saveUrl() {
    if ((icalUrl ?? '') === url.trim()) return
    setUrlStatus('saving')
    try {
      await updateMutation.mutateAsync({
        id: propertyId,
        icalUrl: url.trim() || null,
      })
      setUrlStatus('saved')
      window.setTimeout(() => setUrlStatus('idle'), 1600)
      onUpdate()
    } catch {
      setUrlStatus('error')
    }
  }

  async function saveFee() {
    if (feePct === platformFeePercent) return
    setFeeStatus('saving')
    try {
      await updateMutation.mutateAsync({
        id: propertyId,
        platformFeePercent: feePct,
      })
      setFeeStatus('saved')
      window.setTimeout(() => setFeeStatus('idle'), 1600)
      onUpdate()
    } catch {
      setFeeStatus('error')
    }
  }

  const exportUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/ical/${propertyId}` : ''

  const lastSync = icalLastSyncedAt
    ? new Date(icalLastSyncedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* iCal import */}
      <Panel>
        <SectionHeader
          title="iCal import"
          subtitle="Block dates booked on Booking.com or Airbnb. Paste their iCal URL below."
          badge={
            <StatusPill tone={SyncStatusTone(icalSyncStatus)}>
              {icalSyncStatus}
            </StatusPill>
          }
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 10,
            alignItems: 'stretch',
            marginBottom: 10,
          }}
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={saveUrl}
            placeholder="https://admin.booking.com/…/export.ics"
            className="cosy-sans"
            style={{
              padding: '11px 14px',
              borderRadius: 'var(--cosy-r2)',
              border: '1px solid var(--cosy-line)',
              fontSize: 13,
              color: 'var(--cosy-ink)',
              outline: 'none',
              background: 'var(--cosy-paper)',
            }}
          />
          <PillButton
            variant="solid"
            onClick={() => syncMutation.mutate({ propertyId })}
            disabled={syncMutation.isPending || !icalUrl}
          >
            <RefreshCw
              className="h-3 w-3"
              style={{
                animation: syncMutation.isPending ? 'spin 1s linear infinite' : undefined,
              }}
            />
            Sync now
          </PillButton>
        </div>

        <StatusLine status={urlStatus} />

        <div
          className="cosy-sans"
          style={{
            fontSize: 11,
            color: 'var(--cosy-ink-mute)',
            marginTop: 8,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>
            <strong style={{ color: 'var(--cosy-ink)' }}>{externalBlockCount}</strong> block
            {externalBlockCount === 1 ? '' : 's'} imported
          </span>
          {lastSync && <span>· Last sync {lastSync}</span>}
          <span>· Sync worker runs every 15 min in the background</span>
        </div>
      </Panel>

      {/* iCal export */}
      <Panel>
        <SectionHeader
          title="iCal export"
          subtitle="Send direct bookings back to Booking.com / Airbnb so their calendar matches yours."
        />
        <CopyField value={exportUrl} />
        <div
          className="cosy-sans"
          style={{ fontSize: 11, color: 'var(--cosy-ink-mute)', marginTop: 10 }}
        >
          Paste this URL into the &quot;Import calendar&quot; field on each channel.
        </div>
      </Panel>

      {/* Platform fee */}
      <Panel>
        <SectionHeader
          title="Platform fee"
          subtitle="How much of each direct booking the platform keeps. Affects owner payouts via Stripe Connect."
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={feePct}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (Number.isNaN(v)) return
                setFeePct(Math.max(0, Math.min(100, v)))
              }}
              onBlur={saveFee}
              className="cosy-display"
              style={{
                width: 120,
                padding: '10px 30px 10px 14px',
                fontStyle: 'italic',
                fontSize: 22,
                color: 'var(--cosy-ink)',
                border: '1px solid var(--cosy-line)',
                borderRadius: 'var(--cosy-r2)',
                background: 'var(--cosy-paper)',
                outline: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--cosy-ink-mute)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 22,
                pointerEvents: 'none',
              }}
            >
              %
            </span>
          </div>
          <StatusLine status={feeStatus} />
        </div>
      </Panel>
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle?: string
  badge?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <div
          className="cosy-display"
          style={{ fontStyle: 'italic', fontSize: 20, color: 'var(--cosy-ink)' }}
        >
          {title}
        </div>
        {badge}
      </div>
      {subtitle && (
        <div
          className="cosy-sans"
          style={{ fontSize: 12, color: 'var(--cosy-ink-mute)', lineHeight: 1.55 }}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        border: '1px solid var(--cosy-line)',
        borderRadius: 'var(--cosy-r2)',
        background: 'var(--cosy-peach-soft)',
      }}
    >
      <code
        className="cosy-mono"
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 11,
          color: 'var(--cosy-ink)',
          letterSpacing: 0.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        }}
        aria-label="Copy"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 'var(--cosy-r-full)',
          background: 'var(--cosy-paper)',
          border: '1px solid var(--cosy-line)',
          color: 'var(--cosy-ink)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function StatusLine({
  status,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error'
}) {
  if (status === 'idle') return null
  const color =
    status === 'error'
      ? '#9b2c2c'
      : status === 'saved'
        ? '#3f7a4f'
        : 'var(--cosy-ink-mute)'
  const label =
    status === 'error'
      ? 'Could not save — try again'
      : status === 'saved'
        ? 'Saved'
        : 'Saving…'
  return (
    <span
      className="cosy-sans"
      style={{ fontSize: 11, color }}
    >
      {label}
    </span>
  )
}
