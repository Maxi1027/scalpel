import { createClient } from "@supabase/supabase-js";
import type { StorageInterface } from "./interface";
import type {
  StoredBrand,
  StoredAnalysis,
  StoredClaim,
  StoredArticle,
  ReviewStatus,
} from "./types";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase credentials not configured");
  return createClient(url, key);
}

export class SupabaseStorage implements StorageInterface {
  // -- Brands --

  async getBrands(): Promise<StoredBrand[]> {
    const { data } = await getClient().from("brands").select("*").order("name");
    return (data || []) as StoredBrand[];
  }

  async getBrandBySlug(slug: string): Promise<StoredBrand | null> {
    const { data } = await getClient()
      .from("brands")
      .select("*")
      .eq("slug", slug)
      .single();
    return (data as StoredBrand) || null;
  }

  async getBrandById(id: string): Promise<StoredBrand | null> {
    const { data } = await getClient()
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();
    return (data as StoredBrand) || null;
  }

  // -- Analyses --

  async createAnalysis(
    data: Omit<StoredAnalysis, "id" | "created_at">,
  ): Promise<StoredAnalysis> {
    const { data: created } = await getClient()
      .from("analyses")
      .insert(data)
      .select()
      .single();
    return created as StoredAnalysis;
  }

  async getAnalysisById(id: string): Promise<StoredAnalysis | null> {
    const { data } = await getClient()
      .from("analyses")
      .select("*")
      .eq("id", id)
      .single();
    return (data as StoredAnalysis) || null;
  }

  async getAnalysesByBrand(brandId: string): Promise<StoredAnalysis[]> {
    const { data } = await getClient()
      .from("analyses")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });
    return (data || []) as StoredAnalysis[];
  }

  // -- Claims --

  async createClaims(
    claims: Omit<StoredClaim, "id" | "created_at">[],
  ): Promise<StoredClaim[]> {
    const { data } = await getClient()
      .from("claims")
      .insert(claims)
      .select();
    return (data || []) as StoredClaim[];
  }

  async getClaimsByAnalysis(analysisId: string): Promise<StoredClaim[]> {
    const { data } = await getClient()
      .from("claims")
      .select("*")
      .eq("analysis_id", analysisId);
    return (data || []) as StoredClaim[];
  }

  async getClaimsByBrand(brandId: string): Promise<StoredClaim[]> {
    const { data } = await getClient()
      .from("claims")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });
    return (data || []) as StoredClaim[];
  }

  // -- Articles --

  async createArticle(
    data: Omit<StoredArticle, "id" | "created_at" | "updated_at">,
  ): Promise<StoredArticle> {
    const { data: created } = await getClient()
      .from("articles")
      .insert(data)
      .select()
      .single();
    return created as StoredArticle;
  }

  async getArticleBySlug(slug: string): Promise<StoredArticle | null> {
    const { data } = await getClient()
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .single();
    return (data as StoredArticle) || null;
  }

  async getArticleById(id: string): Promise<StoredArticle | null> {
    const { data } = await getClient()
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();
    return (data as StoredArticle) || null;
  }

  async getArticles(options?: {
    status?: ReviewStatus;
    brandId?: string;
    limit?: number;
    featured?: boolean;
  }): Promise<StoredArticle[]> {
    let query = getClient().from("articles").select("*");

    if (options?.status) {
      query = query.eq("review_status", options.status);
    }
    if (options?.brandId) {
      query = query.eq("brand_id", options.brandId);
    }
    if (options?.featured) {
      query = query.eq("is_investigation", true);
    }

    query = query.order("published_at", { ascending: false, nullsFirst: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data } = await query;
    return (data || []) as StoredArticle[];
  }

  async updateArticleStatus(
    id: string,
    status: ReviewStatus,
    note?: string,
  ): Promise<StoredArticle> {
    const updates: Record<string, unknown> = {
      review_status: status,
      updated_at: new Date().toISOString(),
    };
    if (note !== undefined) updates.review_note = note;
    if (status === "published") updates.published_at = new Date().toISOString();

    const { data } = await getClient()
      .from("articles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return data as StoredArticle;
  }

  async updateArticle(
    id: string,
    data: Partial<StoredArticle>,
  ): Promise<StoredArticle> {
    const { data: updated } = await getClient()
      .from("articles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return updated as StoredArticle;
  }

  async getArticlesByBrandSlug(slug: string): Promise<StoredArticle[]> {
    const brand = await this.getBrandBySlug(slug);
    if (!brand) return [];
    return this.getArticles({ brandId: brand.id, status: "published" });
  }
}
