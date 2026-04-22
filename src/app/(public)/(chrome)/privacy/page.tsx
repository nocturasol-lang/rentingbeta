import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: "Privacy Policy — Georgia's Cozy Rooms",
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: April 2026</p>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">What data we collect</h2>
        <p className="text-muted-foreground leading-relaxed">
          When you make a booking, we collect your name, email address, phone number (optional),
          and guest count. Payment information is processed directly by Stripe and is never stored
          on our servers.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">How we use your data</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your personal information is used solely to process your booking, send confirmation
          emails, and communicate about your stay. We do not sell, share, or use your data for
          marketing purposes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Data retention</h2>
        <p className="text-muted-foreground leading-relaxed">
          Booking records are retained for accounting and legal purposes. You may request deletion
          of your personal data at any time by contacting us.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your rights (GDPR)</h2>
        <p className="text-muted-foreground leading-relaxed">
          Under the General Data Protection Regulation, you have the right to access, correct,
          or delete your personal data. You also have the right to data portability and to
          withdraw consent at any time.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cookies</h2>
        <p className="text-muted-foreground leading-relaxed">
          We use essential cookies for authentication and session management. No tracking or
          advertising cookies are used.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-muted-foreground leading-relaxed">
          For privacy-related inquiries, contact us at{' '}
          <a href="mailto:georgia@georgiascosyrooms.gr" className="text-[#1B4F72] underline">
            georgia@georgiascosyrooms.gr
          </a>
        </p>
      </section>
    </div>
  )
}
