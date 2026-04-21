'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Repeat,
} from 'lucide-react'

function eur(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export default function GuestsPage() {
  const { data: stats } = trpc.admin.guests.aggregateStats.useQuery()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = trpc.admin.guests.list.useQuery({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  })

  const { data: guestDetail } = trpc.admin.guests.getByEmail.useQuery(
    { email: selectedEmail! },
    { enabled: !!selectedEmail }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Guests</h1>
        <p className="text-sm text-muted-foreground">Guest directory & history</p>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGuests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5" /> Repeat Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.repeatGuests}{' '}
                <span className="text-sm text-muted-foreground font-normal">
                  ({stats.repeatPercentage.toFixed(0)}%)
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Top Nationality
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topNationalities.length > 0 ? (
                <div className="text-lg font-semibold">
                  <Badge variant="outline">
                    {stats.topNationalities[0].code}
                  </Badge>{' '}
                  <span className="text-sm text-muted-foreground normal-case">
                    ({stats.topNationalities[0].count})
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">—</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-9"
        />
      </div>

      {/* Guest table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-6">Loading guests...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                        Guest
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                        Nationality
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                        Bookings
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                        Total Spent
                      </th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                        Last Stay
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {data?.guests.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No guests found
                        </td>
                      </tr>
                    )}
                    {data?.guests.map((guest, i) => (
                      <tr
                        key={i}
                        className="border-b cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => {
                          if (selectedEmail === guest.email) {
                            setSelectedEmail(null)
                          } else {
                            setSelectedEmail(guest.email)
                          }
                        }}
                      >
                        <td className="p-3">
                          <p className="font-medium">{guest.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {guest.email}
                          </p>
                        </td>
                        <td className="p-3">
                          {guest.nationality ? (
                            <Badge variant="outline">{guest.nationality}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-xs">{guest.bookingCount}</span>
                          {guest.isRepeat && (
                            <Badge
                              variant="secondary"
                              className="ml-1 text-[10px]"
                            >
                              Repeat
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          {eur(guest.totalSpendCents)}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {guest.lastBookingAt
                            ? format(new Date(guest.lastBookingAt), 'dd MMM yyyy')
                            : '—'}
                        </td>
                        <td className="p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            {selectedEmail === guest.email ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronLeft className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expanded guest detail */}
              {selectedEmail && guestDetail && (
                <div className="border-t bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{guestDetail.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {guestDetail.email}
                        {guestDetail.phone ? ` · ${guestDetail.phone}` : ''}
                        {guestDetail.nationality &&
                          ` · ${guestDetail.nationality}`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        {guestDetail.bookingCount} booking
                        {guestDetail.bookingCount !== 1 ? 's' : ''}
                      </p>
                      <p>Total: {eur(guestDetail.totalSpendCents)}</p>
                    </div>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left pb-2 font-medium">Property</th>
                        <th className="text-left pb-2 font-medium">Dates</th>
                        <th className="text-left pb-2 font-medium">Nights</th>
                        <th className="text-left pb-2 font-medium">Amount</th>
                        <th className="text-left pb-2 font-medium">Status</th>
                        <th className="text-left pb-2 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestDetail.bookings.map((b) => (
                        <tr
                          key={b.id}
                          className="border-t"
                        >
                          <td className="py-1.5">
                            {b.property.name}
                          </td>
                          <td className="py-1.5">
                            {b.checkIn} – {b.checkOut}
                          </td>
                          <td className="py-1.5">{b.nights}</td>
                          <td className="py-1.5 font-medium">
                            {eur(b.totalCents)}
                          </td>
                          <td className="py-1.5">
                            <Badge
                              variant="outline"
                              className={
                                b.status === 'CONFIRMED'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : b.status === 'CANCELLED'
                                    ? 'bg-gray-50 text-gray-500 border-gray-200'
                                    : ''
                              }
                            >
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-1.5 text-muted-foreground">
                            {b.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {data.total} guests · Page {page} of {data.pages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={page >= data.pages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
