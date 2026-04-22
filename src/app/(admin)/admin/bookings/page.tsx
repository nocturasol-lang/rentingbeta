'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  DoorOpen,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from 'lucide-react'
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
  Tabs,
  bookingStatusTone,
} from '@/components/admin/cosy/primitives'
import { ManualBookingForm } from './manual-booking-form'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLING' | 'CANCELLED' | 'FAILED'
type TabValue = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'TODAY' | 'UPCOMING'

type BookingListOutput = inferRouterOutputs<AppRouter>['admin']['bookings']['list']
type BookingRow = BookingListOutput['bookings'][number]

const TAB_ITEMS: Array<{ value: TabValue; label: string; status?: BookingStatus }> = [
  { value: 'PENDING', label: 'Pending', status: 'PENDING' },
  { value: 'CONFIRMED', label: 'Confirmed', status: 'CONFIRMED' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'TODAY', label: 'Today' },
  { value: 'CANCELLED', label: 'Cancelled', status: 'CANCELLED' },
  { value: 'ALL', label: 'All' },
]

export default function BookingsPage() {
  const [tab, setTab] = React.useState<TabValue>('UPCOMING')
  const [propertyId, setPropertyId] = React.useState<string>('ALL')
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 200)
    return () => window.clearTimeout(id)
  }, [search])

  const { data: properties } = trpc.admin.properties.list.useQuery()

  const listInput = React.useMemo(() => {
    const input: Parameters<typeof trpc.admin.bookings.list.useQuery>[0] = {
      page,
      limit: 25,
    }
    const tabDef = TAB_ITEMS.find((t) => t.value === tab)
    if (tabDef?.status) input.status = tabDef.status
    if (propertyId !== 'ALL') input.propertyId = propertyId
    if (tab === 'TODAY') {
      const today = format(new Date(), 'yyyy-MM-dd')
      input.from = today
      input.to = today
    }
    if (tab === 'UPCOMING') {
      const today = format(new Date(), 'yyyy-MM-dd')
      input.from = today
    }
    return input
  }, [tab, propertyId, page])

  const { data, isLoading, refetch } = trpc.admin.bookings.list.useQuery(listInput)

  // Client-side search over the current page (reference / name / email)
  const rows = React.useMemo(() => {
    if (!data) return []
    if (!debouncedSearch) return data.bookings
    const needle = debouncedSearch.toLowerCase()
    return data.bookings.filter(
      (b) =>
        b.reference.toLowerCase().includes(needle) ||
        b.guestName.toLowerCase().includes(needle) ||
        b.guestEmail.toLowerCase().includes(needle)
    )
  }, [data, debouncedSearch])

  const selected = React.useMemo(
    () => (selectedId ? data?.bookings.find((b) => b.id === selectedId) ?? null : null),
    [data, selectedId]
  )

  const tabCounts: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    UPCOMING: 0,
    TODAY: 0,
    CANCELLED: 0,
    ALL: data?.total ?? 0,
  }
  if (data) {
    const now = new Date()
    for (const b of data.bookings) {
      if (b.status === 'PENDING') tabCounts.PENDING++
      if (b.status === 'CONFIRMED') tabCounts.CONFIRMED++
      if (b.status === 'CANCELLED') tabCounts.CANCELLED++
      const checkIn = new Date(b.checkIn)
      const diff = Math.round(
        (checkIn.getTime() - new Date(format(now, 'yyyy-MM-dd')).getTime()) / 86400000
      )
      if (diff === 0) tabCounts.TODAY++
      if (diff >= 0) tabCounts.UPCOMING++
    }
  }

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 1440, margin: '0 auto' }}>
      <PageHeader eyebrow="Operations" title="Bookings" subtitle="Every reservation, direct and imported.">
        <PillButton variant="solid" onClick={() => setDrawerOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Manual booking
        </PillButton>
      </PageHeader>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <Tabs
          items={TAB_ITEMS.map((t) => ({ value: t.value, label: t.label }))}
          active={tab}
          counts={tabCounts}
          onChange={(v) => {
            setTab(v as TabValue)
            setPage(1)
          }}
        />

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px 6px 14px',
            background: 'var(--cosy-paper)',
            border: '1px solid var(--cosy-line)',
            borderRadius: 'var(--cosy-r-full)',
            minWidth: 220,
          }}
        >
          <Search className="h-3.5 w-3.5" style={{ color: 'var(--cosy-ink-mute)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference · guest · email"
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

        <select
          value={propertyId}
          onChange={(e) => {
            setPropertyId(e.target.value)
            setPage(1)
          }}
          className="cosy-sans"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--cosy-r-full)',
            border: '1px solid var(--cosy-line)',
            background: 'var(--cosy-paper)',
            fontSize: 12,
            color: 'var(--cosy-ink)',
          }}
        >
          <option value="ALL">All apartments</option>
          {properties?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <SplitView
        hasDetail={!!selected}
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
                {isLoading ? 'Loading…' : `${rows.length} showing · ${data?.total ?? 0} total`}
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

            {rows.length === 0 ? (
              <EmptyState
                title="No bookings here"
                body={
                  debouncedSearch
                    ? `Nothing matches "${debouncedSearch}".`
                    : 'Switch tabs or pick a different property.'
                }
              />
            ) : (
              <div>
                {rows.map((b) => (
                  <BookingRowItem
                    key={b.id}
                    booking={b}
                    active={b.id === selectedId}
                    onClick={() => setSelectedId(b.id)}
                  />
                ))}
              </div>
            )}
          </Panel>
        }
        detail={
          selected && (
            <BookingDetail
              key={selected.id}
              booking={selected}
              onClose={() => setSelectedId(null)}
              onMutated={() => {
                refetch()
              }}
            />
          )
        }
      />

      {drawerOpen && (
        <Drawer
          title="Manual booking"
          subtitle="Record a stay made outside the site (phone, email, returning guest)."
          onClose={() => setDrawerOpen(false)}
        >
          <ManualBookingForm
            properties={properties ?? []}
            onSuccess={() => {
              setDrawerOpen(false)
              refetch()
            }}
          />
        </Drawer>
      )}
    </div>
  )
}

// ─── List row ──────────────────────────────────────────

function BookingRowItem({
  booking,
  active,
  onClick,
}: {
  booking: BookingRow
  active: boolean
  onClick: () => void
}) {
  const checkIn = new Date(booking.checkIn)
  const checkOut = new Date(booking.checkOut)
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
          {booking.guestName}
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
          {booking.property.name} · {booking.nights} night{booking.nights === 1 ? '' : 's'} ·{' '}
          <span className="cosy-mono" style={{ letterSpacing: 1.2 }}>
            {booking.reference}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div
          className="cosy-sans"
          style={{
            fontSize: 11,
            color: 'var(--cosy-ink)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {format(checkIn, 'd MMM')} → {format(checkOut, 'd MMM')}
        </div>
        <StatusPill tone={bookingStatusTone(booking.status)}>{booking.status}</StatusPill>
      </div>
    </button>
  )
}

// ─── Detail panel ──────────────────────────────────────────

type DetailMode = 'details' | 'cancel' | 'email'

function BookingDetail({
  booking,
  onClose,
  onMutated,
}: {
  booking: BookingRow
  onClose: () => void
  onMutated: () => void
}) {
  const [mode, setMode] = React.useState<DetailMode>('details')
  const [cancelReason, setCancelReason] = React.useState('')
  const [refundPolicy, setRefundPolicy] = React.useState<'FULL' | 'FIRST_NIGHT' | 'NONE'>('FULL')
  const [emailSubject, setEmailSubject] = React.useState('')
  const [emailBody, setEmailBody] = React.useState('')

  React.useEffect(() => {
    setMode('details')
    setCancelReason('')
    setRefundPolicy('FULL')
    setEmailSubject('')
    setEmailBody('')
  }, [booking.id])

  const cancelBooking = trpc.admin.bookings.cancelBooking.useMutation({
    onSuccess: () => {
      setMode('details')
      onMutated()
    },
  })
  const sendEmail = trpc.admin.bookings.sendEmail.useMutation({
    onSuccess: () => {
      setEmailSubject('')
      setEmailBody('')
      setMode('details')
      onMutated()
    },
  })
  const resendConfirmation = trpc.admin.bookings.resendConfirmation.useMutation({
    onSuccess: () => onMutated(),
  })
  const sendCheckin = trpc.admin.bookings.sendCheckinInstructions.useMutation({
    onSuccess: () => onMutated(),
  })

  const total = (booking.totalCents / 100).toFixed(2)
  const isCancellable = booking.status === 'CONFIRMED' || booking.status === 'PENDING'
  const checkIn = new Date(booking.checkIn)
  const checkOut = new Date(booking.checkOut)

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
            <span
              className="cosy-mono"
              style={{
                fontSize: 13,
                letterSpacing: 3,
                color: 'var(--cosy-ink)',
                fontWeight: 500,
              }}
            >
              {booking.reference}
            </span>
            <StatusPill tone={bookingStatusTone(booking.status)}>{booking.status}</StatusPill>
            <StatusPill tone="neutral">{booking.source}</StatusPill>
          </div>
          <div
            className="cosy-display"
            style={{
              fontStyle: 'italic',
              fontSize: 26,
              color: 'var(--cosy-ink)',
              lineHeight: 1.1,
            }}
          >
            {booking.guestName}
          </div>
          <div
            className="cosy-sans"
            style={{ fontSize: 12, color: 'var(--cosy-ink-mute)', marginTop: 4 }}
          >
            {booking.property.name}
          </div>
        </div>
        <IconButton ariaLabel="Close" onClick={onClose}>
          ×
        </IconButton>
      </div>

      {mode === 'details' && (
        <DetailsView
          booking={booking}
          checkIn={checkIn}
          checkOut={checkOut}
          total={total}
          resendPending={resendConfirmation.isPending}
          checkinPending={sendCheckin.isPending}
          onResend={() => resendConfirmation.mutate({ bookingId: booking.id })}
          onCheckin={() => sendCheckin.mutate({ bookingId: booking.id })}
          onEmail={() => setMode('email')}
          onCancel={() => setMode('cancel')}
          cancellable={isCancellable}
          onMutated={onMutated}
        />
      )}

      {mode === 'cancel' && (
        <CancelView
          booking={booking}
          reason={cancelReason}
          onReasonChange={setCancelReason}
          refundPolicy={refundPolicy}
          onRefundPolicyChange={setRefundPolicy}
          pending={cancelBooking.isPending}
          error={cancelBooking.error?.message}
          onBack={() => setMode('details')}
          onConfirm={() =>
            cancelBooking.mutate({
              id: booking.id,
              reason: cancelReason,
              refundPolicy,
            })
          }
        />
      )}

      {mode === 'email' && (
        <EmailView
          booking={booking}
          subject={emailSubject}
          body={emailBody}
          onSubjectChange={setEmailSubject}
          onBodyChange={setEmailBody}
          pending={sendEmail.isPending}
          error={sendEmail.error?.message}
          onBack={() => setMode('details')}
          onSend={() =>
            sendEmail.mutate({
              bookingId: booking.id,
              subject: emailSubject,
              body: emailBody,
            })
          }
        />
      )}
    </Panel>
  )
}

// ─── Details view (sub-panel) ──────────────────────────────────────────

function DetailsView({
  booking,
  checkIn,
  checkOut,
  total,
  resendPending,
  checkinPending,
  cancellable,
  onResend,
  onCheckin,
  onEmail,
  onCancel,
  onMutated,
}: {
  booking: BookingRow
  checkIn: Date
  checkOut: Date
  total: string
  resendPending: boolean
  checkinPending: boolean
  cancellable: boolean
  onResend: () => void
  onCheckin: () => void
  onEmail: () => void
  onCancel: () => void
  onMutated: () => void
}) {
  return (
    <div style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Guest contact */}
      <div>
        <SectionLabel>Guest</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <ContactRow
            icon={<Mail className="h-3.5 w-3.5" />}
            value={booking.guestEmail}
            href={`mailto:${booking.guestEmail}`}
          />
          {booking.guestPhone && (
            <>
              <ContactRow
                icon={<Phone className="h-3.5 w-3.5" />}
                value={booking.guestPhone}
                href={`tel:${booking.guestPhone}`}
              />
              <ContactRow
                icon={<WhatsappIcon />}
                value="Message on WhatsApp"
                href={`https://wa.me/${booking.guestPhone.replace(/[^0-9]/g, '')}`}
                externalHref
              />
            </>
          )}
        </div>
      </div>

      {/* Stay */}
      <div>
        <SectionLabel>Stay</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 8,
            alignItems: 'center',
            marginTop: 10,
            background: 'var(--cosy-peach-soft)',
            borderRadius: 'var(--cosy-r2)',
            padding: '16px 12px',
          }}
        >
          <DateStamp label="Arrival" d={checkIn} />
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--cosy-r-full)',
                background: 'var(--cosy-paper)',
                margin: '0 auto 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--cosy-ink)',
              }}
            >
              {booking.nights}
            </div>
            <div
              className="cosy-sans"
              style={{
                fontSize: 9,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: 'var(--cosy-ink-mute)',
              }}
            >
              {booking.nights === 1 ? 'Night' : 'Nights'}
            </div>
          </div>
          <DateStamp label="Departure" d={checkOut} />
        </div>
        <div
          className="cosy-sans"
          style={{
            fontSize: 11,
            color: 'var(--cosy-ink-mute)',
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          {booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'}
        </div>
      </div>

      {/* Price */}
      <div>
        <SectionLabel>Price</SectionLabel>
        <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
          <PriceRow
            label={`${booking.nights} × €${(booking.pricePerNightCents / 100).toFixed(0)}`}
            value={`€${((booking.nights * booking.pricePerNightCents) / 100).toFixed(2)}`}
          />
          {booking.cleaningFeeCents > 0 && (
            <PriceRow label="Cleaning" value={`€${(booking.cleaningFeeCents / 100).toFixed(2)}`} />
          )}
          {booking.platformFeeCents > 0 && (
            <PriceRow
              label="Platform fee"
              value={`€${(booking.platformFeeCents / 100).toFixed(2)}`}
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderTop: '1px dashed var(--cosy-line)',
            marginTop: 10,
            paddingTop: 10,
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
            Total
          </div>
          <div
            className="cosy-display"
            style={{ fontStyle: 'italic', fontSize: 22, color: 'var(--cosy-ink)' }}
          >
            €{total}
          </div>
        </div>
      </div>

      {/* Payment */}
      <div>
        <SectionLabel>Payment</SectionLabel>
        {booking.stripePaymentIntentId ? (
          <div
            style={{
              marginTop: 10,
              padding: '12px 14px',
              background: 'var(--cosy-peach-soft)',
              borderRadius: 'var(--cosy-r2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <MonoLine
              label="Payment Intent"
              value={booking.stripePaymentIntentId}
            />
            {booking.stripeChargeId && (
              <MonoLine label="Charge" value={booking.stripeChargeId} />
            )}
          </div>
        ) : (
          <div
            className="cosy-sans"
            style={{ marginTop: 8, fontSize: 12, color: 'var(--cosy-ink-mute)' }}
          >
            Manual booking — no Stripe payment.
          </div>
        )}
      </div>

      {/* Admin notes — inline auto-save */}
      <div>
        <SectionLabel>Notes</SectionLabel>
        <AdminNotes bookingId={booking.id} initialNotes={booking.adminNotes} onSaved={onMutated} />
      </div>

      {/* Timeline */}
      <div>
        <SectionLabel>Timeline</SectionLabel>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TimelineItem label="Booked" when={booking.createdAt} />
          {booking.confirmedAt && <TimelineItem label="Confirmed" when={booking.confirmedAt} />}
          {booking.cancelledAt && (
            <TimelineItem
              label="Cancelled"
              when={booking.cancelledAt}
              note={booking.cancellationReason ?? undefined}
              tone="danger"
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          paddingTop: 14,
          borderTop: '1px solid var(--cosy-line-soft)',
        }}
      >
        <PillButton variant="outline" onClick={onResend} disabled={resendPending}>
          <RefreshCw className="h-3 w-3" />
          {resendPending ? 'Sending…' : 'Resend confirmation'}
        </PillButton>
        <PillButton
          variant="outline"
          onClick={onCheckin}
          disabled={checkinPending || booking.status !== 'CONFIRMED'}
        >
          <DoorOpen className="h-3 w-3" />
          {checkinPending ? 'Sending…' : 'Check-in instructions'}
        </PillButton>
        <PillButton variant="outline" onClick={onEmail}>
          <Send className="h-3 w-3" />
          Custom email
        </PillButton>
        {cancellable && (
          <PillButton variant="outline" tone="danger" onClick={onCancel}>
            <XCircle className="h-3 w-3" />
            Cancel booking
          </PillButton>
        )}
      </div>
    </div>
  )
}

// ─── Cancel form ──────────────────────────────────────────

function CancelView({
  booking,
  reason,
  onReasonChange,
  refundPolicy,
  onRefundPolicyChange,
  pending,
  error,
  onBack,
  onConfirm,
}: {
  booking: BookingRow
  reason: string
  onReasonChange: (v: string) => void
  refundPolicy: 'FULL' | 'FIRST_NIGHT' | 'NONE'
  onRefundPolicyChange: (v: 'FULL' | 'FIRST_NIGHT' | 'NONE') => void
  pending: boolean
  error?: string
  onBack: () => void
  onConfirm: () => void
}) {
  const fullEuros = (booking.totalCents / 100).toFixed(2)
  const firstNightDeduct = (
    (booking.totalCents - booking.pricePerNightCents) /
    100
  ).toFixed(2)
  return (
    <div style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        className="cosy-sans"
        style={{ fontSize: 13, color: 'var(--cosy-ink-soft)' }}
      >
        Cancel <span className="cosy-mono">{booking.reference}</span> for{' '}
        <strong>{booking.guestName}</strong>?
      </div>

      <div>
        <SectionLabel>Refund policy</SectionLabel>
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {(
            [
              { v: 'FULL' as const, label: 'Full refund', value: `€${fullEuros}` },
              {
                v: 'FIRST_NIGHT' as const,
                label: 'Deduct first night',
                value: `€${firstNightDeduct}`,
              },
              { v: 'NONE' as const, label: 'No refund', value: '€0.00' },
            ] as const
          ).map((opt) => (
            <label
              key={opt.v}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border:
                  refundPolicy === opt.v
                    ? '1px solid var(--cosy-ink)'
                    : '1px solid var(--cosy-line)',
                background:
                  refundPolicy === opt.v ? 'var(--cosy-peach-soft)' : 'var(--cosy-paper)',
                borderRadius: 'var(--cosy-r2)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="radio"
                  name="refundPolicy"
                  checked={refundPolicy === opt.v}
                  onChange={() => onRefundPolicyChange(opt.v)}
                  style={{ accentColor: 'var(--cosy-ink)' }}
                />
                <span
                  className="cosy-sans"
                  style={{ fontSize: 13, color: 'var(--cosy-ink)' }}
                >
                  {opt.label}
                </span>
              </div>
              <span
                className="cosy-display"
                style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--cosy-ink)' }}
              >
                {opt.value}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Reason</SectionLabel>
        <textarea
          className="cosy-sans"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Why is this cancelling? (saved with the booking record)"
          rows={3}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '10px 14px',
            border: '1px solid var(--cosy-line)',
            borderRadius: 'var(--cosy-r2)',
            fontSize: 13,
            color: 'var(--cosy-ink)',
            outline: 'none',
            resize: 'vertical',
            background: 'var(--cosy-paper)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && <InlineError>{error}</InlineError>}

      <div style={{ display: 'flex', gap: 8 }}>
        <PillButton
          variant="solid"
          tone="danger"
          disabled={!reason.trim() || pending}
          onClick={onConfirm}
        >
          {pending ? 'Cancelling…' : 'Confirm cancellation'}
        </PillButton>
        <PillButton variant="outline" onClick={onBack}>
          Back
        </PillButton>
      </div>
    </div>
  )
}

// ─── Email form ──────────────────────────────────────────

function EmailView({
  booking,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  pending,
  error,
  onBack,
  onSend,
}: {
  booking: BookingRow
  subject: string
  body: string
  onSubjectChange: (v: string) => void
  onBodyChange: (v: string) => void
  pending: boolean
  error?: string
  onBack: () => void
  onSend: () => void
}) {
  return (
    <div style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        className="cosy-sans"
        style={{ fontSize: 12, color: 'var(--cosy-ink-mute)' }}
      >
        Sending to <strong style={{ color: 'var(--cosy-ink)' }}>{booking.guestEmail}</strong>
      </div>

      <input
        type="text"
        value={subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        placeholder="Subject"
        className="cosy-sans"
        style={{
          padding: '12px 14px',
          border: '1px solid var(--cosy-line)',
          borderRadius: 'var(--cosy-r2)',
          background: 'var(--cosy-paper)',
          fontSize: 13,
          color: 'var(--cosy-ink)',
          outline: 'none',
        }}
      />
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Write your message…"
        rows={8}
        className="cosy-sans"
        style={{
          padding: '12px 14px',
          border: '1px solid var(--cosy-line)',
          borderRadius: 'var(--cosy-r2)',
          background: 'var(--cosy-paper)',
          fontSize: 13,
          color: 'var(--cosy-ink)',
          outline: 'none',
          resize: 'vertical',
          lineHeight: 1.6,
        }}
      />

      {error && <InlineError>{error}</InlineError>}

      <div style={{ display: 'flex', gap: 8 }}>
        <PillButton
          variant="solid"
          onClick={onSend}
          disabled={!subject.trim() || !body.trim() || pending}
        >
          <Send className="h-3 w-3" />
          {pending ? 'Sending…' : 'Send email'}
        </PillButton>
        <PillButton variant="outline" onClick={onBack}>
          Back
        </PillButton>
      </div>
    </div>
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
  const [copied, setCopied] = React.useState(false)
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
      <button
        type="button"
        aria-label="Copy"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--cosy-ink-mute)',
          cursor: 'pointer',
          padding: 4,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </>
  )
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

function DateStamp({ label, d }: { label: string; d: Date }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="cosy-sans"
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: 'var(--cosy-ink-mute)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="cosy-sans" style={{ fontSize: 11, color: 'var(--cosy-ink-soft)' }}>
        {format(d, 'EEE')}
      </div>
      <div
        className="cosy-display"
        style={{
          fontStyle: 'italic',
          fontSize: 28,
          color: 'var(--cosy-ink)',
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        {format(d, 'd')}
      </div>
      <div className="cosy-sans" style={{ fontSize: 10, color: 'var(--cosy-ink-mute)', marginTop: 2 }}>
        {format(d, 'MMM yyyy')}
      </div>
    </div>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span
        className="cosy-sans"
        style={{ fontSize: 12, color: 'var(--cosy-ink-mute)' }}
      >
        {label}
      </span>
      <span className="cosy-sans" style={{ fontSize: 12, color: 'var(--cosy-ink)' }}>
        {value}
      </span>
    </div>
  )
}

function MonoLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        className="cosy-sans"
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: 'var(--cosy-ink-mute)',
          flexShrink: 0,
          minWidth: 92,
        }}
      >
        {label}
      </div>
      <div
        className="cosy-mono"
        style={{
          fontSize: 11,
          color: 'var(--cosy-ink)',
          letterSpacing: 0.8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
      >
        {value}
      </div>
      <button
        type="button"
        aria-label="Copy"
        onClick={() => {
          navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--cosy-ink-mute)',
          display: 'inline-flex',
        }}
      >
        {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}

function TimelineItem({
  label,
  when,
  note,
  tone = 'neutral',
}: {
  label: string
  when: Date | string
  note?: string
  tone?: 'neutral' | 'danger'
}) {
  const d = typeof when === 'string' ? new Date(when) : when
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          marginTop: 5,
          background: tone === 'danger' ? '#9b2c2c' : 'var(--cosy-ink)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="cosy-sans"
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--cosy-ink)' }}
        >
          {label}
        </div>
        <div
          className="cosy-sans"
          style={{ fontSize: 11, color: 'var(--cosy-ink-mute)', marginTop: 2 }}
        >
          {format(d, 'd MMM yyyy · HH:mm')}
        </div>
        {note && (
          <div
            className="cosy-sans"
            style={{
              fontSize: 11,
              color: 'var(--cosy-ink-soft)',
              marginTop: 4,
              fontStyle: 'italic',
            }}
          >
            {note}
          </div>
        )}
      </div>
    </div>
  )
}

function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="cosy-sans"
      style={{
        fontSize: 12,
        color: '#9b2c2c',
        background: '#fbeaea',
        padding: '10px 14px',
        borderRadius: 'var(--cosy-r1)',
      }}
    >
      {children}
    </div>
  )
}

// ─── Admin notes (auto-save) ──────────────────────────────────────────

function AdminNotes({
  bookingId,
  initialNotes,
  onSaved,
}: {
  bookingId: string
  initialNotes: string | null
  onSaved: () => void
}) {
  const [notes, setNotes] = React.useState(initialNotes ?? '')
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  React.useEffect(() => {
    setNotes(initialNotes ?? '')
    setStatus('idle')
  }, [bookingId, initialNotes])

  const mutation = trpc.admin.bookings.updateAdminNotes.useMutation({
    onSuccess: () => {
      setStatus('saved')
      window.setTimeout(() => setStatus('idle'), 1600)
      onSaved()
    },
    onError: () => setStatus('error'),
  })

  function onBlur() {
    if (notes === (initialNotes ?? '')) return
    setStatus('saving')
    mutation.mutate({ id: bookingId, notes })
  }

  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={onBlur}
        placeholder="Private notes about this booking (saved on blur)"
        rows={3}
        className="cosy-sans"
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid var(--cosy-line)',
          borderRadius: 'var(--cosy-r2)',
          fontSize: 12,
          color: 'var(--cosy-ink)',
          outline: 'none',
          resize: 'vertical',
          background: 'var(--cosy-paper)',
          lineHeight: 1.55,
          boxSizing: 'border-box',
        }}
      />
      <div
        className="cosy-sans"
        style={{
          fontSize: 10,
          marginTop: 6,
          color:
            status === 'error'
              ? '#9b2c2c'
              : status === 'saved'
                ? '#3f7a4f'
                : 'var(--cosy-ink-mute)',
          letterSpacing: 0.4,
        }}
      >
        {status === 'saving' && 'Saving…'}
        {status === 'saved' && 'Saved'}
        {status === 'error' && 'Could not save — try again'}
        {status === 'idle' && 'Changes save automatically when you click away.'}
      </div>
    </div>
  )
}

// ─── Drawer ──────────────────────────────────────────

function Drawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,31,30,0.45)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: '100%',
          height: '100%',
          background: 'var(--cosy-paper)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'cosy-fade-in 220ms ease forwards',
        }}
      >
        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid var(--cosy-line-soft)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div
              className="cosy-display"
              style={{ fontStyle: 'italic', fontSize: 22, color: 'var(--cosy-ink)' }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                className="cosy-sans"
                style={{ fontSize: 12, color: 'var(--cosy-ink-mute)', marginTop: 4 }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <IconButton ariaLabel="Close" onClick={onClose}>
            ×
          </IconButton>
        </div>
        <div style={{ padding: 26, flex: 1 }}>{children}</div>
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
