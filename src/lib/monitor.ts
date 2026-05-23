import storage from "@/lib/storage";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBrandMultiSource } from "@/lib/analyzer";
import type { SourceInput } from "@/lib/analyzer";
import { sendReviewNotification } from "@/lib/email";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ---- Monitoring URL Config --------------------------------
interface MonitorTarget {
  url: string;
  label: string;
}

const MONITOR_CONFIG: Record<string, MonitorTarget[]> = {
  shein: [
    { url: "https://www.sheingroup.com/sustainability", label: "Sustainability Page" },
  ],
  temu: [
    { url: "https://www.temu.com/sustainability.html", label: "Sustainability Page" },
  ],
  ur: [
    { url: "https://www.urbanrevivo.com/en/sustainability", label: "Sustainability Page" },
  ],
  peacebird: [
    { url: "https://www.peacebird.com", label: "Main Site" },
  ],
  anta: [
    { url: "https://ir.anta.com/en/esg", label: "ESG Page" },
  ],
  lining: [
    { url: "https://www.lining.com", label: "Main Site" },
  ],
  xtep: [
    { url: "https://www.xtep.com", label: "Main Site" },
  ],
  bosideng: [
    { url: "https://www.bosideng.com/en", label: "English Site" },
  ],
  snowflying: [
    { url: "https://www.snowflying.com", label: "Main Site" },
  ],
  miniso: [
    { url: "https://www.miniso.com/social/", label: "ESG Page" },
    { url: "https://www.miniso.com/vancheerfile/files/2025/6/2025061115126273.pdf", label: "2024 ESG Report (PDF)" },
  ],
  popmart: [
    { url: "https://www.popmart.com", label: "Main Site" },
  ],
  beneunder: [
    { url: "https://www.beneunder.com", label: "Main Site" },
  ],
  perfectdiary: [
    { url: "https://www.perfectdiary.com", label: "Main Site" },
  ],
  florasis: [
    { url: "https://www.florasis.com", label: "Main Site" },
  ],
  proya: [
    { url: "https://www.proya.com", label: "Main Site" },
  ],
};

// ---- State Tracking ---------------------------------------
interface MonitorState {
  brand_slug: string;
  url: string;
  last_content_hash: string | null;
  last_scraped_at: string | null;
  last_analysis_id: string | null;
  last_change_detected_at: string | null;
}

const STATE_FILE = path.join(process.cwd(), "data", "monitoring.json");

export async function loadState(): Promise<MonitorState[]> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveState(state: MonitorState[]): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function hashContent(text: string): string {
  return crypto.createHash("sha256").update(text.slice(0, 8000)).digest("hex");
}

// ---- Scan Result Type -------------------------------------
export interface ScanResult {
  brand_slug: string;
  brand_name: string;
  url: string;
  label: string;
  changed: boolean;
  analysis_triggered: boolean;
  article_id: string | null;
  article_title: string | null;
  article_slug: string | null;
  error: string | null;
}

// ---- Core Monitor Function --------------------------------
export async function runMonitor(options?: {
  brandSlug?: string;
  forceAll?: boolean;
}): Promise<{ scanned: number; changed: number; results: ScanResult[] }> {
  const state = await loadState();
  const results: ScanResult[] = [];
  let scanned = 0;
  let brandsWithChanges = 0;

  const brandSlugs = options?.brandSlug
    ? [options.brandSlug]
    : Object.keys(MONITOR_CONFIG);

  const canAnalyze = !!process.env.DEEPSEEK_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

  for (const slug of brandSlugs) {
    const targets = MONITOR_CONFIG[slug];
    if (!targets) continue;

    const brand = await storage.getBrandBySlug(slug);
    if (!brand) {
      results.push({
        brand_slug: slug, brand_name: slug, url: "", label: "",
        changed: false, analysis_triggered: false,
        article_id: null, article_title: null, article_slug: null,
        error: `Brand not found: ${slug}`,
      });
      continue;
    }

    // ---- Phase 1: Scrape ALL URLs for this brand ----
    const scrapedSources: SourceInput[] = [];
    let hasAnyChange = false;

    for (const target of targets) {
      scanned++;
      console.log(`  [Monitor] Scraping ${brand.name}: ${target.url} (${target.label})`);

      try {
        const page = await scrapeUrl(target.url);
        const newHash = hashContent(page.text);

        let entry = state.find((s) => s.brand_slug === slug && s.url === target.url);
        const changed = options?.forceAll || !entry || entry.last_content_hash !== newHash;

        if (changed) {
          hasAnyChange = true;
          console.log(`  [Monitor] ✓ CHANGE: ${brand.name} — ${target.label}`);
        } else {
          console.log(`  [Monitor]   No change: ${brand.name} — ${target.label}`);
        }

        // Update state
        if (!entry) {
          entry = {
            brand_slug: slug, url: target.url,
            last_content_hash: newHash,
            last_scraped_at: new Date().toISOString(),
            last_analysis_id: null,
            last_change_detected_at: changed ? new Date().toISOString() : null,
          };
          state.push(entry);
        } else {
          entry.last_content_hash = newHash;
          entry.last_scraped_at = new Date().toISOString();
          if (changed) entry.last_change_detected_at = new Date().toISOString();
        }

        // Collect content for multi-source analysis
        scrapedSources.push({ url: target.url, label: target.label, text: page.text });

        results.push({
          brand_slug: slug, brand_name: brand.name,
          url: target.url, label: target.label,
          changed, analysis_triggered: false,
          article_id: null, article_title: null, article_slug: null,
          error: null,
        });
      } catch (err) {
        console.error(`  [Monitor] ✗ Scrape error: ${target.url}`, err);
        results.push({
          brand_slug: slug, brand_name: brand.name,
          url: target.url, label: target.label,
          changed: false, analysis_triggered: false,
          article_id: null, article_title: null, article_slug: null,
          error: err instanceof Error ? err.message : "Scrape failed",
        });
      }
    }

    // ---- Phase 2: ONE multi-source analysis per brand ----
    if (hasAnyChange && canAnalyze && scrapedSources.length > 0) {
      brandsWithChanges++;
      try {
        console.log(`  [Monitor] 🧠 Multi-source analysis: ${brand.name} (${scrapedSources.length} sources)`);
        const analysisResult = await analyzeBrandMultiSource(
          brand.name,
          brand.name_zh,
          scrapedSources,
        );

        const sourceUrls = scrapedSources.map((s) => s.url).join(" | ");

        // Save analysis
        const analysis = await storage.createAnalysis({
          brand_id: brand.id,
          source_url: sourceUrls,
          raw_title: scrapedSources.map((s) => s.label).join(", "),
          raw_content: scrapedSources.map((s) => s.text).join("\n\n").slice(0, 5000),
          brand_summary: null,
        });

        // Save claims
        await storage.createClaims(
          analysisResult.claims.map((c) => ({
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

        // Create ONE article
        const articleSlug = `${slug}-${analysis.id.slice(0, 8)}`;
        const article = await storage.createArticle({
          analysis_id: analysis.id,
          brand_id: brand.id,
          slug: articleSlug,
          title: analysisResult.article.title,
          subtitle: analysisResult.article.subtitle,
          excerpt: analysisResult.article.excerpt,
          body: analysisResult.article.body,
          tags: analysisResult.article.tags,
          blocks: analysisResult.article.blocks,
          is_investigation: analysisResult.article.is_investigation,
          review_status: "pending",
          published_at: null,
          review_note: null,
        });

        // Update state with analysis ref
        for (const target of targets) {
          const e = state.find((s) => s.brand_slug === slug && s.url === target.url);
          if (e) e.last_analysis_id = article.id;
        }

        // Mark the brand's last result
        const brandResults = results.filter((r) => r.brand_slug === slug);
        const lastResult = brandResults[brandResults.length - 1];
        if (lastResult) {
          lastResult.analysis_triggered = true;
          lastResult.article_id = article.id;
          lastResult.article_title = article.title;
          lastResult.article_slug = articleSlug;
        }

        // Notify
        const highRiskCount = analysisResult.claims.filter(
          (c) => c.risk_level === "high" || c.risk_level === "critical",
        ).length;
        await sendReviewNotification(
          "maxiqin1027@gmail.com",
          brand.name,
          article.title,
          analysisResult.claims.length,
          highRiskCount,
          `${siteUrl}/review`,
        ).catch((e) => console.error("[Monitor notify] Failed:", e));

        console.log(`  [Monitor] ✅ Article: "${article.title}"`);
      } catch (err) {
        console.error(`  [Monitor] ❌ Analysis error for ${brand.name}:`, err);
      }
    } else if (hasAnyChange && !canAnalyze) {
      console.log(`  [Monitor] ⚠ Changes detected for ${brand.name} but no API key`);
    }
  }

  // Persist state
  await saveState(state);

  console.log(
    `\n[Monitor] Done. Scanned: ${scanned} URLs. Brands with changes: ${brandsWithChanges}.`,
  );

  return { scanned, changed: brandsWithChanges, results };
}
