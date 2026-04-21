import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: "Terms of Service — Georgia's Cozy Rooms",
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: April 2026</p>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Booking and Payment</h2>
        <p className="text-muted-foreground leading-relaxed">
          All bookings are confirmed upon successful payment. Payments are processed securely
          through Stripe. Prices are displayed in EUR and include cleaning fees. The total amount
          is charged at the time of booking.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cancellation Policy</h2>
        <p className="text-muted-foreground leading-relaxed">
          <strong>Flexible:</strong> Free cancellation up to 24 hours before check-in. After that,
          the first night is non-refundable.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Cancellation requests can be made using your booking reference and email address.
          Refunds are processed through Stripe within 5-10 business days.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Check-in and Check-out</h2>
        <p className="text-muted-foreground leading-relaxed">
          Check-in and check-out times vary by property and are displayed on each property page.
          Please respect these times. Early check-in or late check-out may be available upon request.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">House Rules</h2>
        <p className="text-muted-foreground leading-relaxed">
          Guests are expected to treat the property with care. Smoking is not permitted inside
          any of our properties. Parties and events are not allowed. Any damage to the property
          will be charged to the guest.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Liability</h2>
        <p className="text-muted-foreground leading-relaxed">
          Georgia&apos;s Cozy Rooms is not responsible for loss or damage to personal belongings
          during your stay. We recommend travel insurance for all guests.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-muted-foreground leading-relaxed">
          For questions about these terms, contact us at{' '}
          <a href="mailto:georgia@georgiascosyrooms.gr" className="text-[#1B4F72] underline">
            georgia@georgiascosyrooms.gr
          </a>
        </p>
      </section>
    </div>
  )
}
