import { redirect } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth";
import storage from "@/lib/storage";
import { ReviewDashboard } from "./dashboard";

export default async function ReviewPage() {
  const session = await getSession();
  if (!session) redirect("/review/login");

  const [pending, published, rejected] = await Promise.all([
    storage.getArticles({ status: "pending" }),
    storage.getArticles({ status: "published" }),
    storage.getArticles({ status: "reviewed" }),
  ]);

  // Fetch brand names for all articles
  const allArticles = [...pending, ...published, ...rejected];
  const brandIds = [...new Set(allArticles.map((a) => a.brand_id))];
  const brands = await storage.getBrands();
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  // Fetch claims for pending articles
  const claimsMap = new Map<string, number>();
  for (const article of pending) {
    const claims = await storage.getClaimsByBrand(article.brand_id);
    claimsMap.set(article.id, claims.length);
  }

  const tab = "pending";

  return (
    <ReviewDashboard
      pendingArticles={pending.map((a) => ({
        ...a,
        brandName: brandMap.get(a.brand_id)?.name || "Unknown",
        claimCount: claimsMap.get(a.id) || 0,
      }))}
      publishedArticles={published.map((a) => ({
        ...a,
        brandName: brandMap.get(a.brand_id)?.name || "Unknown",
        claimCount: 0,
      }))}
      rejectedArticles={rejected.map((a) => ({
        ...a,
        brandName: brandMap.get(a.brand_id)?.name || "Unknown",
        claimCount: 0,
      }))}
      sessionEmail={session.email}
      initialTab={tab}
    />
  );
}
