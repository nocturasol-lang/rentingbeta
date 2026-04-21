'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { PropertyForm } from './property-form'
import { PhotoManager } from './photo-manager'

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: property, isLoading, refetch } = trpc.admin.properties.getById.useQuery({ id })

  const updateMutation = trpc.admin.properties.update.useMutation({
    onSuccess: () => {
      router.push('/admin/properties')
      router.refresh()
    },
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!property) {
    return <p className="text-sm text-destructive">Property not found</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit {property.name}</h1>
      <PropertyForm
        property={property}
        onSubmit={(data) => updateMutation.mutate({ id, ...data })}
        isPending={updateMutation.isPending}
        error={updateMutation.error?.message}
      />
      <PhotoManager
        propertyId={id}
        images={property.images}
        onUpdate={() => refetch()}
      />
    </div>
  )
}
