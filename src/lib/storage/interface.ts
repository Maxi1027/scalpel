import type {
  StoredBrand,
  StoredAnalysis,
  StoredClaim,
  StoredArticle,
  ReviewStatus,
} from "./types";

export interface StorageInterface {
  // -- Brands --
  getBrands(): Promise<StoredBrand[]>;
  getBrandBySlug(slug: string): Promise<StoredBrand | null>;
  getBrandById(id: string): Promise<StoredBrand | null>;

  // -- Analyses --
  createAnalysis(data: Omit<StoredAnalysis, "id" | "created_at">): Promise<StoredAnalysis>;
  getAnalysisById(id: string): Promise<StoredAnalysis | null>;
  getAnalysesByBrand(brandId: string): Promise<StoredAnalysis[]>;

  // -- Claims --
  createClaims(claims: Omit<StoredClaim, "id" | "created_at">[]): Promise<StoredClaim[]>;
  getClaimsByAnalysis(analysisId: string): Promise<StoredClaim[]>;
  getClaimsByBrand(brandId: string): Promise<StoredClaim[]>;

  // -- Articles --
  createArticle(data: Omit<StoredArticle, "id" | "created_at" | "updated_at">): Promise<StoredArticle>;
  getArticleBySlug(slug: string): Promise<StoredArticle | null>;
  getArticleById(id: string): Promise<StoredArticle | null>;
  getArticles(options?: {
    status?: ReviewStatus;
    brandId?: string;
    limit?: number;
    featured?: boolean;
  }): Promise<StoredArticle[]>;
  updateArticleStatus(id: string, status: ReviewStatus, note?: string): Promise<StoredArticle>;
  updateArticle(id: string, data: Partial<StoredArticle>): Promise<StoredArticle>;
  getArticlesByBrandSlug(slug: string): Promise<StoredArticle[]>;
}
