'use client'

import * as React from 'react'
import { Body, Photo, Reveal } from './primitives'

type GalleryImage = { url: string; alt: string | null }

export function MosaicGallery({
  images,
  propertyName,
}: {
  images: GalleryImage[]
  propertyName: string
}) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

  // Show up to 5 in the mosaic; the rest are accessed via "+N photos"
  const shown = images.slice(0, 5)
  const remaining = Math.max(0, images.length - 5)

  // Pad to 5 so layout holds even with fewer images
  const padded: Array<GalleryImage | null> = [...shown]
  while (padded.length < 5) padded.push(null)

  return (
    <div style={{ padding: '0 72px 80px' }}>
      <Reveal dy={40}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gridTemplateRows: '240px 240px',
            gap: 12,
            borderRadius: 'var(--cosy-r3)',
            overflow: 'hidden',
          }}
        >
          {padded.map((img, i) => {
            const isOverlay = i === 4 && remaining > 0
            return (
              <button
                type="button"
                key={i}
                onClick={() => img && setLightboxIndex(i)}
                style={{
                  gridRow: i === 0 ? 'span 2' : undefined,
                  position: 'relative',
                  border: 'none',
                  padding: 0,
                  cursor: img ? 'pointer' : 'default',
                  background: 'transparent',
                  overflow: 'hidden',
                }}
              >
                <Photo
                  src={img?.url ?? null}
                  alt={img?.alt ?? propertyName}
                  tone={(['warm', 'sand', 'sage', 'warm', 'sky'] as const)[i]}
                  fill
                  radius={0}
                  sizes={i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
                />
                {isOverlay && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(31,31,30,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Body size={13} color="#fff" weight={600}>
                      + {remaining} photos
                    </Body>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Reveal>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: GalleryImage[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = React.useState(startIndex)

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [images.length, onClose])

  const current = images[index]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,31,30,0.92)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.url}
        alt={current.alt ?? ''}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92vw',
          maxHeight: '86vh',
          objectFit: 'contain',
          borderRadius: 12,
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 22,
        }}
        aria-label="Close"
      >
        ×
      </button>
      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIndex((i) => Math.max(0, i - 1))
          }}
          style={{ ...arrowStyle, left: 24 }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}
      {index < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIndex((i) => Math.min(images.length - 1, i + 1))
          }}
          style={{ ...arrowStyle, right: 24 }}
          aria-label="Next"
        >
          ›
        </button>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.12)',
          padding: '6px 14px',
          borderRadius: 999,
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          letterSpacing: 1.4,
        }}
      >
        {index + 1} / {images.length}
      </div>
    </div>
  )
}

const arrowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.14)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
