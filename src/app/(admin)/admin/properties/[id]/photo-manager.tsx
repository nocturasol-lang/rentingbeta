'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Upload } from 'lucide-react'

interface PhotoManagerProps {
  propertyId: string
  images: Array<{ id: string; url: string; alt: string | null; position: number }>
  onUpdate: () => void
}

export function PhotoManager({ propertyId, images, onUpdate }: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const deleteMutation = trpc.admin.properties.deleteImage.useMutation({
    onSuccess: () => onUpdate(),
  })

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('propertyId', propertyId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Upload failed')
      } else {
        onUpdate()
      }
    } catch {
      setError('Upload failed')
    }

    setUploading(false)
    // Reset input
    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Photos</CardTitle>
        <label className="cursor-pointer">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <span className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer">
            <Upload className="h-3 w-3" />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </span>
        </label>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos yet. Upload the first one.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border">
                <img
                  src={img.url}
                  alt={img.alt ?? ''}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMutation.mutate({ imageId: img.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  #{img.position}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
