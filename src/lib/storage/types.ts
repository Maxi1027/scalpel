import type { ClaimCategory, RiskLabel, RiskLevel, AnalysisBlock } from "@/types";

export type ReviewStatus = "pending" | "reviewed" | "published";

export interface StoredBrand {
  id: string;
  slug: string;
  name: string;
  name_zh: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
  founded: string | null;
  headquarters: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredAnalysis {
  id: string;
  brand_id: string;
  source_url: string;
  raw_title: string;
  raw_content: string;
  brand_summary: string | null;
  created_at: string;
}

export interface StoredClaim {
  id: string;
  analysis_id: string;
  brand_id: string;
  claim_text: string;
  category: ClaimCategory;
  risk_level: RiskLevel;
  risk_labels: RiskLabel[];
  context: string | null;
  explanation: string | null;
  confidence: number;
  created_at: string;
}

export interface StoredArticle {
  id: string;
  analysis_id: string | null;
  brand_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string;
  tags: string[];
  blocks: AnalysisBlock[];
  is_investigation: boolean;
  review_status: ReviewStatus;
  review_note: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
