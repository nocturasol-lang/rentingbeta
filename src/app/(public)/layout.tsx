export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="cosy public-theme flex min-h-screen flex-col">
      {children}
    </div>
  )
}
