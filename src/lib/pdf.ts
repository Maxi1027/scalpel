import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  title?: string;
}> {
  // Convert Buffer to Uint8Array for pdfjs
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, disableAutoFetch: true }).promise;

  const parts: string[] = [];
  let title: string | undefined;

  // Extract text from all pages (cap at ~30K chars)
  for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    if (!title && pageText.trim()) {
      title = pageText.trim().split(/[.\n]/)[0]?.slice(0, 200);
    }

    parts.push(pageText);
    if (parts.join(" ").length > 30000) break;
  }

  const text = parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 30000);

  return { text, title: title || undefined };
}
