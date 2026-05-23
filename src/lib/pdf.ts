import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import path from "path";
import os from "os";

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  title?: string;
}> {
  const tmpDir = path.join(os.tmpdir(), "scalpel-pdf");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const ts = Date.now();
  const pdfPath = path.join(tmpDir, `pdf-${ts}.pdf`);
  const scriptPath = path.join(tmpDir, `extract-${ts}.py`);
  writeFileSync(pdfPath, buffer);

  const pythonScript = `import sys, json
try:
    import PyPDF2
    reader = PyPDF2.PdfReader(sys.argv[1])
    text_parts = []
    title = None
    for i in range(min(3, len(reader.pages))):
        t = (reader.pages[i].extract_text() or '')
        if not title and t.strip():
            title = t.strip().split('\\\\n')[0][:200]
    for i in range(len(reader.pages)):
        t = (reader.pages[i].extract_text() or '')
        text_parts.append(t)
        if len(' '.join(text_parts)) > 40000:
            break
    full_text = ' '.join(text_parts)
    full_text = ' '.join(full_text.split())[:30000]
    print(json.dumps({'ok': True, 'text': full_text, 'title': title}, ensure_ascii=False))
except Exception as e:
    print(json.dumps({'ok': False, 'error': str(e)}, ensure_ascii=False))
`;

  writeFileSync(scriptPath, pythonScript, "utf-8");

  try {
    const output = execSync(`python3 "${scriptPath}" "${pdfPath}"`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    const result = JSON.parse(output);
    if (!result.ok) {
      throw new Error(result.error);
    }

    return {
      text: result.text || "",
      title: result.title || undefined,
    };
  } finally {
    try { unlinkSync(pdfPath); } catch {}
    try { unlinkSync(scriptPath); } catch {}
  }
}
