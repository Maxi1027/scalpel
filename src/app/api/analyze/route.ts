import { NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBrandContent } from "@/lib/analyzer";
import storage from "@/lib/storage";
import { sendReviewNotification } from "@/lib/email";

const DEFAULT_URLS: Record<string, string[]> = {
  shein: ["https://www.sheingroup.com/sustainability"],
  temu: ["https://www.temu.com/sustainability.html"],
  ur: ["https://www.urbanrevivo.com/en/sustainability"],
  peacebird: ["https://www.peacebird.com"],
  anta: ["https://ir.anta.com/en/esg"],
  lining: ["https://www.lining.com"],
  xtep: ["https://www.xtep.com"],
  bosideng: ["https://www.bosideng.com/en"],
  snowflying: ["https://www.snowflying.com"],
  miniso: ["https://www.miniso.com/social/"],
  popmart: ["https://www.popmart.com"],
  beneunder: ["https://www.beneunder.com"],
  perfectdiary: ["https://www.perfectdiary.com"],
  florasis: ["https://www.florasis.com"],
  proya: ["https://www.proya.com"],
};

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

    const urls = DEFAULT_URLS[brand_slug] || [];
    const targetUrl = url || urls[0];
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: `No URL configured for: ${brand_slug}` },
        { status: 400 },
      );
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
