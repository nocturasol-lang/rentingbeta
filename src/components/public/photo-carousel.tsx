'use client'

import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

interface PhotoCarouselProps {
  images: Array<{ url: string; alt: string | null }>
  aspectRatio?: 'card' | 'detail'
}

export function PhotoCarousel({ images, aspectRatio = 'detail' }: PhotoCarouselProps) {
  if (images.length === 0) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center text-muted-foreground ${
        aspectRatio === 'card' ? 'aspect-[3/2]' : 'aspect-[16/9]'
      }`}>
        Photos coming soon
      </div>
    )
  }

  return (
    <Carousel className="w-full group" opts={{ loop: true }}>
      <CarouselContent>
        {images.map((img, i) => (
          <CarouselItem key={i}>
            <div className={`relative overflow-hidden rounded-lg ${
              aspectRatio === 'card' ? 'aspect-[3/2]' : 'aspect-[16/9] sm:aspect-[2/1]'
            }`}>
              <Image
                src={img.url}
                alt={img.alt ?? `Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes={aspectRatio === 'card' ? '(max-width: 640px) 100vw, 50vw' : '100vw'}
                priority={i === 0}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          {/* Arrows — hidden on mobile (swipe instead), visible on hover desktop */}
          <CarouselPrevious className="left-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity h-11 w-11" />
          <CarouselNext className="right-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity h-11 w-11" />
          {/* Dot indicators — always visible, serve as swipe hint on mobile */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.slice(0, 5).map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-white/70" />
            ))}
            {images.length > 5 && (
              <span className="text-white/70 text-xs leading-none">+{images.length - 5}</span>
            )}
          </div>
        </>
      )}
    </Carousel>
  )
}
