import fs from "fs/promises";
import path from "path";
import type { StorageInterface } from "./interface";
import type {
  StoredBrand,
  StoredAnalysis,
  StoredClaim,
  StoredArticle,
  ReviewStatus,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

// ---- Helpers -----------------------------------------------

async function readTable<T>(name: string): Promise<T[]> {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTable<T>(name: string, data: T[]): Promise<void> {
  const file = path.join(DATA_DIR, `${name}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

function now(): string {
  return new Date().toISOString();
}

// ---- Implementation ----------------------------------------

export class JsonStorage implements StorageInterface {
  // -- Brands --

  async getBrands(): Promise<StoredBrand[]> {
    return readTable<StoredBrand>("brands");
  }

  async getBrandBySlug(slug: string): Promise<StoredBrand | null> {
    const brands = await readTable<StoredBrand>("brands");
    return brands.find((b) => b.slug === slug) || null;
  }

  async getBrandById(id: string): Promise<StoredBrand | null> {
    const brands = await readTable<StoredBrand>("brands");
    return brands.find((b) => b.id === id) || null;
  }

  // -- Analyses --

  async createAnalysis(
    data: Omit<StoredAnalysis, "id" | "created_at">,
  ): Promise<StoredAnalysis> {
    const analyses = await readTable<StoredAnalysis>("analyses");
    const record: StoredAnalysis = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now(),
    };
    analyses.push(record);
    await writeTable("analyses", analyses);
    return record;
  }

  async getAnalysisById(id: string): Promise<StoredAnalysis | null> {
    const analyses = await readTable<StoredAnalysis>("analyses");
    return analyses.find((a) => a.id === id) || null;
  }

  async getAnalysesByBrand(brandId: string): Promise<StoredAnalysis[]> {
    const analyses = await readTable<StoredAnalysis>("analyses");
    return analyses
      .filter((a) => a.brand_id === brandId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // -- Claims --

  async createClaims(
    claims: Omit<StoredClaim, "id" | "created_at">[],
  ): Promise<StoredClaim[]> {
    const all = await readTable<StoredClaim>("claims");
    const records: StoredClaim[] = claims.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      created_at: now(),
    }));
    all.push(...records);
    await writeTable("claims", all);
    return records;
  }

  async getClaimsByAnalysis(analysisId: string): Promise<StoredClaim[]> {
    const claims = await readTable<StoredClaim>("claims");
    return claims.filter((c) => c.analysis_id === analysisId);
  }

  async getClaimsByBrand(brandId: string): Promise<StoredClaim[]> {
    const claims = await readTable<StoredClaim>("claims");
    return claims
      .filter((c) => c.brand_id === brandId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // -- Articles --

  async createArticle(
    data: Omit<StoredArticle, "id" | "created_at" | "updated_at">,
  ): Promise<StoredArticle> {
    const articles = await readTable<StoredArticle>("articles");
    const record: StoredArticle = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now(),
      updated_at: now(),
    };
    articles.push(record);
    await writeTable("articles", articles);
    return record;
  }

  async getArticleBySlug(slug: string): Promise<StoredArticle | null> {
    const articles = await readTable<StoredArticle>("articles");
    return articles.find((a) => a.slug === slug) || null;
  }

  async getArticleById(id: string): Promise<StoredArticle | null> {
    const articles = await readTable<StoredArticle>("articles");
    return articles.find((a) => a.id === id) || null;
  }

  async getArticles(options?: {
    status?: ReviewStatus;
    brandId?: string;
    limit?: number;
    featured?: boolean;
  }): Promise<StoredArticle[]> {
    let articles = await readTable<StoredArticle>("articles");

    if (options?.status) {
      articles = articles.filter((a) => a.review_status === options.status);
    }
    if (options?.brandId) {
      articles = articles.filter((a) => a.brand_id === options.brandId);
    }
    if (options?.featured) {
      articles = articles.filter((a) => a.is_investigation);
    }

    articles.sort(
      (a, b) =>
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime(),
    );

    if (options?.limit) {
      articles = articles.slice(0, options.limit);
    }

    return articles;
  }

  async updateArticleStatus(
    id: string,
    status: ReviewStatus,
    note?: string,
  ): Promise<StoredArticle> {
    const articles = await readTable<StoredArticle>("articles");
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Article not found: ${id}`);

    const updated = {
      ...articles[idx],
      review_status: status,
      review_note: note !== undefined ? note : articles[idx].review_note,
      published_at: status === "published" ? now() : articles[idx].published_at,
      updated_at: now(),
    };
    articles[idx] = updated;
    await writeTable("articles", articles);
    return updated;
  }

  async updateArticle(
    id: string,
    data: Partial<StoredArticle>,
  ): Promise<StoredArticle> {
    const articles = await readTable<StoredArticle>("articles");
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Article not found: ${id}`);

    const updated = { ...articles[idx], ...data, updated_at: now() };
    articles[idx] = updated;
    await writeTable("articles", articles);
    return updated;
  }

  async getArticlesByBrandSlug(slug: string): Promise<StoredArticle[]> {
    const brands = await readTable<StoredBrand>("brands");
    const brand = brands.find((b) => b.slug === slug);
    if (!brand) return [];

    return this.getArticles({ brandId: brand.id, status: "published" });
  }
}
