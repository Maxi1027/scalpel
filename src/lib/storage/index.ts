import { JsonStorage } from "./json-store";

// Swap this single line to switch to Supabase later
const storage = new JsonStorage();

export default storage;
export type { StorageInterface } from "./interface";
export type {
  StoredBrand,
  StoredAnalysis,
  StoredClaim,
  StoredArticle,
  ReviewStatus,
} from "./types";
