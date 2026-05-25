import { NextResponse } from "next/server";
import { runMonitor } from "@/lib/monitor";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { brand_slug, force_all } = body;

    // Require a simple auth token to prevent abuse
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.MONITOR_TOKEN || "scalpel-monitor-dev";
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Use Bearer token." },
        { status: 401 },
      );
    }

    console.log(
      `[Monitor API] Starting scan... ${brand_slug ? `brand: ${brand_slug}` : "all brands"} force: ${!!force_all}`,
    );

    const result = await runMonitor({
      brandSlug: brand_slug || undefined,
      forceAll: force_all || false,
    });

    return NextResponse.json({
      success: true,
      ...result,
      summary: `Scanned ${result.scanned} URLs. Detected ${result.changed} changes. Triggered ${result.results.filter((r) => r.analysis_triggered).length} analyses.`,
    });
  } catch (error) {
    console.error("[Monitor API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Monitor failed",
      },
      { status: 500 },
    );
  }
}

// GET — quick status check of monitoring state
export async function GET() {
  try {
    const { loadState } = await import("@/lib/monitor");
    const state = await loadState();
    return NextResponse.json({
      success: true,
      tracked_urls: state.length,
      last_scans: state
        .sort(
          (a, b) =>
            new Date(b.last_scraped_at || 0).getTime() -
            new Date(a.last_scraped_at || 0).getTime(),
        )
        .slice(0, 20)
        .map((s) => ({
          brand: s.brand_slug,
          url: s.url,
          last_scan: s.last_scraped_at,
          has_analysis: !!s.last_analysis_id,
        })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load state" },
      { status: 500 },
    );
  }
}
