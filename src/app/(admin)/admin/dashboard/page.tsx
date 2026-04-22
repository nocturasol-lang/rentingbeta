import { addDays, differenceInCalendarDays, endOfDay, format, startOfDay } from 'date-fns'
import { Building2, CalendarDays, Clock, LogIn, LogOut } from 'lucide-react'
import { prisma } from '@/server/db'
import {
  Metric,
  PageHeader,
  Panel,
  PanelTitle,
  StatusPill,
  bookingStatusTone,
} from '@/components/admin/cosy/primitives'
import {
  OccupancyChart,
  type OccupancyPoint,
} from '@/components/admin/cosy/occupancy-chart'
import { IcalStatusStrip } from './ical-status'

export default async function DashboardPage() {
  const today = startOfDay(new Date())
  const endToday = endOfDay(new Date())
  const sevenOut = endOfDay(addDays(today, 7))
  const thirtyOut = endOfDay(addDays(today, 30))

  const [
    todayCheckIns,
    todayCheckOuts,
    upcomingArrivals,
    totalConfirmed,
    totalPending,
    propertyCount,
    next30Bookings,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { status: 'CONFIRMED', checkIn: { gte: today, lte: endToday } },
      include: { property: { select: { name: true } } },
      orderBy: { checkIn: 'asc' },
    }),
    prisma.booking.findMany({
      where: { status: 'CONFIRMED', checkOut: { gte: today, lte: endToday } },
      include: { property: { select: { name: true } } },
      orderBy: { checkOut: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { gt: endToday, lte: sevenOut },
      },
      include: { property: { select: { name: true } } },
      orderBy: { checkIn: 'asc' },
      take: 10,
    }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.property.count({ where: { isActive: true } }),
    prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { lte: thirtyOut },
        checkOut: { gte: today },
      },
      select: { checkIn: true, checkOut: true },
    }),
  ])

  // Build occupancy time series for the next 30 days
  const occupancyData: OccupancyPoint[] = []
  for (let i = 0; i < 30; i++) {
    const d = addDays(today, i)
    const iso = format(d, 'yyyy-MM-dd')
    let booked = 0
    for (const b of next30Bookings) {
      if (d >= startOfDay(b.checkIn) && d < startOfDay(b.checkOut)) booked++
    }
    occupancyData.push({
      date: format(d, 'MMM d'),
      iso,
      booked,
      total: propertyCount,
    })
  }

  const nextSevenNights = occupancyData.slice(0, 7).reduce((s, p) => s + p.booked, 0)
  const possibleSeven = propertyCount * 7
  const occupancyPct =
    possibleSeven > 0 ? Math.round((nextSevenNights / possibleSeven) * 100) : 0

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        eyebrow={format(new Date(), 'EEEE · d MMMM yyyy')}
        title="Dashboard"
        subtitle="A quiet day so far. Here is what's on."
      />

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <Metric
          label="Active apartments"
          value={propertyCount}
          icon={<Building2 className="h-4 w-4" />}
        />
        <Metric
          label="Confirmed bookings"
          value={totalConfirmed}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <Metric
          label="Pending"
          value={totalPending}
          icon={<Clock className="h-4 w-4" />}
          delta={
            totalPending > 0
              ? { value: 'Awaiting payment', tone: 'neutral' }
              : undefined
          }
        />
        <Metric
          label="Check-ins today"
          value={todayCheckIns.length}
          icon={<LogIn className="h-4 w-4" />}
          delta={{
            value: `${todayCheckOuts.length} check-out${todayCheckOuts.length === 1 ? '' : 's'}`,
            tone: 'neutral',
          }}
        />
      </div>

      {/* Occupancy + today lists */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <Panel>
          <PanelTitle
            action={
              <div
                className="cosy-sans"
                style={{ fontSize: 11, color: 'var(--cosy-ink-mute)' }}
              >
                Next seven nights · {occupancyPct}% booked
              </div>
            }
          >
            Occupancy · next 30 days
          </PanelTitle>
          <OccupancyChart data={occupancyData} />
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <PanelTitle>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LogIn className="h-3.5 w-3.5" /> Check-ins today
              </span>
            </PanelTitle>
            <ArrivalList
              rows={todayCheckIns.map((b) => ({
                id: b.id,
                primary: b.guestName,
                secondary: `${b.property.name} · ${b.nights} night${b.nights === 1 ? '' : 's'}`,
                status: b.status,
              }))}
              emptyText="No check-ins today."
            />
          </Panel>
          <Panel>
            <PanelTitle>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LogOut className="h-3.5 w-3.5" /> Check-outs today
              </span>
            </PanelTitle>
            <ArrivalList
              rows={todayCheckOuts.map((b) => ({
                id: b.id,
                primary: b.guestName,
                secondary: b.property.name,
                status: b.status,
              }))}
              emptyText="No check-outs today."
            />
          </Panel>
        </div>
      </div>

      {/* Upcoming + iCal */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <Panel>
          <PanelTitle
            action={
              <div
                className="cosy-sans"
                style={{ fontSize: 11, color: 'var(--cosy-ink-mute)' }}
              >
                {upcomingArrivals.length} of 10 shown
              </div>
            }
          >
            Arriving in the next seven days
          </PanelTitle>
          {upcomingArrivals.length === 0 ? (
            <div
              className="cosy-sans"
              style={{ fontSize: 13, color: 'var(--cosy-ink-mute)' }}
            >
              No arrivals in the next week.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {upcomingArrivals.map((b) => {
                const daysAway = Math.max(0, differenceInCalendarDays(b.checkIn, today))
                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderTop: '1px solid var(--cosy-line-soft)',
                      gap: 16,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
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
                        {b.guestName}
                      </div>
                      <div
                        className="cosy-sans"
                        style={{
                          fontSize: 11,
                          color: 'var(--cosy-ink-mute)',
                          marginTop: 2,
                        }}
                      >
                        {b.property.name} · {format(b.checkIn, 'EEE d MMM')} →{' '}
                        {format(b.checkOut, 'EEE d MMM')}
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
                      <div
                        className="cosy-display"
                        style={{
                          fontStyle: 'italic',
                          fontSize: 15,
                          color: 'var(--cosy-ink)',
                        }}
                      >
                        €{(b.totalCents / 100).toFixed(0)}
                      </div>
                      <div
                        className="cosy-sans"
                        style={{ fontSize: 10, color: 'var(--cosy-ink-mute)' }}
                      >
                        {daysAway === 0 ? 'Today' : `In ${daysAway} day${daysAway === 1 ? '' : 's'}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        <IcalStatusStrip />
      </div>
    </div>
  )
}

function ArrivalList({
  rows,
  emptyText,
}: {
  rows: Array<{ id: string; primary: string; secondary: string; status: string }>
  emptyText: string
}) {
  if (rows.length === 0) {
    return (
      <div
        className="cosy-sans"
        style={{ fontSize: 13, color: 'var(--cosy-ink-mute)' }}
      >
        {emptyText}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((r) => (
        <div
          key={r.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderTop: '1px solid var(--cosy-line-soft)',
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
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
              {r.primary}
            </div>
            <div
              className="cosy-sans"
              style={{
                fontSize: 11,
                color: 'var(--cosy-ink-mute)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.secondary}
            </div>
          </div>
          <StatusPill tone={bookingStatusTone(r.status)}>{r.status}</StatusPill>
        </div>
      ))}
    </div>
  )
}
