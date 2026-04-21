// All inputs and outputs in CENTS — never use floats for money

export interface BookingPriceBreakdown {
  nightsTotal: number    // pricePerNight * nights (cents)
  cleaningFee: number    // cents
  subtotal: number       // nightsTotal + cleaningFee (cents)
  platformFee: number    // cents — 0 for demo
  ownerPayout: number    // subtotal - platformFee (cents)
  total: number          // what Stripe charges the guest (cents)
}

export function calculateBookingPrice(
  pricePerNightCents: number,
  nights: number,
  cleaningFeeCents: number,
  platformFeePercent: number  // e.g. 15.00 for 15%, 0 for demo
): BookingPriceBreakdown {
  const nightsTotal = pricePerNightCents * nights
  const subtotal = nightsTotal + cleaningFeeCents
  const platformFee = Math.round(subtotal * (platformFeePercent / 100))
  const ownerPayout = subtotal - platformFee

  return {
    nightsTotal,
    cleaningFee: cleaningFeeCents,
    subtotal,
    platformFee,
    ownerPayout,
    total: subtotal,   // guest pays subtotal; fee is an internal split
  }
}
