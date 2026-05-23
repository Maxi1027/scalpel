// -- Brands ------------------------------------------------
export interface Brand {
  id: string;
  slug: string;
  name: string;
  name_zh: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  founded: string | null;
  headquarters: string | null;
  created_at: string;
  updated_at: string;
}

// -- Sources -----------------------------------------------
export type SourceType = "website" | "sustainability_page" | "esg_report" | "press_release" | "wechat" | "xiaohongshu" | "linkedin" | "campaign_page" | "product_page" | "other";

export interface Source {
  id: string;
  brand_id: string;
  url: string;
  title: string | null;
  source_type: SourceType;
  fetched_at: string | null;
  raw_content: string | null;
  created_at: string;
}

// -- Claims ------------------------------------------------
export type ClaimCategory =
  | "sustainability"
  | "circularity"
  | "material"
  | "carbon"
  | "nature_narrative";

export type RiskLabel =
  | "ambiguous_claim"
  | "unsupported_claim"
  | "exaggerated_scope"
  | "visual_greenwashing"
  | "recyclable_confusion"
  | "emotional_sustainability"
  | "selective_disclosure"
  | "offset_dependency";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Claim {
  id: string;
  brand_id: string;
  source_id: string | null;
  category: ClaimCategory;
  risk_level: RiskLevel;
  risk_labels: RiskLabel[];
  claim_text: string;
  context: string | null;
  explanation: string | null;
  confidence: number;
  created_at: string;
}

// -- Articles ----------------------------------------------
export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  featured_image: string | null;
  body: string;
  excerpt: string | null;
  brand_ids: string[];
  claim_ids: string[];
  tags: string[];
  is_featured: boolean;
  is_investigation: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// -- Analysis Blocks ---------------------------------------
export type AnalysisBlockType = "narrative_breakdown" | "risk_assessment" | "language_analysis" | "context" | "verdict";

export interface AnalysisBlock {
  type: AnalysisBlockType;
  heading: string;
  content: string;
}

// -- API types ---------------------------------------------
export interface AnalyzeRequest {
  brand_slug: string;
  url?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  article?: Article & { blocks: AnalysisBlock[] };
  claims?: Claim[];
  error?: string;
}

// -- Narrative Category display ----------------------------
export const CATEGORY_LABELS: Record<ClaimCategory, string> = {
  sustainability: "Sustainability Claims",
  circularity: "Circularity Claims",
  material: "Material Claims",
  carbon: "Carbon Claims",
  nature_narrative: "Nature Narrative",
};

export const RISK_LABELS: Record<RiskLabel, string> = {
  ambiguous_claim: "Ambiguous Claim",
  unsupported_claim: "Unsupported Claim",
  exaggerated_scope: "Exaggerated Scope",
  visual_greenwashing: "Visual Greenwashing",
  recyclable_confusion: "Recyclable Confusion",
  emotional_sustainability: "Emotional Sustainability",
  selective_disclosure: "Selective Disclosure",
  offset_dependency: "Offset Dependency",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-orange-500",
  critical: "text-red-500",
};

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  low: "bg-emerald-400/10 border-emerald-400/30",
  medium: "bg-amber-400/10 border-amber-400/30",
  high: "bg-orange-500/10 border-orange-500/30",
  critical: "bg-red-500/10 border-red-500/30",
};
