import { NextResponse } from "next/server";
import storage from "@/lib/storage";

export async function GET() {
  const articles = await storage.getArticles({ status: "published" });
  return NextResponse.json({ success: true, articles });
}
