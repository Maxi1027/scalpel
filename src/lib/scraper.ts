import * as cheerio from "cheerio";
import { extractPdfText } from "./pdf";

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  html: string;
  links: string[];
  isPdf: boolean;
}

export async function scrapeUrl(url: string): Promise<ScrapedPage> {
  // Detect PDF by extension
  const isPdfUrl = url.toLowerCase().endsWith(".pdf") ||
    url.toLowerCase().includes(".pdf?");

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ScalpelBot/1.0; +https://scalpelonline.com)",
      Accept: isPdfUrl
        ? "application/pdf,text/html,*/*"
        : "text/html,application/xhtml+xml",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  // Check Content-Type for PDF
  const contentType = res.headers.get("content-type") || "";
  const isPdfResponse = contentType.includes("application/pdf") ||
    contentType.includes("binary/octet-stream");

  if (isPdfUrl || isPdfResponse) {
    return scrapePdf(url, res);
  }

  return scrapeHtml(url, res);
}

async function scrapePdf(
  url: string,
  res: Response,
): Promise<ScrapedPage> {
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text = "";
  try {
    const data = await extractPdfText(buffer);
    text = data.text.slice(0, 30000); // PDFs can be huge, cap at 30K chars

    return {
      url,
      title: data.title || extractPdfTitle(text),
      text,
      html: "",
      links: extractPdfLinks(text),
      isPdf: true,
    };
  } catch (e) {
    console.error(`[Scraper] PDF parse error for ${url}:`, e);
    return {
      url,
      title: "PDF Parse Failed",
      text: "",
      html: "",
      links: [],
      isPdf: true,
    };
  }
}

async function scrapeHtml(
  url: string,
  res: Response,
): Promise<ScrapedPage> {
  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, .sidebar, .nav, .menu").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim();
  const body = $("body");
  const text = body
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      try {
        const absolute = new URL(href, url).href;
        if (absolute.startsWith("http")) links.push(absolute);
      } catch {
        // skip invalid
      }
    }
  });

  return { url, title, text, html, links: [...new Set(links)], isPdf: false };
}

function extractPdfTitle(text: string): string {
  const firstLine = text.split(/[.\n]/)[0];
  return firstLine?.trim().slice(0, 120) || "ESG Report";
}

function extractPdfLinks(text: string): string[] {
  // Extract URLs from PDF text
  const urlPattern = /https?:\/\/[^\s)]+/g;
  const matches = text.match(urlPattern) || [];
  return [...new Set(matches)].slice(0, 20);
}
