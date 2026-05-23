import { NextResponse } from "next/server";
import storage from "@/lib/storage";
import type { ReviewStatus } from "@/lib/storage";

export async function PATCH(request: Request) {
  try {
    const { article_id, status, note } = await request.json();

    if (!article_id || !status) {
      return NextResponse.json(
        { success: false, error: "article_id and status are required" },
        { status: 400 },
      );
    }

    const valid: ReviewStatus[] = ["pending", "reviewed", "published"];
    if (!valid.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be: ${valid.join(", ")}` },
        { status: 400 },
      );
    }

    const article = await storage.updateArticleStatus(article_id, status, note || undefined);

    return NextResponse.json({
      success: true,
      article,
      note:
        status === "published"
          ? "Article is now live on the website."
          : `Article status updated to '${status}'.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Review update failed",
      },
      { status: 500 },
    );
  }
}

// GET — list articles by review status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ReviewStatus | null;

  const articles = await storage.getArticles({
    status: status || undefined,
  });

  return NextResponse.json({ success: true, articles, count: articles.length });
}
