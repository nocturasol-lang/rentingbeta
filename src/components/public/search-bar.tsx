'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addDays, startOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { CalendarDays, Users, Search, Minus, Plus, X } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [checkIn, setCheckIn] = useState<Date | undefined>(
    searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')!) : undefined
  )
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')!) : undefined
  )
  // Clamp guests to 0-9 from URL
  const initGuests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : 0
  const [guests, setGuests] = useState(Math.min(Math.max(isNaN(initGuests) ? 0 : initGuests, 0), 9))
  const [hint, setHint] = useState('')

  const tomorrow = startOfDay(addDays(new Date(), 1))

  function handleSearch() {
    // If one date is set but not the other, show error
    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      setHint('Please select both check-in and check-out dates')
      return
    }
    setHint('')
    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'))
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'))
    if (guests > 0) params.set('guests', String(guests))
    router.push(params.toString() ? `/?${params.toString()}` : '/')
  }

  function handleCheckInSelect(d: Date | undefined) {
    if (!d) return
    setCheckIn(d)
    setHint('')
    // Bug #1: auto-set checkout to day after if not set or if checkout <= checkin
    if (!checkOut || checkOut <= d) {
      setCheckOut(addDays(d, 1))
    }
  }

  function handleCheckOutSelect(d: Date | undefined) {
    if (!d) return
    setHint('')
    // Bug #2: if no checkin, auto-set checkin to day before (or tomorrow if in the past)
    if (!checkIn) {
      const dayBefore = addDays(d, -1)
      setCheckIn(dayBefore < tomorrow ? tomorrow : dayBefore)
    }
    setCheckOut(d)
  }

  function clearDates() {
    setCheckIn(undefined)
    setCheckOut(undefined)
    setHint('')
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border bg-white p-2 shadow-sm">
        {/* Check-in */}
        <Popover>
          <PopoverTrigger className="flex items-center gap-2 px-3 min-h-[44px] text-sm rounded-lg hover:bg-muted transition-colors min-w-[140px]">
            <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className={checkIn ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {checkIn ? format(checkIn, 'dd MMM yyyy') : 'Check-in'}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" side="bottom">
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={handleCheckInSelect}
              disabled={(date) => date < tomorrow}
            />
            <p className="text-[11px] text-muted-foreground px-3 pb-2">Earliest check-in: tomorrow</p>
          </PopoverContent>
        </Popover>

        <div className="hidden sm:block w-px h-8 bg-border" />

        {/* Check-out — disabled dates <= checkin (not just <) to prevent same-day */}
        <Popover>
          <PopoverTrigger className="flex items-center gap-2 px-3 min-h-[44px] text-sm rounded-lg hover:bg-muted transition-colors min-w-[140px]">
            <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className={checkOut ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {checkOut ? format(checkOut, 'dd MMM yyyy') : 'Check-out'}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" side="bottom">
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={handleCheckOutSelect}
              disabled={(date) => date <= (checkIn ?? new Date())}
            />
          </PopoverContent>
        </Popover>

        {/* Clear dates */}
        {(checkIn || checkOut) && (
          <>
            <button
              onClick={clearDates}
              className="hidden sm:flex items-center justify-center h-[44px] w-[44px] rounded-full hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Clear dates"
              title="Clear dates"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={clearDates}
              className="sm:hidden text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
              aria-label="Clear dates"
            >
              Clear dates
            </button>
          </>
        )}

        <div className="hidden sm:block w-px h-8 bg-border" />

        {/* Guests — 44px stepper buttons with aria labels */}
        <div className="flex items-center gap-2 px-3 min-h-[44px]">
          <Users className="h-5 w-5 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => setGuests(Math.max(0, guests - 1))}
            className="h-[44px] w-[44px] rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Decrease guests"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm min-w-[60px] text-center">
            {guests === 0 ? 'Any' : `${guests} guest${guests > 1 ? 's' : ''}`}
          </span>
          <button
            type="button"
            onClick={() => setGuests(Math.min(9, guests + 1))}
            className="h-[44px] w-[44px] rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Increase guests"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <Button onClick={handleSearch} className="bg-[#1B4F72] hover:bg-[#163D5A] sm:ml-auto min-h-[44px]">
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
      </div>

      {hint && (
        <p className="text-xs text-destructive text-center">{hint}</p>
      )}
    </div>
  )
}
