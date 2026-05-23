"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReviewStatus } from "@/lib/storage";

interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  brandName: string;
  tags: string[];
  is_investigation: boolean;
  excerpt?: string | null;
  body?: string;
  claimCount: number;
  review_status: string;
  review_note?: string | null;
  published_at?: string | null;
  created_at: string;
}

export function ReviewDashboard({
  pendingArticles,
  publishedArticles,
  rejectedArticles,
  sessionEmail,
  initialTab,
}: {
  pendingArticles: ArticleSummary[];
  publishedArticles: ArticleSummary[];
  rejectedArticles: ArticleSummary[];
  sessionEmail: string;
  initialTab: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [pending, setPending] = useState(pendingArticles);
  const [published, setPublished] = useState(publishedArticles);
  const [rejected, setRejected] = useState(rejectedArticles);
  const [preview, setPreview] = useState<ArticleSummary | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ArticleSummary | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const articles = tab === "pending" ? pending : tab === "published" ? published : rejected;

  const updateStatus = useCallback(
    async (articleId: string, status: ReviewStatus, note?: string) => {
      setUpdating(articleId);
      try {
        const res = await fetch("/api/review", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: articleId, status, note }),
        });
        const data = await res.json();
        if (data.success) {
          // Remove from all lists and re-add to correct one
          const article = [...pending, ...published, ...rejected].find(
            (a) => a.id === articleId,
          );
          if (article) {
            setPending((p) => p.filter((a) => a.id !== articleId));
            setPublished((p) => p.filter((a) => a.id !== articleId));
            setRejected((p) => p.filter((a) => a.id !== articleId));
            const updated = { ...article, review_status: status };
            if (status === "published") setPublished((p) => [updated, ...p]);
            if (status === "reviewed") setRejected((p) => [updated, ...p]);
            if (status === "pending") setPending((p) => [updated, ...p]);
          }
          setPreview(null);
          router.refresh();
        }
      } finally {
        setUpdating(null);
      }
    },
    [pending, published, rejected, router],
  );

  async function handleLogout() {
    await fetch("/api/auth/verify", { method: "DELETE" });
    router.push("/review/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 bg-[var(--background)]/95 backdrop-blur z-40">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-semibold tracking-tight">审核后台</h1>
            <nav className="flex gap-1">
              {(["pending", "published", "rejected"] as const).map((t) => {
                const count =
                  t === "pending" ? pending.length : t === "published" ? published.length : rejected.length;
                const labels = { pending: "待审核", published: "已发布", rejected: "已退回" };
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      tab === t
                        ? "bg-white text-black"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {labels[t]} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--muted)]">{sessionEmail}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--muted)]">
              {tab === "pending" ? "没有待审核的文章" : tab === "published" ? "还没有发布过文章" : "没有被退回的文章"}
            </p>
            {tab === "pending" && (
              <p className="text-xs text-[var(--muted)] mt-2">
                通过 API 触发分析后，文章会出现在这里
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[var(--muted)] uppercase tracking-wider">
                        {article.brandName}
                      </span>
                      {article.is_investigation && (
                        <span className="risk-badge border-red-500/30 bg-red-500/10 text-red-400 text-[0.625rem]">
                          调查
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium leading-snug mb-1">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                      <span>{article.claimCount} 条声明</span>
                      <span>
                        {new Date(article.created_at).toLocaleDateString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {article.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="text-[0.625rem] text-[var(--muted)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreview(article)}
                      className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--muted)] transition-colors"
                    >
                      预览
                    </button>
                    {tab === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(article.id, "published")}
                          disabled={updating === article.id}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {updating === article.id ? "..." : "发布"}
                        </button>
                        <button
                          onClick={() => { setRejectTarget(article); setRejectNote(""); }}
                          disabled={updating === article.id}
                          className="px-3 py-1.5 rounded text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          退回
                        </button>
                      </>
                    )}
                    {article.review_note && (
                      <span className="text-[0.625rem] text-amber-400 ml-2" title={article.review_note}>
                        有备注
                      </span>
                    )}
                    {tab === "published" && (
                      <button
                        onClick={() => { setRejectTarget(article); setRejectNote(""); }}
                        disabled={updating === article.id}
                        className="px-3 py-1.5 rounded text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        下架
                      </button>
                    )}
                    {tab === "rejected" && (
                      <button
                        onClick={() => updateStatus(article.id, "pending")}
                        disabled={updating === article.id}
                        className="px-3 py-1.5 rounded text-xs font-medium border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-50"
                      >
                        重新审核
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreview(null);
          }}
        >
          <div className="fixed inset-0 bg-black/60" />
          <div className="relative z-10 w-full max-w-3xl mx-4 my-10 p-8 rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs text-[var(--muted)]">
                文章预览 — {preview.review_status === "published" ? "已发布" : preview.review_status === "reviewed" ? "已退回" : "待审核"}
              </span>
              <button
                onClick={() => setPreview(null)}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                关闭 ✕
              </button>
            </div>

            <p className="text-[0.625rem] uppercase tracking-wider text-[var(--muted)] mb-2">
              {preview.brandName}
            </p>
            <h2 className="text-2xl font-medium leading-tight mb-2">
              {preview.title}
            </h2>
            {preview.excerpt && (
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                {preview.excerpt}
              </p>
            )}

            {preview.tags && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {preview.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[0.625rem] px-2 py-0.5 rounded-sm bg-[#1a1a1a] text-[var(--muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {preview.body && (
              <div className="prose-editorial max-h-96 overflow-y-auto border-t border-[var(--border)] pt-6">
                {preview.body.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-[var(--border)]">
              {preview.review_status === "pending" && (
                <>
                  <button
                    onClick={() => { setRejectTarget(preview); setRejectNote(""); setPreview(null); }}
                    disabled={updating === preview.id}
                    className="px-4 py-2 rounded text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    退回修改
                  </button>
                  <button
                    onClick={() => updateStatus(preview.id, "published")}
                    disabled={updating === preview.id}
                    className="px-4 py-2 rounded text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    确认发布
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setRejectTarget(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 p-6 rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <h3 className="text-sm font-medium mb-1">退回原因</h3>
            <p className="text-xs text-[var(--muted)] mb-4">
              {rejectTarget.brandName} — {rejectTarget.title.slice(0, 60)}...
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="哪里需要修改？AI 漏掉了什么？哪些判断不准？"
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm resize-none h-24 focus:outline-none focus:border-[var(--accent)] transition-colors"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  updateStatus(rejectTarget.id, "reviewed", rejectNote || undefined);
                  setRejectTarget(null);
                  setRejectNote("");
                }}
                disabled={updating === rejectTarget.id}
                className="px-3 py-1.5 rounded text-xs font-medium border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
