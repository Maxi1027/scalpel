import { JsonStorage } from "./json-store";
import { SupabaseStorage } from "./supabase-store";
import type { StorageInterface } from "./interface";

function createStorage(): StorageInterface {
  // Use Supabase if credentials are configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      return new SupabaseStorage();
    } catch (e) {
      console.warn("[Storage] Supabase init failed, falling back to JSON:", e);
    }
  }
  return new JsonStorage();
}

const storage = createStorage();

export default storage;
export type { StorageInterface } from "./interface";
export type {
  StoredBrand,
  StoredAnalysis,
  StoredClaim,
  StoredArticle,
  ReviewStatus,
} from "./types";
