'use client'

import { useState } from 'react'
import { format, parseISO, isWithinInterval, addDays } from 'date-fns'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface BlockedRange {
  checkIn: string
  checkOut: string
  source: string
}

interface AvailabilityPickerProps {
  propertyId: string
  slug: string
  blockedRanges: BlockedRange[]
  minNights: number
}

export function AvailabilityPicker({ propertyId, slug, blockedRanges, minNights }: AvailabilityPickerProps) {
  const [checkIn, setCheckIn] = useState<Date | undefined>()
  const [checkOut, setCheckOut] = useState<Date | undefined>()

  const canCheck = checkIn && checkOut
  const { data: availability, isLoading } = trpc.availability.check.useQuery(
    {
      propertyId,
      checkIn: checkIn ? format(checkIn, 'yyyy-MM-dd') : '',
      checkOut: checkOut ? format(checkOut, 'yyyy-MM-dd') : '',
    },
    { enabled: !!canCheck }
  )

  function isBlocked(date: Date): boolean {
    return blockedRanges.some((range) => {
      const start = parseISO(range.checkIn)
      const end = parseISO(range.checkOut)
      return date >= start && date < end
    })
  }

  function handleCheckInSelect(date: Date | undefined) {
    if (!date) return
    setCheckIn(date)
    // Auto-set checkout if not set or before new checkin
    if (!checkOut || checkOut <= date) {
      setCheckOut(addDays(date, Math.max(minNights, 1)))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Check Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Check-in</p>
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={handleCheckInSelect}
              disabled={(date) => date < new Date() || isBlocked(date)}
              className="rounded-md border w-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Check-out</p>
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={(d) => { if (d) setCheckOut(d) }}
              disabled={(date) => date <= (checkIn ?? new Date()) || isBlocked(date)}
              className="rounded-md border w-full"
            />
          </div>
        </div>

        {/* Price breakdown */}
        {canCheck && (
          <>
            <Separator />
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            ) : availability?.available === false ? (
              <p className="text-sm text-destructive font-medium">
                These dates are not available. Please select different dates.
              </p>
            ) : availability?.breakdown ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>&euro;{(availability.breakdown.pricePerNightCents / 100).toFixed(2)} &times; {availability.nights} nights</span>
                  <span>&euro;{(availability.breakdown.nightsTotalCents / 100).toFixed(2)}</span>
                </div>
                {availability.breakdown.cleaningFeeCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Cleaning fee</span>
                    <span>&euro;{(availability.breakdown.cleaningFeeCents / 100).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>&euro;{(availability.breakdown.totalCents / 100).toFixed(2)}</span>
                </div>

                <Link
                  href={`/book/${slug}?checkIn=${format(checkIn!, 'yyyy-MM-dd')}&checkOut=${format(checkOut!, 'yyyy-MM-dd')}`}
                >
                  <Button className="w-full mt-3 bg-[#C0533A] hover:bg-[#A8432E]">
                    Book Now
                  </Button>
                </Link>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
