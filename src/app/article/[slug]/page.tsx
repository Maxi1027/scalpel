import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisBlock } from "@/components/AnalysisBlock";
import storage from "@/lib/storage";
import { RISK_LABELS } from "@/types";

export const dynamic = "force-dynamic";

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/___(.+?)___/g, "$1");
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await storage.getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const brand = await storage.getBrandById(article.brand_id);
  const claims = article.analysis_id
    ? await storage.getClaimsByAnalysis(article.analysis_id)
    : [];
  const analysis = article.analysis_id
    ? await storage.getAnalysisById(article.analysis_id)
    : null;

  const riskLabels = [...new Set(claims.flatMap((c) => c.risk_labels))];

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {brand && (
            <Link
              href={`/brand/${brand.slug}`}
              className="text-xs tracking-wider uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {brand.name}
            </Link>
          )}
          <span className="text-[var(--muted)]">·</span>
          {article.is_investigation && (
            <span className="risk-badge border-red-500/30 bg-red-500/10 text-red-400">
              Investigation
            </span>
          )}
          {riskLabels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="risk-badge border-[var(--border)] bg-[#1a1a1a] text-[var(--muted)]"
            >
              {RISK_LABELS[label as keyof typeof RISK_LABELS] || label}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight tracking-tight mb-4">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-lg text-[var(--muted)] leading-relaxed mb-6">
            {article.subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          {article.published_at && (
            <time>
              {new Date(article.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          )}
          <span>AI-Assisted Analysis</span>
          <span className="risk-badge border-[var(--border)] bg-[#1a1a1a] text-[var(--muted)]">
            {article.review_status === "published" ? "Published" : article.review_status}
          </span>
        </div>

        {analysis?.source_url && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[0.625rem] uppercase tracking-wider text-[var(--muted)]">
              Source
            </span>
            <a
              href={analysis.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.625rem] text-[var(--accent-foreground)] hover:underline truncate max-w-md"
            >
              {analysis.source_url}
            </a>
          </div>
        )}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.625rem] px-2.5 py-1 rounded-sm bg-[#1a1a1a] text-[var(--muted)] tracking-wide uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Analysis Blocks — the primary editorial format */}
      {article.blocks && article.blocks.length > 0 ? (
        <div className="mb-12">
          {article.blocks.map((block, i) => (
            <AnalysisBlock key={i} block={block} />
          ))}
        </div>
      ) : article.body ? (
        /* Fallback: render body only if no structured blocks */
        <div className="prose-editorial">
          {article.body.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={i} className="text-2xl font-medium mt-12 mb-4 text-white">
                  {cleanMarkdown(paragraph.replace("## ", ""))}
                </h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={i} className="text-xl font-medium mt-8 mb-3 text-white">
                  {cleanMarkdown(paragraph.replace("### ", ""))}
                </h3>
              );
            }
            return <p key={i}>{cleanMarkdown(paragraph)}</p>;
          })}
        </div>
      ) : null}

      {/* Claims Summary */}
      {claims.length > 0 ? (
        <div className="mt-16 pt-8 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium mb-2 text-[var(--muted)]">
            Claims Extracted from Source
          </h3>
          {analysis?.source_url && (
            <p className="text-[0.625rem] text-[var(--muted)] mb-4">
              All claims below were extracted from{" "}
              <a
                href={analysis.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-foreground)] hover:underline"
              >
                {analysis.source_url}
              </a>
            </p>
          )}
          <div className="space-y-3">
            {claims.slice(0, 15).map((claim) => (
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
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">
                    &ldquo;{claim.claim_text}&rdquo;
                  </p>
                  {claim.context && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Context: {claim.context}
                    </p>
                  )}
                  {claim.explanation && (
                    <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed italic">
                      {claim.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-16 pt-8 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium mb-2 text-[var(--muted)]">
            Claims Analysis
          </h3>
          {analysis?.source_url && (
            <p className="text-[0.625rem] text-[var(--muted)] mb-4">
              Source:{" "}
              <a
                href={analysis.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-foreground)] hover:underline"
              >
                {analysis.source_url}
              </a>
            </p>
          )}
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Our AI analysis of this page found no explicit sustainability claims.
            This absence is itself a finding — the brand&apos;s public-facing content
            avoids or omits ESG language entirely. The editorial analysis above
            examines what this silence means.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        {brand && (
          <Link
            href={`/brand/${brand.slug}`}
            className="text-sm text-[var(--accent-foreground)] hover:underline"
          >
            View all {brand.name} analyses →
          </Link>
        )}
        <p className="mt-4 text-xs text-[var(--muted)]">
          This article was produced by SCALPEL&apos;s AI analysis pipeline with human editorial review.
          Claims and risk classifications are based on publicly available brand communications.
        </p>
      </div>
    </article>
  );
}
