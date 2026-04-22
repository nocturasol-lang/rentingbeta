'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Mail, MapPin, Phone, Search } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/trpc'
import {
  EmptyState,
  IconButton,
  Metric,
  PageHeader,
  Panel,
  PanelTitle,
  PillButton,
  SplitView,
  StatusPill,
  bookingStatusTone,
} from '@/components/admin/cosy/primitives'

type GuestListRow = inferRouterOutputs<AppRouter>['admin']['guests']['list']['guests'][number]
type GuestDetail = NonNullable<inferRouterOutputs<AppRouter>['admin']['guests']['getByEmail']>

export default function GuestsPage() {
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [selectedEmail, setSelectedEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 200)
    return () => window.clearTimeout(id)
  }, [search])

  const { data: stats } = trpc.admin.guests.aggregateStats.useQuery()

  const { data, isLoading } = trpc.admin.guests.list.useQuery({
    search: debouncedSearch || undefined,
    page,
    limit: 25,
  })

  const { data: guestDetail, isLoading: loadingDetail } =
    trpc.admin.guests.getByEmail.useQuery(
      { email: selectedEmail! },
      { enabled: !!selectedEmail }
    )

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 1440, margin: '0 auto' }}>
      <PageHeader
        eyebrow="Directory"
        title="Guests"
        subtitle="Everyone who has stayed, written, or is booked to arrive."
      />

      {/* KPI strip */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 14,
            marginBottom: 22,
          }}
        >
          <Metric label="Total guests" value={stats.totalGuests} />
          <Metric
            label="Repeat guests"
            value={stats.repeatGuests}
            delta={{
              value: `${stats.repeatPercentage.toFixed(0)}% come back`,
              tone: stats.repeatPercentage > 15 ? 'up' : 'neutral',
            }}
          />
          <Metric
            label="Top origin"
            value={
              stats.topNationalities[0]
                ? stats.topNationalities[0].code
                : '—'
            }
            delta={
              stats.topNationalities[0]
                ? {
                    value: `${stats.topNationalities[0].count} guest${stats.topNationalities[0].count === 1 ? '' : 's'}`,
                    tone: 'neutral',
                  }
                : undefined
            }
          />
          <Metric
            label="Top guest"
            value={
              stats.topGuests && stats.topGuests[0]
                ? `${stats.topGuests[0].count} stays`
                : '—'
            }
            delta={
              stats.topGuests && stats.topGuests[0]
                ? {
                    value: firstName(stats.topGuests[0].name ?? ''),
                    tone: 'neutral',
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px 6px 14px',
          background: 'var(--cosy-paper)',
          border: '1px solid var(--cosy-line)',
          borderRadius: 'var(--cosy-r-full)',
          maxWidth: 420,
          marginBottom: 18,
        }}
      >
        <Search className="h-3.5 w-3.5" style={{ color: 'var(--cosy-ink-mute)' }} />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Name, email, or phone"
          className="cosy-sans"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 12,
            color: 'var(--cosy-ink)',
          }}
        />
      </div>

      <SplitView
        hasDetail={!!selectedEmail}
        list={
          <Panel padding={0}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--cosy-line-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                className="cosy-sans"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                  color: 'var(--cosy-ink-mute)',
                }}
              >
                {isLoading
                  ? 'Loading…'
                  : `${data?.guests.length ?? 0} showing · ${data?.total ?? 0} total`}
              </div>
              {data && data.pages > 1 && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <IconButton
                    ariaLabel="Previous page"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </IconButton>
                  <span
                    className="cosy-sans"
                    style={{ fontSize: 11, color: 'var(--cosy-ink-mute)' }}
                  >
                    {page} / {data.pages}
                  </span>
                  <IconButton
                    ariaLabel="Next page"
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page >= data.pages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              )}
            </div>

            {!data || data.guests.length === 0 ? (
              <EmptyState
                title={debouncedSearch ? 'No match' : 'No guests yet'}
                body={
                  debouncedSearch
                    ? `Nothing matches "${debouncedSearch}".`
                    : 'Bookings will populate this list.'
                }
              />
            ) : (
              <div>
                {data.guests.map((guest) => (
                  <GuestRow
                    key={guest.email}
                    guest={guest}
                    active={guest.email === selectedEmail}
                    onClick={() =>
                      setSelectedEmail((current) =>
                        current === guest.email ? null : guest.email
                      )
                    }
                  />
                ))}
              </div>
            )}
          </Panel>
        }
        detail={
          selectedEmail && (
            <GuestDetailPanel
              email={selectedEmail}
              detail={guestDetail ?? null}
              loading={loadingDetail}
              onClose={() => setSelectedEmail(null)}
            />
          )
        }
      />
    </div>
  )
}

function firstName(full: string): string {
  return full.split(' ')[0] ?? full
}

// ─── Row ──────────────────────────────────────────

function GuestRow({
  guest,
  active,
  onClick,
}: {
  guest: GuestListRow
  active: boolean
  onClick: () => void
}) {
  const lastStay = guest.lastBookingAt ? new Date(guest.lastBookingAt) : null
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 12,
        padding: '14px 20px',
        background: active ? 'var(--cosy-peach-soft)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--cosy-line-soft)',
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        transition: 'background 140ms',
      }}
    >
      {active && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 10,
            bottom: 10,
            width: 3,
            borderRadius: 2,
            background: 'var(--cosy-ink)',
          }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 3,
          }}
        >
          <div
            className="cosy-display"
            style={{
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--cosy-ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {guest.name}
          </div>
          {guest.isRepeat && <StatusPill tone="info">Repeat</StatusPill>}
        </div>
        <div
          className="cosy-sans"
          style={{
            fontSize: 11,
            color: 'var(--cosy-ink-mute)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {guest.email}
          {guest.nationality && ` · ${guest.nationality}`}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          textAlign: 'right',
        }}
      >
        <div
          className="cosy-display"
          style={{ fontStyle: 'italic', fontSize: 16, color: 'var(--cosy-ink)' }}
        >
          €{Math.round(guest.totalSpendCents / 100)}
        </div>
        <div
          className="cosy-sans"
          style={{ fontSize: 10, color: 'var(--cosy-ink-mute)' }}
        >
          {guest.bookingCount} stay{guest.bookingCount === 1 ? '' : 's'}
          {lastStay && ` · last ${format(lastStay, 'd MMM yyyy')}`}
        </div>
      </div>
    </button>
  )
}

// ─── Detail panel ──────────────────────────────────────────

function GuestDetailPanel({
  email,
  detail,
  loading,
  onClose,
}: {
  email: string
  detail: GuestDetail | null
  loading: boolean
  onClose: () => void
}) {
  const [showLegal, setShowLegal] = React.useState(false)

  if (loading || !detail) {
    return (
      <Panel>
        <div
          className="cosy-sans"
          style={{ fontSize: 13, color: 'var(--cosy-ink-mute)' }}
        >
          {loading ? 'Loading guest…' : 'No guest data'}
        </div>
      </Panel>
    )
  }

  const confirmedBookings = detail.bookings.filter((b) => b.status === 'CONFIRMED')

  return (
    <Panel padding={0}>
      {/* Header */}
      <div
        style={{
          padding: '22px 26px 18px',
          borderBottom: '1px solid var(--cosy-line-soft)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {detail.isRepeat && <StatusPill tone="info">Repeat guest</StatusPill>}
            {detail.nationality && <StatusPill tone="neutral">{detail.nationality}</StatusPill>}
          </div>
          <div
            className="cosy-display"
            style={{
              fontStyle: 'italic',
              fontSize: 28,
              color: 'var(--cosy-ink)',
              lineHeight: 1.1,
            }}
          >
            {detail.name}
          </div>
          <div
            className="cosy-sans"
            style={{ fontSize: 12, color: 'var(--cosy-ink-mute)', marginTop: 4 }}
          >
            {detail.bookingCount} booking{detail.bookingCount === 1 ? '' : 's'} · €
            {Math.round(detail.totalSpendCents / 100)} lifetime
          </div>
        </div>
        <IconButton ariaLabel="Close" onClick={onClose}>
          ×
        </IconButton>
      </div>

      <div style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Contact */}
        <div>
          <SectionLabel>Contact</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <ContactRow
              icon={<Mail className="h-3.5 w-3.5" />}
              value={email}
              href={`mailto:${email}`}
            />
            {detail.phone && (
              <>
                <ContactRow
                  icon={<Phone className="h-3.5 w-3.5" />}
                  value={detail.phone}
                  href={`tel:${detail.phone}`}
                />
                <ContactRow
                  icon={<WhatsappIcon />}
                  value="Message on WhatsApp"
                  href={`https://wa.me/${detail.phone.replace(/[^0-9]/g, '')}`}
                  externalHref
                />
              </>
            )}
            {(detail.nationality || detail.residenceCountry) && (
              <ContactRow
                icon={<MapPin className="h-3.5 w-3.5" />}
                value={[
                  detail.nationality && `${detail.nationality} national`,
                  detail.residenceCountry && `lives in ${detail.residenceCountry}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            )}
          </div>
        </div>

        {/* Legal (collapsed by default) */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <SectionLabel>Legal · Greek registry</SectionLabel>
            <PillButton
              variant="ghost"
              size="xs"
              onClick={() => setShowLegal((v) => !v)}
            >
              {showLegal ? 'Hide' : 'Show'}
            </PillButton>
          </div>
          {showLegal ? (
            <div
              style={{
                marginTop: 10,
                padding: '12px 16px',
                background: 'var(--cosy-peach-soft)',
                borderRadius: 'var(--cosy-r2)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {detail.bookings[0] && (
                <>
                  <LegalField label="Nationality" value={detail.nationality ?? '—'} />
                  <LegalField
                    label="Residence"
                    value={detail.residenceCountry ?? '—'}
                  />
                </>
              )}
              <div
                className="cosy-sans"
                style={{
                  gridColumn: '1 / -1',
                  fontSize: 11,
                  color: 'var(--cosy-ink-mute)',
                  marginTop: 4,
                }}
              >
                ID numbers and dates of birth are only shown on the individual booking
                record. They&apos;re submitted once to the Greek tourism registry and purged
                shortly after the stay ends.
              </div>
            </div>
          ) : (
            <div
              className="cosy-sans"
              style={{ fontSize: 11, color: 'var(--cosy-ink-mute)', marginTop: 6 }}
            >
              Sensitive ID details are hidden by default.
            </div>
          )}
        </div>

        {/* Bookings history */}
        <div>
          <PanelTitle
            action={
              <span
                className="cosy-sans"
                style={{ fontSize: 10, color: 'var(--cosy-ink-mute)' }}
              >
                €{Math.round(detail.totalSpendCents / 100)} from{' '}
                {confirmedBookings.length} confirmed
              </span>
            }
          >
            Stays
          </PanelTitle>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {detail.bookings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings?ref=${b.reference}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 12,
                  padding: '12px 0',
                  borderTop: '1px solid var(--cosy-line-soft)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    className="cosy-sans"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--cosy-ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.property.name}
                  </div>
                  <div
                    className="cosy-sans"
                    style={{
                      fontSize: 11,
                      color: 'var(--cosy-ink-mute)',
                      marginTop: 2,
                    }}
                  >
                    {format(new Date(b.checkIn), 'd MMM yyyy')} →{' '}
                    {format(new Date(b.checkOut), 'd MMM yyyy')} ·{' '}
                    <span className="cosy-mono" style={{ letterSpacing: 1.2 }}>
                      {b.reference}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                  }}
                >
                  <span
                    className="cosy-display"
                    style={{
                      fontStyle: 'italic',
                      fontSize: 15,
                      color: 'var(--cosy-ink)',
                    }}
                  >
                    €{Math.round(b.totalCents / 100)}
                  </span>
                  <StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

// ─── Small pieces ──────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="cosy-sans"
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: 'var(--cosy-ink-mute)',
      }}
    >
      {children}
    </div>
  )
}

function ContactRow({
  icon,
  value,
  href,
  externalHref,
}: {
  icon: React.ReactNode
  value: string
  href?: string
  externalHref?: boolean
}) {
  const sharedStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    background: 'var(--cosy-paper)',
    border: '1px solid var(--cosy-line-soft)',
    borderRadius: 'var(--cosy-r2)',
    textDecoration: 'none',
  }
  const content = (
    <>
      <span style={{ color: 'var(--cosy-ink-mute)', display: 'inline-flex' }}>{icon}</span>
      <span
        className="cosy-sans"
        style={{
          fontSize: 13,
          color: 'var(--cosy-ink)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {value}
      </span>
    </>
  )
  if (href) {
    return (
      <a
        href={href}
        target={externalHref ? '_blank' : undefined}
        rel={externalHref ? 'noopener noreferrer' : undefined}
        style={sharedStyle}
      >
        {content}
      </a>
    )
  }
  return <div style={sharedStyle}>{content}</div>
}

function LegalField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="cosy-sans"
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: 'var(--cosy-ink-mute)',
        }}
      >
        {label}
      </div>
      <div
        className="cosy-sans"
        style={{ fontSize: 13, color: 'var(--cosy-ink)', marginTop: 4, fontWeight: 500 }}
      >
        {value}
      </div>
    </div>
  )
}

function WhatsappIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.89.51 3.73 1.47 5.35L2 22l4.88-1.58c1.56.85 3.33 1.32 5.14 1.32h.01c5.46 0 9.91-4.45 9.92-9.91 0-2.65-1.03-5.14-2.9-7.02A9.83 9.83 0 0 0 12.04 2zm0 1.81a8.09 8.09 0 0 1 8.11 8.1 8.09 8.09 0 0 1-12.2 7l-.29-.17-3.01.97.98-2.94-.19-.3a8.05 8.05 0 0 1-1.24-4.28 8.09 8.09 0 0 1 7.84-8.38zm-4.04 4.3c-.16 0-.41.06-.63.3-.22.24-.83.82-.83 2s.85 2.32 1 2.48c.14.16 1.66 2.54 4.04 3.57.56.24 1 .39 1.34.5.56.18 1.07.16 1.47.1.45-.07 1.39-.57 1.58-1.12.2-.55.2-1.02.14-1.12-.06-.1-.21-.16-.45-.28-.24-.12-1.39-.68-1.6-.76-.22-.08-.38-.12-.54.12-.16.24-.63.76-.77.92-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.17-.7-.62-1.18-1.4-1.32-1.64-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.4z" />
    </svg>
  )
}
