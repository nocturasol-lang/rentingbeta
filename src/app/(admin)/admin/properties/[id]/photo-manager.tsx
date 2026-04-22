'use client'

import * as React from 'react'
import { Trash2, Upload } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import {
  EmptyState,
  Panel,
  PillButton,
} from '@/components/admin/cosy/primitives'

interface PhotoManagerProps {
  propertyId: string
  images: Array<{ id: string; url: string; alt: string | null; position: number }>
  onUpdate: () => void
}

export function PhotoManager({ propertyId, images, onUpdate }: PhotoManagerProps) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [confirmingDelete, setConfirmingDelete] = React.useState<string | null>(null)

  const deleteMutation = trpc.admin.properties.deleteImage.useMutation({
    onSuccess: () => {
      setConfirmingDelete(null)
      onUpdate()
    },
  })

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('propertyId', propertyId)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Upload failed' }))
          setError(data.error ?? 'Upload failed')
          break
        }
      }
      onUpdate()
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <Panel>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            className="cosy-sans"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: 'var(--cosy-ink-mute)',
            }}
          >
            Gallery
          </div>
          <div
            className="cosy-sans"
            style={{ fontSize: 12, color: 'var(--cosy-ink-mute)', marginTop: 4 }}
          >
            {images.length} photo{images.length === 1 ? '' : 's'} · first image is the
            hero shot.
          </div>
        </div>
        <label style={{ cursor: uploading ? 'wait' : 'pointer' }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          />
          <span
            className="cosy-sans"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--cosy-r-full)',
              background: 'var(--cosy-ink)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <Upload className="h-3 w-3" />
            {uploading ? 'Uploading…' : 'Upload photos'}
          </span>
        </label>
      </div>

      {error && (
        <div
          className="cosy-sans"
          style={{
            fontSize: 12,
            color: '#9b2c2c',
            background: '#fbeaea',
            padding: '10px 14px',
            borderRadius: 'var(--cosy-r1)',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <EmptyState
          title="No photos yet"
          body="Upload the hero shot first — it shows up on the home carousel."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              style={{
                position: 'relative',
                borderRadius: 'var(--cosy-r2)',
                overflow: 'hidden',
                background: 'var(--cosy-peach-soft)',
                aspectRatio: '4/3',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? ''}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {i === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    padding: '3px 10px',
                    borderRadius: 'var(--cosy-r-full)',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(6px)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: 1.6,
                    textTransform: 'uppercase',
                    color: 'var(--cosy-ink)',
                  }}
                >
                  Hero
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  padding: '2px 8px',
                  borderRadius: 'var(--cosy-r-full)',
                  background: 'rgba(31,31,30,0.6)',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                }}
              >
                #{img.position}
              </div>
              <button
                type="button"
                aria-label="Delete photo"
                onClick={() => setConfirmingDelete(img.id)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--cosy-r-full)',
                  border: 'none',
                  background: 'rgba(31,31,30,0.72)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  transition: 'background 140ms',
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {confirmingDelete === img.id && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(31,31,30,0.82)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <div
                    className="cosy-sans"
                    style={{ fontSize: 12, textAlign: 'center' }}
                  >
                    Delete this photo?
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <PillButton
                      variant="solid"
                      tone="danger"
                      size="xs"
                      disabled={deleteMutation.isPending}
                      onClick={() =>
                        deleteMutation.mutate({ imageId: img.id })
                      }
                    >
                      Delete
                    </PillButton>
                    <PillButton
                      variant="outline"
                      size="xs"
                      onClick={() => setConfirmingDelete(null)}
                    >
                      Cancel
                    </PillButton>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
