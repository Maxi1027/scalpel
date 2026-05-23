import Link from "next/link";
import type { RiskLevel } from "@/types";
import { RISK_COLORS } from "@/types";

interface ArticleCardData {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  tags?: string[];
  is_investigation?: boolean;
  published_at?: string | null;
  review_status?: string;
}

interface Props {
  article: ArticleCardData;
  brandName?: string;
  riskLevel?: RiskLevel;
}

export function ArticleCard({ article, brandName, riskLevel }: Props) {
  return (
    <Link href={`/article/${article.slug}`} className="block group">
      <article className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-all duration-200 hover:border-[var(--muted)]/30">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {article.is_investigation && (
            <span className="risk-badge border-red-500/30 bg-red-500/10 text-red-400">
              Investigation
            </span>
          )}
          {riskLevel && (
            <span className={`risk-badge ${getRiskBadgeClass(riskLevel)}`}>
              {riskLevel} Risk
            </span>
          )}
          {brandName && (
            <span className="text-xs text-[var(--muted)] tracking-wider uppercase">
              {brandName}
            </span>
          )}
          {article.review_status && article.review_status !== "published" && (
            <span className="risk-badge border-amber-400/30 bg-amber-400/10 text-amber-400">
              {article.review_status}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium mb-2 leading-snug group-hover:text-white transition-colors">
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[0.625rem] px-2 py-0.5 rounded-sm bg-[#1a1a1a] text-[var(--muted)] tracking-wide uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Date */}
        {article.published_at && (
          <time className="block mt-4 text-xs text-[var(--muted)]">
            {new Date(article.published_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        )}
      </article>
    </Link>
  );
}

function getRiskBadgeClass(risk: RiskLevel): string {
  switch (risk) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "high":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    case "medium":
      return "border-amber-400/30 bg-amber-400/10 text-amber-400";
    case "low":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";
  }
}
