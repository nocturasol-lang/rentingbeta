'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, Building2, TrendingUp, CalendarDays, Ban, Clock } from 'lucide-react'

function eur(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export default function AnalyticsPage() {
  const { data: overview } = trpc.admin.stats.overview.useQuery()
  const { data: revenueByMonth } = trpc.admin.stats.revenueByMonth.useQuery()
  const { data: byProperty } = trpc.admin.stats.byProperty.useQuery()

  const maxRevenue = revenueByMonth?.reduce(
    (max, m) => (m.revenueCents > max ? m.revenueCents : max),
    0
  ) ?? 0

  const sourceData = overview?.bySource
  const totalFromSource = sourceData
    ? sourceData.DIRECT + sourceData.BOOKING_COM + sourceData.MANUAL
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Revenue, occupancy & performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview ? eur(overview.monthlyRevenueCents) : '—'}
            </div>
            {overview && (
              <p className="text-xs text-muted-foreground mt-1">
                {overview.monthlyBookings} booking{overview.monthlyBookings !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">YTD Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview ? eur(overview.ytdRevenueCents) : '—'}
            </div>
            {overview && (
              <p className="text-xs text-muted-foreground mt-1">
                {overview.ytdBookings} booking{overview.ytdBookings !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview ? `${overview.occupancyRate.toFixed(1)}%` : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Rate</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview ? eur(overview.adrCents) : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview ? `${overview.cancellationRate.toFixed(1)}%` : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview ? `${overview.avgStayLength.toFixed(1)} nights` : '—'}
            </div>
            {overview && (
              <p className="text-xs text-muted-foreground mt-1">
                booked {overview.avgLeadTime.toFixed(0)}d ahead
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue (last 12 months)</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByMonth && revenueByMonth.length > 0 ? (
            <div className="flex items-end gap-1 h-40">
              {revenueByMonth.map((m, i) => {
                const heightPct = maxRevenue > 0 ? (m.revenueCents / maxRevenue) * 100 : 0
                return (
                  <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                    <div
                      className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-colors relative group"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                      title={`${m.month}: ${eur(m.revenueCents)} (${m.bookingCount} bookings)`}
                    />
                    <span className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">
                      {m.month}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No bookings yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Revenue per property + Booking source */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Property</CardTitle>
          </CardHeader>
          <CardContent>
            {byProperty && byProperty.length > 0 ? (
              <div className="space-y-3">
                {byProperty.map((p) => {
                  const max = byProperty.reduce((m, x) => (x.revenueCents > m ? x.revenueCents : m), 0)
                  const widthPct = max > 0 ? (p.revenueCents / max) * 100 : 0
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{p.name}</span>
                        <span>
                          {eur(p.revenueCents)} · {p.bookingCount} bookings
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Direct</Badge>
                    <span className="text-sm">{sourceData.DIRECT}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {totalFromSource > 0
                      ? `${((sourceData.DIRECT / totalFromSource) * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Booking.com</Badge>
                    <span className="text-sm">{sourceData.BOOKING_COM}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {totalFromSource > 0
                      ? `${((sourceData.BOOKING_COM / totalFromSource) * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Manual</Badge>
                    <span className="text-sm">{sourceData.MANUAL}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {totalFromSource > 0
                      ? `${((sourceData.MANUAL / totalFromSource) * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
