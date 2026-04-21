'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { trpc } from '@/lib/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, Mail, XCircle, RefreshCw, Send, DoorOpen } from 'lucide-react'
import { ManualBookingForm } from './manual-booking-form'

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLING: 'bg-orange-100 text-orange-800 border-orange-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLING' | 'CANCELLED' | 'FAILED'

type BookingRow = {
  id: string
  reference: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  checkIn: string | Date
  checkOut: string | Date
  nights: number
  totalCents: number
  pricePerNightCents: number
  cleaningFeeCents: number
  platformFeeCents: number
  currency: string
  status: string
  source: string
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  confirmedAt: string | Date | null
  cancelledAt: string | Date | null
  cancellationReason: string | null
  adminNotes: string | null
  property: { name: string; slug: string }
}

export default function BookingsPage() {
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL')
  const [propertyId, setPropertyId] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null)

  const { data: properties } = trpc.admin.properties.list.useQuery()

  const { data, isLoading, refetch } = trpc.admin.bookings.list.useQuery({
    status: status === 'ALL' ? undefined : status,
    propertyId: propertyId === 'ALL' ? undefined : propertyId,
    page,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Manual Booking
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Manual Booking</DialogTitle>
            </DialogHeader>
            <ManualBookingForm
              properties={properties ?? []}
              onSuccess={() => {
                setDialogOpen(false)
                refetch()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => { if (v) { setStatus(v as BookingStatus | 'ALL'); setPage(1) } }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLING">Cancelling</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Property</Label>
          <Select value={propertyId} onValueChange={(v) => { if (v) { setPropertyId(v); setPage(1) } }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All properties</SelectItem>
              {properties?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <p className="text-sm text-muted-foreground">Loading bookings...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => setSelectedBooking(booking as BookingRow)}
                      >
                        <TableCell className="font-mono text-xs">{booking.reference}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{booking.guestName}</p>
                            <p className="text-xs text-muted-foreground">{booking.guestEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{booking.property.name}</TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(booking.checkIn), 'dd MMM')} – {format(new Date(booking.checkOut), 'dd MMM')}
                          <br />
                          <span className="text-muted-foreground">{booking.nights}n</span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          €{(booking.totalCents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColor[booking.status]}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {booking.source}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {data.total} bookings · Page {page} of {data.pages}
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

      {/* Booking Detail Dialog */}
      {selectedBooking && (
        <BookingDetailDialog
          booking={selectedBooking}
          open={!!selectedBooking}
          onOpenChange={(open) => { if (!open) setSelectedBooking(null) }}
          onAction={() => { setSelectedBooking(null); refetch() }}
        />
      )}
    </div>
  )
}

function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
  onAction,
}: {
  booking: BookingRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => void
}) {
  const [view, setView] = useState<'details' | 'cancel' | 'email'>('details')
  const [cancelReason, setCancelReason] = useState('')
  const [refundPolicy, setRefundPolicy] = useState<'FULL' | 'FIRST_NIGHT' | 'NONE'>('FULL')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  const cancelBooking = trpc.admin.bookings.cancelBooking.useMutation({
    onSuccess: () => {
      setView('details')
      onAction()
    },
  })

  const sendEmail = trpc.admin.bookings.sendEmail.useMutation({
    onSuccess: () => {
      setEmailSubject('')
      setEmailBody('')
      setView('details')
      onAction()
    },
  })

  const resendConfirmation = trpc.admin.bookings.resendConfirmation.useMutation({
    onSuccess: () => onAction(),
  })

  const sendCheckin = trpc.admin.bookings.sendCheckinInstructions.useMutation({
    onSuccess: () => onAction(),
  })

  const totalEuros = (booking.totalCents / 100).toFixed(2)
  const pricePerNight = (booking.pricePerNightCents / 100).toFixed(2)
  const cleaningFee = (booking.cleaningFeeCents / 100).toFixed(2)
  const platformFee = (booking.platformFeeCents / 100).toFixed(2)
  const isCancellable = booking.status === 'CONFIRMED' || booking.status === 'PENDING'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm">{booking.reference}</span>
            <Badge variant="outline" className={statusColor[booking.status]}>
              {booking.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {view === 'details' && (
          <div className="space-y-4">
            {/* Guest info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Guest</p>
                <p className="font-medium">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p>{booking.guestEmail}</p>
              </div>
              {booking.guestPhone && (
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p>{booking.guestPhone}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">Property</p>
                <p className="font-medium">{booking.property.name}</p>
              </div>
            </div>

            {/* Stay details */}
            <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
              <div>
                <p className="text-muted-foreground text-xs">Check-in</p>
                <p>{format(new Date(booking.checkIn), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Check-out</p>
                <p>{format(new Date(booking.checkOut), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Nights</p>
                <p>{booking.nights}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Source</p>
                <Badge variant="secondary" className="text-[10px]">{booking.source}</Badge>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{booking.nights} nights × €{pricePerNight}</span>
                <span>€{(booking.nights * booking.pricePerNightCents / 100).toFixed(2)}</span>
              </div>
              {booking.cleaningFeeCents > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cleaning fee</span>
                  <span>€{cleaningFee}</span>
                </div>
              )}
              {booking.platformFeeCents > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span>€{platformFee}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total</span>
                <span>€{totalEuros}</span>
              </div>
            </div>

            {/* Payment status */}
            <div className="border-t pt-3 text-sm">
              <p className="text-muted-foreground text-xs mb-1">Payment</p>
              {booking.stripePaymentIntentId ? (
                <p className="text-xs">
                  Stripe PI: <span className="font-mono">{booking.stripePaymentIntentId}</span>
                  {booking.stripeChargeId && (
                    <> · Charge: <span className="font-mono">{booking.stripeChargeId}</span></>
                  )}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No Stripe payment (manual booking)</p>
              )}
            </div>

            {/* Admin notes (manual bookings) */}
            {booking.adminNotes && (
              <div className="border-t pt-3 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Admin notes</p>
                <p className="text-xs">{booking.adminNotes}</p>
              </div>
            )}

            {/* Cancellation info */}
            {booking.cancellationReason && booking.status === 'CANCELLED' && (
              <div className="border-t pt-3 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Cancellation reason</p>
                <p className="text-xs">{booking.cancellationReason}</p>
                {booking.cancelledAt && (
                  <p className="text-xs text-muted-foreground">
                    Cancelled: {format(new Date(booking.cancelledAt), 'dd MMM yyyy HH:mm')}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => resendConfirmation.mutate({ bookingId: booking.id })}
                disabled={resendConfirmation.isPending}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Resend Confirmation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendCheckin.mutate({ bookingId: booking.id })}
                disabled={sendCheckin.isPending || booking.status !== 'CONFIRMED'}
              >
                <DoorOpen className="h-3.5 w-3.5 mr-1.5" />
                Check-in Instructions
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setView('email')}
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Send Email
              </Button>
              {isCancellable && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setView('cancel')}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        )}

        {view === 'cancel' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cancel booking <span className="font-mono font-medium">{booking.reference}</span> for {booking.guestName}?
            </p>

            <div>
              <Label>Refund Policy</Label>
              <Select value={refundPolicy} onValueChange={(v: string | null) => { if (v) setRefundPolicy(v as 'FULL' | 'FIRST_NIGHT' | 'NONE') }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">Full refund (€{totalEuros})</SelectItem>
                  <SelectItem value="FIRST_NIGHT">
                    Deduct first night (€{((booking.totalCents - booking.pricePerNightCents) / 100).toFixed(2)})
                  </SelectItem>
                  <SelectItem value="NONE">No refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reason</Label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={!cancelReason || cancelBooking.isPending}
                onClick={() => cancelBooking.mutate({
                  id: booking.id,
                  reason: cancelReason,
                  refundPolicy,
                })}
              >
                {cancelBooking.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
              <Button variant="outline" onClick={() => setView('details')}>
                Back
              </Button>
            </div>

            {cancelBooking.error && (
              <p className="text-sm text-red-600">{cancelBooking.error.message}</p>
            )}
          </div>
        )}

        {view === 'email' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send email to {booking.guestName} ({booking.guestEmail})
            </p>

            <div>
              <Label>Subject</Label>
              <Input
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div>
              <Label>Body</Label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={5}
                placeholder="Email body..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!emailSubject || !emailBody || sendEmail.isPending}
                onClick={() => sendEmail.mutate({
                  bookingId: booking.id,
                  subject: emailSubject,
                  body: emailBody,
                })}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {sendEmail.isPending ? 'Sending...' : 'Send Email'}
              </Button>
              <Button variant="outline" onClick={() => setView('details')}>
                Back
              </Button>
            </div>

            {sendEmail.error && (
              <p className="text-sm text-red-600">{sendEmail.error.message}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
