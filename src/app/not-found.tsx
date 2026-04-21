import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
        <Link href="/">
          <Button variant="outline">Back to Homepage</Button>
        </Link>
      </div>
    </div>
  )
}
