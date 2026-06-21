/**
 * The flagbase mark: a flag planted on a geometric base. Single-color via
 * `currentColor` so callers set the tint. Geometry mirrors app/icon.svg
 * (the favicon) — keep the two in sync if either changes.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden>
      {/* base — the geometric foundation */}
      <rect x="6.5" y="22.4" width="19" height="4.1" rx="2" />
      {/* pole */}
      <rect x="13" y="6.5" width="2.3" height="16.5" rx="1.15" />
      {/* flag — swallowtail banner */}
      <path d="M15.3 7.4h9.8l-3.1 3.6 3.1 3.6h-9.8z" />
    </svg>
  )
}
