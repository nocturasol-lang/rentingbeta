'use client'

import { Button } from '@/components/ui/button'

interface StickyBookBarProps {
  pricePerNightCents: number
  slug: string
}

export function StickyBookBar({ pricePerNightCents, slug }: StickyBookBarProps) {
  function scrollToBooking() {
    const el = document.getElementById('availability-picker')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg lg:hidden">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <div>
          <span className="text-lg font-bold">&euro;{(pricePerNightCents / 100).toFixed(0)}</span>
          <span className="text-sm text-muted-foreground"> / night</span>
        </div>
        <Button
          onClick={scrollToBooking}
          className="bg-[#C0533A] hover:bg-[#A8432E] min-h-[44px] px-6 text-base"
        >
          Check Availability
        </Button>
      </div>
    </div>
  )
}
