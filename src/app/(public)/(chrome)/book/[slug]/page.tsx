import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerCaller } from '@/lib/trpc-server'
import { BookingFlow } from './booking-flow'

export const metadata: Metadata = {
  title: "Book — Georgia's Cozy Rooms",
  robots: 'noindex, nofollow',
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string }>
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

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <BookingFlow
        propertyId={property.id}
        propertyName={property.name}
        slug={property.slug}
        checkIn={search.checkIn ?? ''}
        checkOut={search.checkOut ?? ''}
        pricePerNightCents={property.pricePerNightCents}
        cleaningFeeCents={property.cleaningFeeCents}
        currency={property.currency}
      />
    </div>
  )
}
