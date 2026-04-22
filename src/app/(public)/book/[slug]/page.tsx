import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerCaller } from '@/lib/trpc-server'
import { CosyNav } from '@/components/public/cosy/nav'
import { CosyFooter } from '@/components/public/cosy/footer'
import { BookingFlow } from './booking-flow'

export const metadata: Metadata = {
  title: "Book — Georgia's Cosy Rooms",
  robots: 'noindex, nofollow',
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}

function extractPropertyTitle(name: string): string {
  const match = name.match(/#(\d+)/)
  return match ? `Cosy Rooms #${match[1]}` : name
}

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params
  const search = await searchParams
  const trpc = await createServerCaller()

  let property
  try {
    property = await trpc.properties.getBySlug({ slug })
  } catch {
    notFound()
  }

  const title = extractPropertyTitle(property.name)
  const initialGuests = search.guests ? Math.max(1, parseInt(search.guests, 10) || 1) : 2

  return (
    <>
      <CosyNav bookHref={`/properties/${property.slug}#availability-picker`} />

      <div style={{ padding: '40px 72px 80px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <BookingFlow
          propertyId={property.id}
          propertyName={property.name}
          propertyTitle={title}
          propertyAddress={property.address}
          propertyImage={property.images[0]?.url ?? null}
          propertyImageAlt={property.images[0]?.alt ?? property.name}
          slug={property.slug}
          checkIn={search.checkIn ?? ''}
          checkOut={search.checkOut ?? ''}
          initialGuests={initialGuests}
          maxGuests={property.maxGuests}
          pricePerNightCents={property.pricePerNightCents}
          cleaningFeeCents={property.cleaningFeeCents}
          currency={property.currency}
        />
      </div>

      <CosyFooter />
    </>
  )
}
