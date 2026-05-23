import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import storage from "@/lib/storage";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await storage.getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const articles = await storage.getArticlesByBrandSlug(slug);
  const claims = await storage.getClaimsByBrand(brand.id);

  const highRiskCount = claims.filter(
    (c) => c.risk_level === "high" || c.risk_level === "critical",
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <Link
        href="/#brands"
        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-8 inline-block"
      >
        ← All Brands
      </Link>

      <div className="mb-16">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-4">
          Brand Profile
        </p>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-3">
          {brand.name}
        </h1>
        <p className="text-lg text-[var(--muted)] mb-6">{brand.name_zh}</p>
        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
          {brand.description}
        </p>

        <div className="flex flex-wrap gap-6 mt-8 text-sm">
          {brand.website && (
            <div>
              <span className="text-[var(--muted)]">Website </span>
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-foreground)] hover:underline"
              >
                {new URL(brand.website).hostname}
              </a>
            </div>
          )}
          {brand.industry && (
            <div>
              <span className="text-[var(--muted)]">Industry </span>
              <span className="capitalize">{brand.industry.replace("-", " ")}</span>
            </div>
          )}
          {brand.founded && (
            <div>
              <span className="text-[var(--muted)]">Founded </span>
              <span>{brand.founded}</span>
            </div>
          )}
          {brand.headquarters && (
            <div>
              <span className="text-[var(--muted)]">HQ </span>
              <span>{brand.headquarters}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-16">
        {([
          { label: "Claims Analyzed", value: String(claims.length) },
          { label: "High Risk Claims", value: String(highRiskCount) },
          { label: "Articles Published", value: String(articles.length) },
          {
            label: "Risk Level",
            value:
              highRiskCount > claims.length * 0.5
                ? "Elevated"
                : highRiskCount > 0
                  ? "Moderate"
                  : "Low",
          },
        ]).map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-lg border border-[var(--border)] bg-[var(--card)]"
          >
            <p className="text-2xl font-medium tracking-tight mb-1">{stat.value}</p>
            <p className="text-xs text-[var(--muted)] tracking-wide uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Claims */}
      {claims.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted)] mb-6">
            Recent Claims
          </h2>
          <div className="space-y-2">
            {claims.slice(0, 8).map((claim) => (
              <div
                key={claim.id}
                className="flex items-start gap-3 p-3 rounded border border-[var(--border)] bg-[var(--card)]"
              >
                <span
                  className={`risk-badge shrink-0 mt-0.5 ${
                    claim.risk_level === "high" || claim.risk_level === "critical"
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : claim.risk_level === "medium"
                        ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                  }`}
                >
                  {claim.risk_level}
                </span>
                <div className="min-w-0">
                  <p className="text-sm truncate">{claim.claim_text}</p>
                  <p className="text-[0.625rem] text-[var(--muted)] mt-0.5 uppercase tracking-wider">
                    {claim.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Articles */}
      <section>
        <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted)] mb-8">
          Published Analyses
        </h2>
        {articles.length === 0 ? (
          <div className="p-8 rounded-lg border border-[var(--border)] bg-[var(--card)] text-center">
            <p className="text-sm text-[var(--muted)]">
              No published analyses yet for {brand.name}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                brandName={brand.name}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
