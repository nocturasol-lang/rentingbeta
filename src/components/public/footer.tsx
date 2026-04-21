import Link from 'next/link'
import { Mail, MessageCircle, Phone } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="border-t bg-[#FAFAF8] mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Contact row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <a
            href="mailto:georgia@georgiascosyrooms.gr"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" />
            georgia@georgiascosyrooms.gr
          </a>
          <a
            href="https://wa.me/306973314237"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href="tel:+306973314237"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4" />
            +30 697 331 4237
          </a>
        </div>

        {/* Legal + address */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground border-t pt-6">
          <p>&copy; {new Date().getFullYear()} Georgia&apos;s Cozy Rooms · Kavala, Greece</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>43 Kastamonis, Kavala 65404</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
