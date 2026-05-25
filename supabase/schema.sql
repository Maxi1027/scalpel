-- ============================================
-- Scalpel — AI Sustainability Narrative Intelligence
-- Supabase Database Schema
-- ============================================

-- Brands -------------------------------------
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL DEFAULT '',
  industry TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  founded TEXT,
  headquarters TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analyses -----------------------------------
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL DEFAULT '',
  raw_title TEXT NOT NULL DEFAULT '',
  raw_content TEXT NOT NULL DEFAULT '',
  brand_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claims -------------------------------------
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  risk_labels TEXT[] NOT NULL DEFAULT '{}',
  claim_text TEXT NOT NULL,
  context TEXT,
  explanation TEXT,
  confidence REAL NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Articles -----------------------------------
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  body TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  blocks JSONB NOT NULL DEFAULT '[]',
  is_investigation BOOLEAN NOT NULL DEFAULT false,
  review_status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monitor State -------------------------------
CREATE TABLE IF NOT EXISTS monitor_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_slug TEXT NOT NULL,
  url TEXT NOT NULL,
  last_content_hash TEXT,
  last_scraped_at TIMESTAMPTZ,
  last_analysis_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  last_change_detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_slug, url)
);

-- Indexes ------------------------------------
CREATE INDEX IF NOT EXISTS idx_monitor_state_brand ON monitor_state(brand_slug);
CREATE INDEX IF NOT EXISTS idx_monitor_state_scraped ON monitor_state(last_scraped_at DESC NULLS LAST);
CREATE INDEX idx_claims_brand ON claims(brand_id);
CREATE INDEX idx_claims_analysis ON claims(analysis_id);
CREATE INDEX idx_claims_category ON claims(category);
CREATE INDEX idx_claims_risk ON claims(risk_level);
CREATE INDEX idx_analyses_brand ON analyses(brand_id);
CREATE INDEX idx_articles_brand ON articles(brand_id);
CREATE INDEX idx_articles_analysis ON articles(analysis_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC NULLS LAST);
CREATE INDEX idx_articles_status ON articles(review_status);

-- Seed: 15 MVP Brands ------------------------
INSERT INTO brands (slug, name, name_zh, website, industry, description) VALUES
  ('shein', 'SHEIN', '希音', 'https://www.sheingroup.com', 'fast-fashion', 'Global fast-fashion e-commerce platform. Most scrutinized brand in fashion sustainability.'),
  ('temu', 'Temu', '拼多多海外', 'https://www.temu.com', 'ecommerce', 'PDD Holdings cross-border e-commerce platform. Ultra-low-cost model with minimal ESG narrative.'),
  ('ur', 'UR (Urban Revivo)', 'UR', 'https://www.urbanrevivo.com', 'fast-fashion', 'China''s fast-fashion export leader. Emerging ESG narrative with sustainable product lines.'),
  ('peacebird', 'Peacebird', '太平鸟', 'https://www.peacebird.com', 'fashion', 'Youth-oriented Chinese fashion brand. Building sustainable product lines and circularity messaging.'),
  ('anta', 'Anta Sports', '安踏体育', 'https://www.anta.com', 'sportswear', 'China''s largest sportswear company. Aggressive sustainability push with carbon neutrality targets.'),
  ('lining', 'Li-Ning', '李宁', 'https://www.lining.com', 'sportswear', 'Iconic Chinese sportswear brand. Guochao pioneer with developing ESG communications.'),
  ('xtep', 'Xtep', '特步', 'https://www.xtep.com', 'sportswear', 'Running-focused Chinese sportswear brand. Published sustainability reports with measurable targets.'),
  ('bosideng', 'Bosideng', '波司登', 'https://www.bosideng.com', 'apparel', 'China''s largest down apparel brand. Leader in traceable down sourcing and carbon disclosure.'),
  ('snowflying', 'Snow Flying', '雪中飞', 'https://www.snowflying.com', 'apparel', 'Bosideng''s mass-market down apparel sub-brand. Contrast value vs. parent brand ESG positioning.'),
  ('miniso', 'Miniso', '名创优品', 'https://www.miniso.com', 'lifestyle', 'Global lifestyle retailer. Early-stage ESG narrative focused on sustainable sourcing and packaging.'),
  ('popmart', 'Pop Mart', '泡泡玛特', 'https://www.popmart.com', 'lifestyle', 'Designer toy and pop culture brand. Emerging sustainability narrative around packaging and materials.'),
  ('beneunder', 'Beneunder', '蕉下', 'https://www.beneunder.com', 'lifestyle', 'Sun-protective lifestyle brand. Eco-material claims and outdoor-sustainability positioning.'),
  ('perfectdiary', 'Perfect Diary', '完美日记', 'https://www.perfectdiary.com', 'beauty', 'Yatsen Holding''s flagship beauty brand. ESG reporting aligned with HKEX disclosure requirements.'),
  ('florasis', 'Florasis', '花西子', 'https://www.florasis.com', 'beauty', 'C-beauty brand built on Eastern aesthetics. Clean beauty and sustainable ingredient narrative.'),
  ('proya', 'Proya', '珀莱雅', 'https://www.proya.com', 'beauty', 'A-share listed beauty leader. Expanding ESG disclosure with sustainability product lines.');
