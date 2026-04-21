import { env } from '@/env'

const WEBHOOK_URL = env.DISCORD_WEBHOOK_URL

interface BookingNotification {
  reference: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  propertyName: string
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  totalCents: number
  platformFeeCents: number
  ownerPayoutCents: number
}

export async function notifyDiscordBooking(booking: BookingNotification): Promise<void> {
  if (!WEBHOOK_URL) return

  const totalEuros = (booking.totalCents / 100).toFixed(2)
  const feeEuros = (booking.platformFeeCents / 100).toFixed(2)
  const payoutEuros = (booking.ownerPayoutCents / 100).toFixed(2)

  const embed = {
    title: `New Booking — ${booking.reference}`,
    color: 0x10B981, // green
    fields: [
      { name: 'Property', value: booking.propertyName, inline: true },
      { name: 'Guest', value: booking.guestName, inline: true },
      { name: 'Email', value: booking.guestEmail, inline: true },
      { name: 'Phone', value: booking.guestPhone ?? 'N/A', inline: true },
      { name: 'Dates', value: `${booking.checkIn} — ${booking.checkOut} (${booking.nights}n)`, inline: false },
      { name: 'Guests', value: String(booking.guestCount), inline: true },
      { name: 'Total', value: `€${totalEuros}`, inline: true },
      { name: 'Payout', value: `€${payoutEuros}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (err) {
    console.error('[discord] Failed to send notification:', err)
  }
}

export async function notifyDiscordCancellation(reference: string, propertyName: string, guestName: string): Promise<void> {
  if (!WEBHOOK_URL) return

  const embed = {
    title: `Booking Cancelled — ${reference}`,
    color: 0xEF4444, // red
    fields: [
      { name: 'Property', value: propertyName, inline: true },
      { name: 'Guest', value: guestName, inline: true },
    ],
    timestamp: new Date().toISOString(),
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (err) {
    console.error('[discord] Failed to send cancellation notification:', err)
  }
}
