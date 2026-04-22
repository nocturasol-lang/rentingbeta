import { createServerCaller } from '@/lib/trpc-server'
import { CosyHero } from '@/components/public/cosy/hero'
import { FloatingDatePicker } from '@/components/public/cosy/date-picker-float'
import { BrowseThumbnailCarousel } from '@/components/public/cosy/browse-thumbnail'
import { WholeHouseBlock } from '@/components/public/cosy/whole-house'
import { CosyFooter } from '@/components/public/cosy/footer'
import {
  Body,
  Eyebrow,
  Reveal,
  RevealText,
} from '@/components/public/cosy/primitives'

function extractTitle(name: string): string {
  const match = name.match(/#(\d+)/)
  return match ? `Cosy Rooms #${match[1]}` : name
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}) {
  const params = await searchParams
  const trpc = await createServerCaller()

  const properties = await trpc.properties.list({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests ? parseInt(params.guests, 10) : undefined,
  })

  // Hero background — first image from first property with images
  const heroImage =
    properties.find((p) => p.images.length > 0)?.images[0]?.url ?? null

  // Carousel images — one hero shot per property
  const carouselImages = properties
    .filter((p) => p.images.length > 0)
    .map((p) => ({
      url: p.images[0].url,
      alt: p.images[0].alt ?? p.name,
      caption: extractTitle(p.name),
    }))

  return (
    <>
      <CosyHero heroImageUrl={heroImage} />

      <FloatingDatePicker />

      {/* Intro */}
      <div
        style={{
          padding: '130px 72px 80px',
          textAlign: 'center',
          maxWidth: 820,
          margin: '0 auto',
        }}
      >
        <Reveal>
          <Eyebrow style={{ marginBottom: 20 }}>A small house by the sea</Eyebrow>
        </Reveal>
        <RevealText
          text="Rooms that feel like a quiet Greek home, not a listing."
          size={44}
          italic
          delay={100}
          style={{ lineHeight: 1.15 }}
        />
        <Reveal delay={600}>
          <Body
            size={15}
            color="var(--cosy-ink-soft)"
            style={{ maxWidth: 560, margin: '26px auto 0' }}
          >
            Georgia runs these four apartments herself. Guests come back. The coffee tray, the
            pointed directions to the quiet taverna, the door opened in person — all included.
          </Body>
        </Reveal>
      </div>

      {/* Apartments — carousel thumbnail linking to /properties */}
      <section id="apartments" style={{ padding: '0 72px 100px' }}>
        <BrowseThumbnailCarousel images={carouselImages} />
        <WholeHouseBlock />
      </section>

      <CosyFooter />
    </>
  )
}
