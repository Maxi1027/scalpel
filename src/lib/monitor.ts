import storage from "@/lib/storage";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBrandMultiSource } from "@/lib/analyzer";
import type { SourceInput } from "@/lib/analyzer";
import { sendReviewNotification } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ---- ESG URL Discovery --------------------------------------

interface DiscoveredTarget {
  url: string;
  label: string;
}

// Brands known to be publicly listed — used to search IR sites for ESG reports
const LISTED_BRANDS: Record<string, { exchange: string; ticker: string; irHost?: string }> = {
  anta: { exchange: "HKEX", ticker: "2020", irHost: "ir.anta.com" },
  lining: { exchange: "HKEX", ticker: "2331", irHost: "ir.lining.com" },
  xtep: { exchange: "HKEX", ticker: "1368", irHost: "www.xtep.com.hk" },
  bosideng: { exchange: "HKEX", ticker: "3998", irHost: "company.bosideng.com" },
  proya: { exchange: "SSE", ticker: "603605", irHost: "proya-group.com" },
  perfectdiary: { exchange: "NYSE", ticker: "YSG", irHost: "ir.yatsenglobal.com" },
  peacebird: { exchange: "SSE", ticker: "603877" },
  miniso: { exchange: "HKEX", ticker: "9896", irHost: "ir.miniso.com" },
  popmart: { exchange: "HKEX", ticker: "9992", irHost: "ir.popmart.com" },
  temu: { exchange: "NASDAQ", ticker: "PDD", irHost: "investor.pddholdings.com" },
  shein: { exchange: "PRIVATE", ticker: "" },
  ur: { exchange: "PRIVATE", ticker: "" },
  beneunder: { exchange: "PRIVATE", ticker: "" },
  florasis: { exchange: "PRIVATE", ticker: "" },
  snowflying: { exchange: "SUBSIDIARY", ticker: "3998" }, // Bosideng subsidiary
};

/**
 * Generate candidate ESG report PDF URLs based on known patterns for IR sites.
 * irasia.com hosts ESG reports for many HKEX-listed Chinese companies.
 */
function generatePdfCandidates(brandSlug: string, website: string): DiscoveredTarget[] {
  const candidates: DiscoveredTarget[] = [];
  const listing = LISTED_BRANDS[brandSlug];
  const host = (() => { try { return new URL(website).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const baseDomain = host.split(".").slice(-2).join(".");

  // Common IR file hosting patterns
  if (listing?.exchange === "HKEX") {
    const ticker = listing.ticker;
    candidates.push(
      { url: `https://doc.irasia.com/listco/hk/${host.split(".")[0]}/annual/esr${ticker}.pdf`, label: "ESG Report (irasia)" },
      { url: `https://doc.irasia.com/listco/hk/${host.split(".")[0]}/esg/esr.pdf`, label: "ESG Report (irasia)" },
    );
    // Try listing IR host
    if (listing.irHost) {
      candidates.push(
        { url: `https://${listing.irHost}/en/esg`, label: "IR ESG Page" },
        { url: `https://${listing.irHost}/en/sustainability`, label: "IR Sustainability" },
      );
    }
  }

  // Generic ESG PDF patterns
  const pdfPaths = [
    "/sustainability/report.pdf",
    "/esg/report.pdf",
    "/esg/esg-report.pdf",
    "/sustainability/esg-report.pdf",
    "/en/sustainability/report.pdf",
    "/brand/esg-report.pdf",
  ];
  for (const p of pdfPaths) {
    try {
      candidates.push({ url: `${new URL(website).origin}${p}`, label: `ESG PDF (${p})` });
    } catch { /* skip */ }
  }

  // Try sustainability subdomain for PDFs
  candidates.push(
    { url: `https://sustainability.${baseDomain}/en/media/crreport/crreport2025.pdf`, label: "Climate Report PDF" },
    { url: `https://sustainability.${baseDomain}/sc/media/document.php`, label: "Sustainability Documents" },
  );

  return candidates;
}

/**
 * Given a brand's main website domain, generate candidate ESG HTML page URLs.
 */
function generateCandidates(website: string): DiscoveredTarget[] {
  const candidates: DiscoveredTarget[] = [];

  try {
    const parsed = new URL(website);
    const base = parsed.origin;
    const host = parsed.hostname.replace(/^www\./, "");
    const domainParts = host.split(".");

    const paths = [
      "/sustainability", "/en/sustainability",
      "/esg", "/en/esg",
      "/csr", "/en/csr",
      "/brand/esg.html", "/brand/sustainability.html",
      "/social-responsibility", "/corporate-responsibility",
      "/sustainability.html",
      "/social", "/social/",
    ];
    for (const p of paths) {
      candidates.push({ url: `${base}${p}`, label: `ESG Page (${p})` });
    }

    candidates.push(
      { url: `https://esg.${host}`, label: "ESG Subdomain" },
      { url: `https://sustainability.${host}`, label: "Sustainability Subdomain" },
      { url: `https://ir.${host}/en/esg`, label: "IR ESG (EN)" },
      { url: `https://ir.${host}/en/csr`, label: "IR CSR (EN)" },
      { url: `https://ir.${host}/en/sustainability`, label: "IR Sustainability (EN)" },
    );

    if (domainParts.length >= 2) {
      const corpName = domainParts[domainParts.length - 2];
      candidates.push(
        { url: `https://www.${corpName}-group.com/en/manage`, label: "Corporate ESG" },
        { url: `https://${corpName}-group.com/en/manage`, label: "Corporate ESG" },
      );
    }
  } catch { /* skip */ }

  return candidates;
}

/**
 * Quick-test candidate URLs with a HEAD request.
 */
async function testUrls(candidates: DiscoveredTarget[]): Promise<DiscoveredTarget[]> {
  const results: DiscoveredTarget[] = [];
  const batchSize = 5;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const tests = await Promise.all(
      batch.map(async (c) => {
        try {
          const res = await fetch(c.url, {
            method: "HEAD",
            headers: { "User-Agent": "Mozilla/5.0 (compatible; ScalpelBot/1.0)" },
            signal: AbortSignal.timeout(8000),
            redirect: "follow",
          });
          if (res.ok || res.status === 301 || res.status === 302) return c;
        } catch { /* unreachable */ }
        return null;
      }),
    );
    for (const t of tests) {
      if (t && !results.some((r) => r.url === t.url)) results.push(t);
    }
  }
  return results;
}

/**
 * Discover ESG URLs for a brand: HTML pages + PDF reports.
 * 1. Generate + test candidate ESG page URLs
 * 2. Generate + test candidate ESG report PDF URLs
 * 3. Scrape discovered HTML pages to find linked PDFs
 * 4. Returns combined results, prioritizing PDFs first
 */
export async function discoverEsgUrls(
  brandSlug: string,
  website: string,
  manualUrls: DiscoveredTarget[],
): Promise<DiscoveredTarget[]> {
  const scrapedPdfLinks: DiscoveredTarget[] = [];

  // 1. Discover HTML ESG pages
  const htmlCandidates = generateCandidates(website);
  const htmlResults = await testUrls(htmlCandidates);

  // 2. Discover PDF candidates from IR sites
  const pdfCandidates = generatePdfCandidates(brandSlug, website);
  const pdfResults = await testUrls(pdfCandidates);

  // 3. Scrape discovered HTML pages to find linked PDF reports
  for (const page of htmlResults.slice(0, 3)) {
    try {
      const res = await fetch(page.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ScalpelBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Extract PDF links
      const pdfMatches = html.match(/href="([^"]+\.pdf[^"]*)"/gi) || [];
      for (const match of pdfMatches) {
        const href = match.replace(/href="/i, "").replace(/"$/, "");
        try {
          const absolute = new URL(href, page.url).href;
          if (!scrapedPdfLinks.some((p) => p.url === absolute)) {
            // Derive a label from the filename
            const filename = absolute.split("/").pop()?.replace(/\.pdf$/i, "") || "Report";
            const label = `ESG Report PDF: ${filename.slice(0, 50)}`;
            scrapedPdfLinks.push({ url: absolute, label });
          }
        } catch { /* skip invalid URLs */ }
      }
    } catch { /* skip failed scrapes */ }
  }

  // Verify scraped PDF links
  const verifiedPdfs = await testUrls(scrapedPdfLinks.slice(0, 10));

  // 4. Combine: PDFs first (primary source), then HTML pages, then manual overrides
  const all: DiscoveredTarget[] = [];
  for (const m of manualUrls) all.push(m);
  for (const p of verifiedPdfs) { if (!all.some((a) => a.url === p.url)) all.push(p); }
  for (const p of pdfResults) { if (!all.some((a) => a.url === p.url)) all.push(p); }
  for (const h of htmlResults) { if (!all.some((a) => a.url === h.url)) all.push(h); }

  // Cap at 8 URLs, PDFs first
  return all.slice(0, 8);
}

// ---- Manual Override Config ---------------------------------
// Only for URLs that discovery can't find (PDFs, unusual paths, parent co sites)

const MANUAL_OVERRIDES: Record<string, DiscoveredTarget[]> = {
  shein: [
    { url: "https://www.sheingroup.com/sustainability", label: "Sustainability Page" },
  ],
  miniso: [
    { url: "https://www.miniso.com/vancheerfile/files/2025/6/2025061115126273.pdf", label: "2024 ESG Report (PDF)" },
  ],
  perfectdiary: [
    { url: "https://www.yatsenglobal.com/kcxfzesg", label: "ESG Page (corporate)" },
  ],
  proya: [
    { url: "https://proya-group.com/en/manage", label: "ESG Management (EN)" },
  ],
  ur: [
    { url: "https://fmg.com.cn", label: "Parent Co (FMG Group)" },
  ],
  snowflying: [
    { url: "https://sustainability.bosideng.com/tc/", label: "Bosideng Group ESG (parent)" },
  ],
  bosideng: [
    { url: "https://doc.irasia.com/listco/hk/bosideng/annual/esr320949-e_her25060008_e_bosideng_esg24_25%282250%29_3478.pdf", label: "2024/25 ESG Report (PDF)" },
  ],
};

// ---- State Tracking (Supabase) ------------------------------
interface MonitorState {
  id?: string;
  brand_slug: string;
  url: string;
  last_content_hash: string | null;
  last_scraped_at: string | null;
  last_analysis_id: string | null;
  last_change_detected_at: string | null;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

export async function loadState(): Promise<MonitorState[]> {
  try {
    const { data } = await getSupabase().from("monitor_state").select("*");
    return (data || []) as MonitorState[];
  } catch {
    return [];
  }
}

async function saveStateEntry(entry: MonitorState): Promise<void> {
  try {
    const supabase = getSupabase();
    if (entry.id) {
      await supabase.from("monitor_state").update({
        last_content_hash: entry.last_content_hash,
        last_scraped_at: entry.last_scraped_at,
        last_analysis_id: entry.last_analysis_id,
        last_change_detected_at: entry.last_change_detected_at,
        updated_at: new Date().toISOString(),
      }).eq("id", entry.id);
    } else {
      const { data } = await supabase.from("monitor_state").insert({
        brand_slug: entry.brand_slug,
        url: entry.url,
        last_content_hash: entry.last_content_hash,
        last_scraped_at: entry.last_scraped_at,
        last_analysis_id: entry.last_analysis_id,
        last_change_detected_at: entry.last_change_detected_at,
      }).select().single();
      if (data) entry.id = (data as MonitorState).id;
    }
  } catch {
    // Table may not exist yet — run the migration SQL in Supabase dashboard
  }
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

  const canAnalyze = !!process.env.DEEPSEEK_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

  // Get brands to scan
  const allBrands = await storage.getBrands();
  const brands = options?.brandSlug
    ? allBrands.filter((b) => b.slug === options.brandSlug)
    : allBrands;

  for (const brand of brands) {
    if (!brand.website) {
      console.log(`  [Monitor] Skip ${brand.name}: no website configured`);
      continue;
    }

    // ---- Phase 0: Discover ESG URLs ----
    const manualOverrides = MANUAL_OVERRIDES[brand.slug] || [];
    const targets = await discoverEsgUrls(brand.slug, brand.website, manualOverrides);

    if (targets.length === 0) {
      // Fallback: just use the brand's main website
      targets.push({ url: brand.website, label: "Main Website (fallback)" });
    }

    console.log(`  [Monitor] ${brand.name}: ${targets.length} URLs to scan`);
    for (const t of targets) {
      console.log(`    → ${t.url} (${t.label})`);
    }

    // ---- Phase 1: Scrape ALL discovered URLs ----
    const scrapedSources: SourceInput[] = [];
    let hasAnyChange = false;

    for (const target of targets) {
      scanned++;
      console.log(`  [Monitor] Scraping ${brand.name}: ${target.url} (${target.label})`);

      try {
        const page = await scrapeUrl(target.url);

        // Skip truly empty pages, but keep SPA shells (which may have 50+ chars of meta/nav text)
        if (page.text.length < 30 && !page.isPdf) {
          console.log(`  [Monitor]   Empty page (${page.text.length} chars), skipping`);
          continue;
        }

        const newHash = hashContent(page.text);

        let entry = state.find((s) => s.brand_slug === brand.slug && s.url === target.url);
        const changed = options?.forceAll || !entry || entry.last_content_hash !== newHash;

        if (changed) {
          hasAnyChange = true;
          console.log(`  [Monitor] ✓ CHANGE: ${brand.name} — ${target.label} (${page.text.length} chars)`);
        } else {
          console.log(`  [Monitor]   No change: ${brand.name} — ${target.label}`);
        }

        // Update state
        if (!entry) {
          entry = {
            brand_slug: brand.slug, url: target.url,
            last_content_hash: newHash,
            last_scraped_at: new Date().toISOString(),
            last_analysis_id: null,
            last_change_detected_at: changed ? new Date().toISOString() : null,
          };
          state.push(entry);
          await saveStateEntry(entry);
        } else {
          entry.last_content_hash = newHash;
          entry.last_scraped_at = new Date().toISOString();
          if (changed) entry.last_change_detected_at = new Date().toISOString();
          await saveStateEntry(entry);
        }

        // Collect content for multi-source analysis
        scrapedSources.push({ url: target.url, label: target.label, text: page.text });

        results.push({
          brand_slug: brand.slug, brand_name: brand.name,
          url: target.url, label: target.label,
          changed, analysis_triggered: false,
          article_id: null, article_title: null, article_slug: null,
          error: null,
        });
      } catch (err) {
        console.error(`  [Monitor] ✗ Scrape error: ${target.url}`, err);
        results.push({
          brand_slug: brand.slug, brand_name: brand.name,
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
        if (analysisResult.claims.length > 0) {
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
        }

        // Create ONE article
        const articleSlug = `${brand.slug}-${analysis.id.slice(0, 8)}`;
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
          const e = state.find((s) => s.brand_slug === brand.slug && s.url === target.url);
          if (e) { e.last_analysis_id = article.id; await saveStateEntry(e); }
        }

        // Mark the brand's last result
        const brandResults = results.filter((r) => r.brand_slug === brand.slug);
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

  console.log(
    `\n[Monitor] Done. Scanned: ${scanned} URLs. Brands with changes: ${brandsWithChanges}.`,
  );

  return { scanned, changed: brandsWithChanges, results };
}
