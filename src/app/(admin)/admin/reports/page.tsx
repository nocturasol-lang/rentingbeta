'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download } from 'lucide-react'

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const euros = (cents: number) => (cents / 100).toFixed(2)

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Compliance, financial & tax reports
        </p>
      </div>

      <Tabs defaultValue="manifest">
        <TabsList>
          <TabsTrigger value="manifest">Guest Manifest</TabsTrigger>
          <TabsTrigger value="financial">Financial Summary</TabsTrigger>
          <TabsTrigger value="tax">Accommodation Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="manifest" className="space-y-4">
          <GuestManifestTab />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialSummaryTab />
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <AccommodationTaxTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GuestManifestTab() {
  const now = new Date()
  const [from, setFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))

  const { data, isLoading } = trpc.admin.reports.getGuestManifest.useQuery(
    { from, to },
    { enabled: !!from && !!to }
  )

  const handleExport = () => {
    if (!data) return
    downloadCsv(
      `guest-manifest-${from}-to-${to}.csv`,
      ['Name', 'ID Number', 'ID Type', 'Nationality', 'Date of Birth', 'Residence Country', 'Property', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Reference'],
      data.map((g) => [
        g.guestName, g.guestIdNumber, g.guestIdType, g.guestNationality,
        g.guestDateOfBirth, g.guestResidenceCountry, g.propertyName,
        g.checkIn, g.checkOut, String(g.nights), String(g.guestCount), g.reference,
      ])
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guest Manifest (Police Compliance)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
            </div>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!data || data.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : data && data.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">{data.length} guests found</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>ID Type</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Residence</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Check-in</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((g, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{g.guestName}</TableCell>
                        <TableCell className="text-xs font-mono">{g.guestIdNumber || '-'}</TableCell>
                        <TableCell className="text-xs">{g.guestIdType || '-'}</TableCell>
                        <TableCell className="text-xs">{g.guestNationality || '-'}</TableCell>
                        <TableCell className="text-xs">{g.guestDateOfBirth || '-'}</TableCell>
                        <TableCell className="text-xs">{g.guestResidenceCountry || '-'}</TableCell>
                        <TableCell className="text-xs">{g.propertyName}</TableCell>
                        <TableCell className="text-xs">{g.checkIn}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No guests found for this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FinancialSummaryTab() {
  const now = new Date()
  const [from, setFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))

  const { data, isLoading } = trpc.admin.reports.getFinancialSummary.useQuery(
    { from, to },
    { enabled: !!from && !!to }
  )

  const handleExport = () => {
    if (!data) return
    const rows = data.byProperty.map((p) => [
      p.name, String(p.bookings), euros(p.revenueCents),
      euros(p.platformFeeCents), euros(p.ownerPayoutCents), String(p.nights),
    ])
    rows.push([
      'TOTAL', String(data.confirmedCount), euros(data.totalRevenueCents),
      euros(data.totalPlatformFeeCents), euros(data.totalOwnerPayoutCents), '',
    ])
    downloadCsv(
      `financial-summary-${from}-to-${to}.csv`,
      ['Property', 'Bookings', 'Revenue', 'Platform Fee', 'Owner Payout', 'Nights'],
      rows
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
            </div>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!data}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : data ? (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-semibold">{euros(data.totalRevenueCents)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Confirmed Bookings</p>
                  <p className="text-lg font-semibold">{data.confirmedCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Cancellations</p>
                  <p className="text-lg font-semibold">{data.cancelledCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Cancellation Rate</p>
                  <p className="text-lg font-semibold">{data.cancellationRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Per-property table */}
              {data.byProperty.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Platform Fee</TableHead>
                      <TableHead className="text-right">Owner Payout</TableHead>
                      <TableHead className="text-right">Nights</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byProperty.map((p) => (
                      <TableRow key={p.propertyId}>
                        <TableCell className="text-sm font-medium">{p.name}</TableCell>
                        <TableCell className="text-right text-sm">{p.bookings}</TableCell>
                        <TableCell className="text-right text-sm">{euros(p.revenueCents)}</TableCell>
                        <TableCell className="text-right text-sm">{euros(p.platformFeeCents)}</TableCell>
                        <TableCell className="text-right text-sm">{euros(p.ownerPayoutCents)}</TableCell>
                        <TableCell className="text-right text-sm">{p.nights}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{data.confirmedCount}</TableCell>
                      <TableCell className="text-right">{euros(data.totalRevenueCents)}</TableCell>
                      <TableCell className="text-right">{euros(data.totalPlatformFeeCents)}</TableCell>
                      <TableCell className="text-right">{euros(data.totalOwnerPayoutCents)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AccommodationTaxTab() {
  const now = new Date()
  const [from, setFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))
  const [taxRateCents, setTaxRateCents] = useState(150) // €1.50 default

  const { data, isLoading } = trpc.admin.reports.getAccommodationTax.useQuery(
    { from, to, taxRateCents },
    { enabled: !!from && !!to }
  )

  const handleExport = () => {
    if (!data) return
    const rows = data.byProperty.map((p) => [
      p.name, String(p.nights), euros(p.taxCents),
    ])
    rows.push(['TOTAL', String(data.totalNights), euros(data.taxOwedCents)])
    downloadCsv(
      `accommodation-tax-${from}-to-${to}.csv`,
      ['Property', 'Occupied Nights', 'Tax Owed'],
      rows
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accommodation Tax</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">Tax rate / night</Label>
              <Input
                type="number"
                step="0.01"
                value={(taxRateCents / 100).toFixed(2)}
                onChange={(e) => setTaxRateCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                className="w-[100px]"
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!data}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : data ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Occupied Nights</p>
                  <p className="text-lg font-semibold">{data.totalNights}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Tax Rate / Night</p>
                  <p className="text-lg font-semibold">{euros(data.taxRateCents)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Tax Owed</p>
                  <p className="text-lg font-semibold">{euros(data.taxOwedCents)}</p>
                </div>
              </div>

              {/* Per-property breakdown */}
              {data.byProperty.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Occupied Nights</TableHead>
                      <TableHead className="text-right">Tax Owed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byProperty.map((p) => (
                      <TableRow key={p.propertyId}>
                        <TableCell className="text-sm font-medium">{p.name}</TableCell>
                        <TableCell className="text-right text-sm">{p.nights}</TableCell>
                        <TableCell className="text-right text-sm">{euros(p.taxCents)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{data.totalNights}</TableCell>
                      <TableCell className="text-right">{euros(data.taxOwedCents)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
