import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">SCALPEL</span>
          <span className="hidden sm:inline text-xs text-[var(--muted)] tracking-widest uppercase mt-0.5">
            Sustainability Intelligence
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
            Latest
          </Link>
          <Link href="/#brands" className="hover:text-[var(--foreground)] transition-colors">
            Brands
          </Link>
          <Link href="/#categories" className="hover:text-[var(--foreground)] transition-colors">
            Categories
          </Link>
          <Link
            href="/#about"
            className="hover:text-[var(--foreground)] transition-colors hidden sm:inline"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
