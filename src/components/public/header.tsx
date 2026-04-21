import Link from 'next/link'
import { MessageCircle, Mail } from 'lucide-react'

export function PublicHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-[#1B4F72] min-h-[44px] flex items-center">
          Georgia&apos;s Cozy Rooms
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <a
            href="https://wa.me/306973314237"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center px-3"
            title="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <a
            href="mailto:georgia@georgiascosyrooms.gr"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center px-3"
            title="Email"
          >
            <Mail className="h-5 w-5" />
            <span className="hidden sm:inline">Contact</span>
          </a>
        </nav>
      </div>
    </header>
  )
}
