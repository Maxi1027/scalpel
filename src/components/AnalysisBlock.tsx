import type { AnalysisBlock as AnalysisBlockType } from "@/types";

interface Props {
  block: AnalysisBlockType;
}

const COLORS: Record<string, string> = {
  narrative_breakdown: "border-l-neutral-500",
  risk_assessment: "border-l-amber-500",
  language_analysis: "border-l-blue-500",
  context: "border-l-neutral-500",
  verdict: "border-l-emerald-500",
};

const LABELS: Record<string, string> = {
  narrative_breakdown: "Narrative Breakdown",
  risk_assessment: "Risk Assessment",
  language_analysis: "Language Analysis",
  context: "Context",
  verdict: "Verdict",
};

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
}

function renderContent(content: string) {
  return content.split(/\n\n+/).map((block, i) => {
    const cleaned = cleanMarkdown(block).trim();
    if (!cleaned) return null;

    // Numbered list item: "1. text"
    if (/^\d+\.\s/.test(cleaned)) {
      const items = cleaned.split(/\n(?=\d+\.\s)/);
      return (
        <ol key={i} className="list-decimal pl-4 space-y-1 my-2">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-[#a3a3a3] leading-relaxed pl-1">
              {item.replace(/^\d+\.\s/, "")}
            </li>
          ))}
        </ol>
      );
    }

    // Bullet list: "- text" or "• text"
    if (/^[-•]\s/.test(cleaned)) {
      const items = cleaned.split(/\n(?=[-•]\s)/);
      return (
        <ul key={i} className="list-disc pl-4 space-y-1 my-2">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-[#a3a3a3] leading-relaxed pl-1">
              {item.replace(/^[-•]\s/, "")}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={i} className="text-sm text-[#a3a3a3] leading-relaxed">
        {cleaned}
      </p>
    );
  });
}

export function AnalysisBlock({ block }: Props) {
  const color = COLORS[block.type] || "border-l-neutral-500";
  const label = LABELS[block.type] || block.type;

  return (
    <div className={`border-l-2 ${color} pl-6 py-4 my-6`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[0.625rem] font-medium tracking-widest uppercase text-[var(--muted)]">
          {label}
        </span>
      </div>
      <h3 className="text-lg font-medium mb-2 text-white">
        {cleanMarkdown(block.heading)}
      </h3>
      <div className="space-y-1">{renderContent(block.content)}</div>
    </div>
  );
}
