-- ============================================
-- Scalpel — AI Sustainability Narrative Intelligence
-- Database Schema
-- ============================================

-- Brands -------------------------------------
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_zh TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  description TEXT,
  website TEXT,
  founded TEXT,
  headquarters TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sources ------------------------------------
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  source_type TEXT NOT NULL DEFAULT 'website',
  fetched_at TIMESTAMPTZ,
  raw_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claims -------------------------------------
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
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
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  featured_image TEXT,
  body TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  brand_ids UUID[] NOT NULL DEFAULT '{}',
  claim_ids UUID[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_investigation BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analysis blocks (stored as JSON in articles for now, but available as a view)
CREATE VIEW article_analyses AS
SELECT
  a.id AS article_id,
  a.slug,
  a.title,
  a.body,
  b.name AS brand_name,
  b.slug AS brand_slug
FROM articles a
LEFT JOIN brands b ON b.id = ANY(a.brand_ids);

-- Indexes ------------------------------------
CREATE INDEX idx_claims_brand ON claims(brand_id);
CREATE INDEX idx_claims_category ON claims(category);
CREATE INDEX idx_claims_risk ON claims(risk_level);
CREATE INDEX idx_sources_brand ON sources(brand_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articles_brands ON articles USING GIN(brand_ids);
CREATE INDEX idx_articles_claims ON articles USING GIN(claim_ids);

-- Seed: MVP Brands ---------------------------
INSERT INTO brands (slug, name, name_zh, website, description) VALUES
  ('shein', 'SHEIN', '希音', 'https://www.shein.com', 'Global fast-fashion e-commerce platform. One of the most scrutinized brands in fashion sustainability.'),
  ('anta', 'Anta Sports', '安踏体育', 'https://www.anta.com', 'China''s largest sportswear company by market cap. Aggressive sustainability push with eco-product lines.'),
  ('bosideng', 'Bosideng', '波司登', 'https://www.bosideng.com', 'China''s largest down apparel brand. Pioneering sustainable down sourcing and carbon neutrality claims.');
