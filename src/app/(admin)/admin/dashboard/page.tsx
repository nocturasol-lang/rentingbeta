import { format, startOfDay, endOfDay, addDays } from 'date-fns'
import { prisma } from '@/server/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CalendarDays,
  LogIn,
  LogOut,
  Building2,
  Clock,
} from 'lucide-react'
import { IcalStatusStrip } from './ical-status'

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLING: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  FAILED: 'bg-red-100 text-red-800',
}

export default async function DashboardPage() {
  const today = startOfDay(new Date())
  const tomorrow = endOfDay(new Date())
  const sevenDaysOut = endOfDay(addDays(today, 7))

  const [
    todayCheckIns,
    todayCheckOuts,
    upcomingArrivals,
    totalConfirmed,
    totalPending,
    propertyCount,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { gte: today, lte: tomorrow },
      },
      include: { property: { select: { name: true } } },
      orderBy: { checkIn: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkOut: { gte: today, lte: tomorrow },
      },
      include: { property: { select: { name: true } } },
      orderBy: { checkOut: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { gt: tomorrow, lte: sevenDaysOut },
      },
      include: { property: { select: { name: true } } },
      orderBy: { checkIn: 'asc' },
      take: 10,
    }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.property.count({ where: { isActive: true } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{propertyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConfirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Check-ins</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayCheckIns.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LogIn className="h-4 w-4" /> Check-ins Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-ins today</p>
            ) : (
              <div className="space-y-3">
                {todayCheckIns.map((b) => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{b.guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.property.name} · {b.nights} nights
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColor[b.status]}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's check-outs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LogOut className="h-4 w-4" /> Check-outs Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayCheckOuts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-outs today</p>
            ) : (
              <div className="space-y-3">
                {todayCheckOuts.map((b) => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{b.guestName}</p>
                      <p className="text-xs text-muted-foreground">{b.property.name}</p>
                    </div>
                    <Badge variant="outline" className={statusColor[b.status]}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming arrivals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Arrivals (next 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingArrivals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming arrivals</p>
          ) : (
            <div className="space-y-3">
              {upcomingArrivals.map((b) => (
                <div key={b.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{b.guestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.property.name} · {format(b.checkIn, 'EEE d MMM')} – {format(b.checkOut, 'EEE d MMM')}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    €{(b.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* iCal sync status */}
      <IcalStatusStrip />
    </div>
  )
}
