import { ArticleCard } from "@/components/ArticleCard";
import Link from "next/link";
import storage from "@/lib/storage";
import type { StoredBrand, StoredClaim } from "@/lib/storage";
import { CATEGORY_LABELS } from "@/types";
import type { ClaimCategory } from "@/types";

const CATEGORIES: ClaimCategory[] = [
  "sustainability",
  "circularity",
  "material",
  "carbon",
  "nature_narrative",
];

export default async function HomePage() {
  // Pre-fetch all data
  const brands = await storage.getBrands();
  const published = await storage.getArticles({ status: "published" });
  const featured = published.filter((a) => a.is_investigation);
  const latest = published.filter((a) => !a.is_investigation);

  // Fetch claim counts per brand
  const brandClaims: Record<string, StoredClaim[]> = {};
  for (const brand of brands) {
    brandClaims[brand.id] = await storage.getClaimsByBrand(brand.id);
  }

  // Fetch article counts per brand
  const brandArticleCounts: Record<string, number> = {};
  for (const brand of brands) {
    const articles = await storage.getArticlesByBrandSlug(brand.slug);
    brandArticleCounts[brand.slug] = articles.length;
  }

  const allClaims = Object.values(brandClaims).flat();
  const totalClaims = allClaims.length;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    categoryCounts[cat] = allClaims.filter((c) => c.category === cat).length;
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-6">
            AI-Powered Sustainability Narrative Intelligence
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-none mb-6 tracking-tight">
            China&apos;s fashion brands are talking about sustainability.
            <br />
            <span className="text-[var(--muted)]">We read between the lines.</span>
          </h1>
          <p className="text-lg text-[var(--muted)] leading-relaxed max-w-2xl">
            SCALPEL uses AI agents to monitor, extract, and analyze sustainability
            claims from Chinese fashion, lifestyle, and consumer brands — exposing
            greenwashing, decoding narratives, and tracking the evolution of ESG
            communication.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 mt-16 pt-12 border-t border-[var(--border)]">
          <Stat value={String(brands.length)} label="Brands Under Surveillance" />
          <Stat value={String(CATEGORIES.length)} label="Categories Tracked" />
          <Stat value="8" label="Risk Indicators" />
          <Stat value={String(totalClaims)} label="Claims Analyzed" />
        </div>
      </section>

      {/* Featured Investigations */}
      {featured.length > 0 && (
        <section id="featured" className="pb-16">
          <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted)] mb-8">
            Featured Investigations
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((article) => (
              <ArticleCardWrapper
                key={article.id}
                article={article}
                brands={brands}
              />
            ))}
          </div>
        </section>
      )}

      {/* Latest Analyses */}
      {latest.length > 0 && (
        <section id="latest" className="pb-16">
          <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted)] mb-8">
            Latest Analyses
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((article) => (
              <ArticleCardWrapper
                key={article.id}
                article={article}
                brands={brands}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {published.length === 0 && (
        <section className="pb-16 text-center">
          <div className="p-12 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <p className="text-[var(--muted)] mb-2">
              No published analyses yet.
            </p>
            <p className="text-xs text-[var(--muted)]">
              Run an analysis via the API, then publish it through the review workflow.
            </p>
          </div>
        </section>
      )}

      {/* Monitored Brands */}
      <section id="brands" className="pb-20">
        <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted)] mb-8">
          Brands Under Surveillance
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              articleCount={brandArticleCounts[brand.slug] || 0}
            />
          ))}
        </div>
      </section>

      {/* Narrative Categories */}
      <section id="categories" className="pb-20">
        <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted)] mb-8">
          Narrative Categories
        </h2>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="p-5 rounded-lg border border-[var(--border)] bg-[var(--card)]"
            >
              <p className="text-sm font-medium mb-1">{CATEGORY_LABELS[cat]}</p>
              <p className="text-[0.625rem] text-[var(--muted)] tracking-wide uppercase">
                {categoryCounts[cat] || 0} claims
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="pb-24 max-w-2xl">
        <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--muted)] mb-6">
          About SCALPEL
        </h2>
        <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
          <p>
            SCALPEL is an AI-powered sustainability narrative intelligence platform
            focused on Chinese fashion, lifestyle, and consumer brands. We don&apos;t
            rate ESG performance — we analyze ESG communication.
          </p>
          <p>
            Our AI agents monitor brand channels, extract sustainability-related
            claims, classify risk factors, and generate editorial analysis. Every
            article is AI-drafted, then reviewed and published by human editors.
          </p>
          <p>
            In an era where every brand has a sustainability page, narrative
            analysis is a critical tool for investors, regulators, consumers, and
            industry observers.
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-medium tracking-tight">{value}</p>
      <p className="text-xs text-[var(--muted)] tracking-wide uppercase mt-1">
        {label}
      </p>
    </div>
  );
}

function ArticleCardWrapper({
  article,
  brands,
}: {
  article: { id: string; slug: string; title: string; excerpt?: string | null; tags?: string[]; is_investigation?: boolean; published_at?: string | null; review_status?: string; brand_id: string };
  brands: StoredBrand[];
}) {
  const brand = brands.find((b) => b.id === article.brand_id);
  return <ArticleCard article={article} brandName={brand?.name} />;
}

function BrandCard({
  brand,
  articleCount,
}: {
  brand: StoredBrand;
  articleCount: number;
}) {
  return (
    <Link
      href={`/brand/${brand.slug}`}
      className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-all duration-200 hover:border-[var(--muted)]/30 group"
    >
      <h3 className="text-lg font-medium mb-1">{brand.name}</h3>
      <p className="text-xs text-[var(--muted)] mb-3">{brand.name_zh}</p>
      <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
        {brand.description}
      </p>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--muted)]">
          {articleCount} article{articleCount !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-[var(--accent-foreground)] group-hover:translate-x-1 transition-transform">
          View analysis →
        </span>
      </div>
    </Link>
  );
}
