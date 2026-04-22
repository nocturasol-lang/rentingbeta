'use client'

import * as React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { PageHeader, Panel, StatusPill } from '@/components/admin/cosy/primitives'
import './calendar.css'

type EventType = 'BOOKING' | 'EXTERNAL_BLOCK' | 'AVAILABILITY_RULE'

type EventDetail = {
  propertyId: string
  propertyName: string
  propertyColor: string
  type: EventType
  label: string
  checkIn: string
  checkOut: string
  status?: string
  source?: string
  reference?: string
}

export default function CalendarPage() {
  const calendarRef = React.useRef<FullCalendar | null>(null)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [selected, setSelected] = React.useState<EventDetail | null>(null)
  const [propertyFilter, setPropertyFilter] = React.useState<string | null>(null)

  // Fetch a wider range than the visible month so leading/trailing week days show their events
  const from = format(subDays(startOfMonth(currentMonth), 7), 'yyyy-MM-dd')
  const to = format(addDays(endOfMonth(currentMonth), 7), 'yyyy-MM-dd')

  const { data, isLoading } = trpc.admin.calendar.getRange.useQuery({ from, to })

  const events: EventInput[] = React.useMemo(() => {
    if (!data) return []
    const out: EventInput[] = []
    for (const property of data) {
      if (propertyFilter && property.propertyId !== propertyFilter) continue
      for (const evt of property.events) {
        const isBooking = evt.type === 'BOOKING'
        const isPending = isBooking && 'status' in evt && evt.status === 'PENDING'
        const detail: EventDetail = {
          propertyId: property.propertyId,
          propertyName: property.propertyName,
          propertyColor: property.color,
          type: evt.type,
          label: 'label' in evt ? (evt.label ?? '') : '',
          checkIn: evt.checkIn,
          checkOut: evt.checkOut,
          status: 'status' in evt ? (evt.status as string | undefined) : undefined,
          source: 'source' in evt ? (evt.source as string | undefined) : undefined,
          reference:
            'reference' in evt ? (evt.reference as string | undefined) : undefined,
        }
        out.push({
          id: `${property.propertyId}-${evt.checkIn}-${evt.checkOut}-${evt.type}`,
          title: evt.type === 'BOOKING' ? ('label' in evt ? evt.label : '') : evt.type === 'EXTERNAL_BLOCK' ? ('Booking.com') : 'Blocked',
          start: evt.checkIn,
          end: evt.checkOut,
          allDay: true,
          backgroundColor: property.color,
          borderColor: property.color,
          textColor: '#fff',
          classNames: [
            'cosy-event',
            `cosy-event--${evt.type.toLowerCase()}`,
            isPending ? 'cosy-event--pending' : '',
          ].filter(Boolean),
          extendedProps: detail,
        })
      }
    }
    return out
  }, [data, propertyFilter])

  function goTo(direction: 'prev' | 'next' | 'today') {
    const api = calendarRef.current?.getApi()
    if (!api) return
    if (direction === 'prev') api.prev()
    else if (direction === 'next') api.next()
    else api.today()
    setCurrentMonth(api.getDate())
  }

  function onEventClick(arg: EventClickArg) {
    const detail = arg.event.extendedProps as EventDetail
    setSelected(detail)
  }

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        eyebrow="Master calendar"
        title={format(currentMonth, 'MMMM yyyy')}
        subtitle="Every apartment, bookings and blocks in one view."
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <IconButton onClick={() => goTo('prev')} ariaLabel="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <GhostButton onClick={() => goTo('today')}>Today</GhostButton>
          <IconButton onClick={() => goTo('next')} ariaLabel="Next month">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </PageHeader>

      {/* Property legend + filter */}
      {data && data.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <LegendChip
            label="All"
            color="var(--cosy-ink)"
            active={propertyFilter === null}
            onClick={() => setPropertyFilter(null)}
          />
          {data.map((p) => (
            <LegendChip
              key={p.propertyId}
              label={p.propertyName.replace(/^Georgia's /, '')}
              color={p.color}
              active={propertyFilter === p.propertyId}
              onClick={() =>
                setPropertyFilter(propertyFilter === p.propertyId ? null : p.propertyId)
              }
            />
          ))}
        </div>
      )}

      <Panel padding={0}>
        <div style={{ padding: 12 }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            firstDay={1}
            height="auto"
            headerToolbar={false}
            events={events}
            eventClick={onEventClick}
            dayMaxEventRows={3}
            moreLinkClassNames={['cosy-more']}
            eventDisplay="block"
            displayEventTime={false}
            fixedWeekCount={false}
            datesSet={(arg) => setCurrentMonth(arg.view.currentStart)}
          />
        </div>
      </Panel>

      {/* Footer hint */}
      <div
        className="cosy-sans"
        style={{
          fontSize: 11,
          color: 'var(--cosy-ink-mute)',
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        {isLoading
          ? 'Loading calendar…'
          : 'Click an event to see booking details. iCal blocks sync every 15 minutes.'}
      </div>

      {/* Detail drawer */}
      {selected && <EventDrawer detail={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function IconButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 34,
        height: 34,
        borderRadius: 'var(--cosy-r-full)',
        border: '1px solid var(--cosy-line)',
        background: 'var(--cosy-paper)',
        color: 'var(--cosy-ink)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cosy-sans"
      style={{
        padding: '8px 14px',
        borderRadius: 'var(--cosy-r-full)',
        border: '1px solid var(--cosy-line)',
        background: 'var(--cosy-paper)',
        color: 'var(--cosy-ink)',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </button>
  )
}

function LegendChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cosy-sans"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 'var(--cosy-r-full)',
        border: active ? '1px solid var(--cosy-ink)' : '1px solid var(--cosy-line)',
        background: active ? 'var(--cosy-ink)' : 'var(--cosy-paper)',
        color: active ? '#fff' : 'var(--cosy-ink)',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 500,
        transition: 'background 160ms, color 160ms, border-color 160ms',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </button>
  )
}

function eventTypeLabel(type: EventType): string {
  if (type === 'BOOKING') return 'Direct booking'
  if (type === 'EXTERNAL_BLOCK') return 'Booking.com / Airbnb block'
  return 'Manual block'
}

function EventDrawer({
  detail,
  onClose,
}: {
  detail: EventDetail
  onClose: () => void
}) {
  const checkIn = new Date(detail.checkIn)
  const checkOut = new Date(detail.checkOut)
  const nights = Math.round(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )

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
          width: 420,
          maxWidth: '100%',
          height: '100%',
          background: 'var(--cosy-paper)',
          padding: '32px 34px 28px',
          overflowY: 'auto',
          animation: 'cosy-fade-in 220ms ease forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div
              className="cosy-sans"
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--cosy-accent)',
                marginBottom: 8,
              }}
            >
              {eventTypeLabel(detail.type)}
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
              {detail.label || 'Blocked dates'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--cosy-r-full)',
              border: '1px solid var(--cosy-line)',
              background: 'transparent',
              color: 'var(--cosy-ink)',
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: detail.propertyColor,
            }}
          />
          <div className="cosy-sans" style={{ fontSize: 13, fontWeight: 600 }}>
            {detail.propertyName}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <DetailCell label="Check-in" value={format(checkIn, 'EEE d MMM yyyy')} />
          <DetailCell label="Check-out" value={format(checkOut, 'EEE d MMM yyyy')} />
          <DetailCell
            label="Length"
            value={`${nights} night${nights === 1 ? '' : 's'}`}
          />
          {detail.status && (
            <div>
              <DetailLabel>Status</DetailLabel>
              <div style={{ marginTop: 4 }}>
                <StatusPill tone={detail.status === 'CONFIRMED' ? 'success' : 'warn'}>
                  {detail.status}
                </StatusPill>
              </div>
            </div>
          )}
          {detail.source && (
            <DetailCell label="Source" value={detail.source} />
          )}
          {detail.reference && (
            <DetailCell label="Reference" value={detail.reference} mono />
          )}
        </div>

        {detail.type === 'BOOKING' && detail.reference && (
          <div style={{ marginTop: 'auto' }}>
            <a
              href={`/admin/bookings?ref=${detail.reference}`}
              className="cosy-sans"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--cosy-r-full)',
                background: 'var(--cosy-ink)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Open booking →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  )
}

function DetailCell({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <div
        className={mono ? 'cosy-mono' : 'cosy-sans'}
        style={{
          fontSize: mono ? 12 : 13,
          fontWeight: mono ? 500 : 500,
          letterSpacing: mono ? 2 : 0,
          color: 'var(--cosy-ink)',
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  )
}
