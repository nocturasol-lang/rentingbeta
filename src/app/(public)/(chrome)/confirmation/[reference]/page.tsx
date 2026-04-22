'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Mail } from 'lucide-react'

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = use(params)
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(emailFromUrl)
  const [submitted, setSubmitted] = useState(!!emailFromUrl)

  const { data: booking, isLoading, error } = trpc.bookings.getByReference.useQuery(
    { reference, guestEmail: email },
    { enabled: submitted && !!email }
  )

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {/* Email verification (if not passed from booking flow) */}
      {!submitted && (
        <Card>
          <CardHeader>
            <CardTitle>View Your Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the email you used when booking to view your confirmation.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-[#1B4F72] hover:bg-[#163D5A]">
                View Booking
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {submitted && isLoading && (
        <p className="text-center text-muted-foreground">Loading your booking...</p>
      )}

      {/* Error */}
      {submitted && error && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-destructive font-medium">Booking not found</p>
            <p className="text-sm text-muted-foreground">
              Please check your reference code and email address.
            </p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {submitted && booking && (
        <Card>
          <CardContent className="py-8 space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h1 className="text-2xl font-bold">Booking Confirmed</h1>
              <p className="text-muted-foreground">
                Reference: <span className="font-mono font-semibold">{booking.reference}</span>
              </p>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium">{booking.property.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium">{booking.property.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">{booking.checkIn} from {booking.property.checkInFrom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span className="font-medium">{booking.checkOut} by {booking.property.checkOutTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nights</span>
                <span className="font-medium">{booking.nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-medium">{booking.guestCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total Paid</span>
                <span>&euro;{(booking.totalCents / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to <strong>{booking.guestName}</strong>.
                Please check your inbox.
              </p>
            </div>

            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
