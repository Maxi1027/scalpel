import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-24">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">SCALPEL</span>
            <span className="text-xs text-[var(--muted)] tracking-widest uppercase">
              Sustainability Intelligence
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/contact"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/disclaimer"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Disclaimer
            </Link>
            <p className="text-xs text-[var(--muted)] hidden sm:block">
              Monitoring ESG narratives in Chinese fashion, lifestyle, and consumer brands.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
