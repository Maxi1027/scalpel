import { NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBrandContent } from "@/lib/analyzer";
import { discoverEsgUrls } from "@/lib/monitor";
import storage from "@/lib/storage";
import { sendReviewNotification } from "@/lib/email";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { brand_slug, url } = await request.json();

    if (!brand_slug) {
      return NextResponse.json(
        { success: false, error: "brand_slug is required" },
        { status: 400 },
      );
    }

    const brand = await storage.getBrandBySlug(brand_slug);
    if (!brand) {
      return NextResponse.json(
        { success: false, error: `Unknown brand: ${brand_slug}` },
        { status: 404 },
      );
    }

    // Discover ESG URLs or use the explicit one provided
    let targetUrl = url;
    if (!targetUrl) {
      if (brand.website) {
        const discovered = await discoverEsgUrls(brand_slug, brand.website, []);
        targetUrl = discovered[0]?.url || brand.website;
      } else {
        return NextResponse.json(
          { success: false, error: `No website configured for: ${brand_slug}` },
          { status: 400 },
        );
      }
    }

    // Step 1 — Scrape
    console.log(`[Analyze] Scraping ${targetUrl}...`);
    const page = await scrapeUrl(targetUrl);

    // Step 2 — AI Analysis
    console.log(`[Analyze] Analyzing content for ${brand.name}...`);
    const result = await analyzeBrandContent(
      brand.name,
      brand.name_zh,
      page.text,
      targetUrl,
    );

    // Step 3 — Persist analysis
    const analysis = await storage.createAnalysis({
      brand_id: brand.id,
      source_url: targetUrl,
      raw_title: page.title,
      raw_content: page.text.slice(0, 5000),
      brand_summary: null,
    });

    // Step 4 — Persist claims
    await storage.createClaims(
      result.claims.map((c) => ({
        analysis_id: analysis.id,
        brand_id: brand.id,
        claim_text: c.claim_text,
        category: c.category,
        risk_level: c.risk_level,
        risk_labels: c.risk_labels,
        context: c.context || null,
        explanation: c.explanation || null,
        confidence: c.confidence,
      })),
    );

    // Step 5 — Create article (PENDING — requires human review)
    const slug = `${brand_slug}-${analysis.id.slice(0, 8)}`;
    const article = await storage.createArticle({
      analysis_id: analysis.id,
      brand_id: brand.id,
      slug,
      title: result.article.title,
      subtitle: result.article.subtitle,
      excerpt: result.article.excerpt,
      body: result.article.body,
      tags: result.article.tags,
      blocks: result.article.blocks,
      is_investigation: result.article.is_investigation,
      review_status: "pending",
      published_at: null,
      review_note: null,
    });

    // Step 6 — Fetch claims back for response
    const claims = await storage.getClaimsByAnalysis(analysis.id);

    // Step 7 — Send email notification
    const highRiskCount = claims.filter(
      (c) => c.risk_level === "high" || c.risk_level === "critical",
    ).length;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
    await sendReviewNotification(
      "maxiqin1027@gmail.com",
      brand.name,
      result.article.title,
      claims.length,
      highRiskCount,
      `${siteUrl}/review`,
    ).catch((e) => console.error("[Email notify] Failed:", e));

    return NextResponse.json({
      success: true,
      article,
      claims,
      review_note:
        "Article saved as 'pending'. Use PATCH /api/review to change status to 'published' after human review.",
    });
  } catch (error) {
    console.error("[Analyze] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    );
  }
}
