'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Grid, X } from 'lucide-react'

interface PhotoGalleryProps {
  images: Array<{ url: string; alt: string | null }>
  propertyName: string
}

export function PhotoGallery({ images, propertyName }: PhotoGalleryProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)

  // Escape to close
  useEffect(() => {
    if (!galleryOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setGalleryOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [galleryOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (galleryOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [galleryOpen])

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        Photos coming soon
      </div>
    )
  }

  const heroImage = images[0]
  const thumbImages = images.slice(1, 5)
  const totalPhotos = images.length

  return (
    <>
      {/* Main layout: hero + thumbnails */}
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2 rounded-xl overflow-hidden">
        <button
          onClick={() => setGalleryOpen(true)}
          className="relative sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto sm:h-full bg-muted cursor-pointer overflow-hidden group"
        >
          <Image
            src={heroImage.url}
            alt={heroImage.alt ?? propertyName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
        </button>

        {thumbImages.map((img, i) => (
          <button
            key={i + 1}
            onClick={() => setGalleryOpen(true)}
            className="relative aspect-[4/3] bg-muted cursor-pointer overflow-hidden group hidden sm:block"
          >
            <Image
              src={img.url}
              alt={img.alt ?? `${propertyName} — Photo ${i + 2}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="25vw"
            />
            {i === thumbImages.length - 1 && totalPhotos > 5 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5">
                <Grid className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">+{totalPhotos - 5}</span>
              </div>
            )}
          </button>
        ))}

        <button
          onClick={() => setGalleryOpen(true)}
          className="sm:hidden flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Grid className="h-4 w-4" />
          Show all {totalPhotos} photos
        </button>
      </div>

      {/* Full-screen gallery overlay — grid only */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0">
            <span className="font-medium">{propertyName}</span>
            <button
              onClick={() => setGalleryOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          {/* Photo grid */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-5xl mx-auto columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden bg-muted break-inside-avoid"
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? `Photo ${i + 1}`}
                    width={600}
                    height={450}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
