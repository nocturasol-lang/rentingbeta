'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { countries } from '@/lib/countries'
import { ArrowLeft, Check } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BookingFlowProps {
  propertyId: string
  propertyName: string
  slug: string
  checkIn: string
  checkOut: string
  pricePerNightCents: number
  cleaningFeeCents: number
  currency: string
}

interface GuestDetails {
  guestName: string
  guestEmail: string
  guestPhone: string
  guestCount: number
  guestIdNumber: string
  guestIdType: 'PASSPORT' | 'NATIONAL_ID'
  guestNationality: string
  guestDateOfBirth: string
  guestResidenceCountry: string
}

export function BookingFlow({ propertyId, propertyName, slug, checkIn, checkOut, pricePerNightCents, cleaningFeeCents, currency }: BookingFlowProps) {
  const [step, setStep] = useState(1)
  const [guest, setGuest] = useState<GuestDetails>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: 2,
    guestIdNumber: '',
    guestIdType: 'PASSPORT',
    guestNationality: '',
    guestDateOfBirth: '',
    guestResidenceCountry: '',
  })
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingRef, setBookingRef] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Check availability + get price
  const { data: availability, isLoading: checkingAvailability } = trpc.availability.check.useQuery(
    { propertyId, checkIn, checkOut },
    { enabled: !!checkIn && !!checkOut }
  )

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret)
      setBookingRef(data.reference)
      setStep(3)
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  function handleGuestSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    createBooking.mutate({
      propertyId,
      checkIn,
      checkOut,
      guestName: guest.guestName,
      guestEmail: guest.guestEmail,
      guestPhone: guest.guestPhone,
      guestCount: guest.guestCount,
      guestIdNumber: guest.guestIdNumber,
      guestIdType: guest.guestIdType,
      guestNationality: guest.guestNationality,
      guestDateOfBirth: guest.guestDateOfBirth,
      guestResidenceCountry: guest.guestResidenceCountry,
    })
  }

  // Step indicators
  const steps = ['Review', 'Details', 'Payment']

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 justify-center">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${
              i + 1 < step ? 'bg-green-100 text-green-700' :
              i + 1 === step ? 'bg-[#1B4F72] text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-sm ${i + 1 === step ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Review */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Stay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">{propertyName}</p>
              <p className="text-muted-foreground">{checkIn} &rarr; {checkOut}</p>
            </div>

            {checkingAvailability ? (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            ) : availability?.available === false ? (
              <p className="text-sm text-destructive font-medium">These dates are not available.</p>
            ) : availability?.breakdown ? (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>&euro;{(availability.breakdown.pricePerNightCents / 100).toFixed(2)} &times; {availability.nights} nights</span>
                    <span>&euro;{(availability.breakdown.nightsTotalCents / 100).toFixed(2)}</span>
                  </div>
                  {availability.breakdown.cleaningFeeCents > 0 && (
                    <div className="flex justify-between">
                      <span>Cleaning fee</span>
                      <span>&euro;{(availability.breakdown.cleaningFeeCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>&euro;{(availability.breakdown.totalCents / 100).toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-[#1B4F72] hover:bg-[#163D5A]"
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Guest Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <CardTitle>Guest Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Full Name</Label>
                <Input
                  id="guestName"
                  value={guest.guestName}
                  onChange={(e) => setGuest({ ...guest, guestName: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guest.guestEmail}
                  onChange={(e) => setGuest({ ...guest, guestEmail: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={guest.guestPhone}
                    onChange={(e) => setGuest({ ...guest, guestPhone: e.target.value })}
                    required
                    minLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestCount">Guests</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    min={1}
                    value={guest.guestCount}
                    onChange={(e) => setGuest({ ...guest, guestCount: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <Separator />
              <p className="text-xs text-muted-foreground">Required by Greek law for guest registration</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="guestIdType">ID Type</Label>
                  <select
                    id="guestIdType"
                    value={guest.guestIdType}
                    onChange={(e) => setGuest({ ...guest, guestIdType: e.target.value as 'PASSPORT' | 'NATIONAL_ID' })}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                    required
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestIdNumber">{guest.guestIdType === 'PASSPORT' ? 'Passport' : 'ID'} Number</Label>
                  <Input
                    id="guestIdNumber"
                    value={guest.guestIdNumber}
                    onChange={(e) => setGuest({ ...guest, guestIdNumber: e.target.value })}
                    required
                    minLength={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="guestNationality">Nationality</Label>
                  <select
                    id="guestNationality"
                    value={guest.guestNationality}
                    onChange={(e) => setGuest({ ...guest, guestNationality: e.target.value })}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                    required
                  >
                    <option value="">Select...</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestResidenceCountry">Country of Residence</Label>
                  <select
                    id="guestResidenceCountry"
                    value={guest.guestResidenceCountry}
                    onChange={(e) => setGuest({ ...guest, guestResidenceCountry: e.target.value })}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                    required
                  >
                    <option value="">Select...</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestDateOfBirth">Date of Birth</Label>
                <Input
                  id="guestDateOfBirth"
                  type="date"
                  value={guest.guestDateOfBirth}
                  onChange={(e) => setGuest({ ...guest, guestDateOfBirth: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-[#1B4F72] hover:bg-[#163D5A]"
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? 'Creating booking...' : 'Continue to Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment */}
      {step === 3 && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentStep
            bookingRef={bookingRef!}
            guestEmail={guest.guestEmail}
            totalCents={availability?.breakdown?.totalCents ?? 0}
            onBack={() => setStep(2)}
          />
        </Elements>
      )}
    </div>
  )
}

function PaymentStep({
  bookingRef,
  guestEmail,
  totalCents,
  onBack,
}: {
  bookingRef: string
  guestEmail: string
  totalCents: number
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation/${bookingRef}?email=${encodeURIComponent(guestEmail)}`,
      },
    })

    // If we reach here, there was an error (success redirects automatically)
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
    }
    setPaying(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <CardTitle>Payment</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold">&euro;{(totalCents / 100).toFixed(2)}</span>
            <Button
              type="submit"
              className="bg-[#C0533A] hover:bg-[#A8432E]"
              disabled={paying || !stripe}
            >
              {paying ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
