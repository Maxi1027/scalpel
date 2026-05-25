import { NextResponse } from "next/server";
import { analyzeBrandFromResearch } from "@/lib/analyzer";
import type { ResearchBrief } from "@/lib/analyzer";
import storage from "@/lib/storage";
import { sendReviewNotification } from "@/lib/email";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand_slug, brief } = body as { brand_slug: string; brief: ResearchBrief };

    if (!brand_slug || !brief) {
      return NextResponse.json(
        { success: false, error: "brand_slug and brief are required" },
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

    console.log(`[Research] Analyzing ${brand.name} from verified data (${brief.datapoints.length} datapoints)`);

    // Generate claims and article from research data
    const result = await analyzeBrandFromResearch(brief);

    // Extract actual sources from the research brief
    const sources = [...new Set(brief.datapoints.map((d) => d.source))];
    const sourceList = sources.join(" | ");

    // Save analysis
    const analysis = await storage.createAnalysis({
      brand_id: brand.id,
      source_url: sourceList,
      raw_title: brief.summary,
      raw_content: JSON.stringify(brief),
      brand_summary: null,
    });

    // Save claims
    if (result.claims.length > 0) {
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
    }

    // Create article
    const articleSlug = `${brand_slug}-${analysis.id.slice(0, 8)}`;
    const article = await storage.createArticle({
      analysis_id: analysis.id,
      brand_id: brand.id,
      slug: articleSlug,
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

    // Notify
    const highRiskCount = result.claims.filter(
      (c) => c.risk_level === "high" || c.risk_level === "critical",
    ).length;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
    await sendReviewNotification(
      "maxiqin1027@gmail.com",
      brand.name,
      article.title,
      result.claims.length,
      highRiskCount,
      `${siteUrl}/review`,
    ).catch((e) => console.error("[Research notify] Failed:", e));

    return NextResponse.json({
      success: true,
      article,
      claims_count: result.claims.length,
      review_note: "Article saved as 'pending'. Generated from verified research data.",
    });
  } catch (error) {
    console.error("[Research] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Research analysis failed" },
      { status: 500 },
    );
  }
}
