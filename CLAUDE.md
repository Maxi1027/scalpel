# SCALPEL — AI-Powered Sustainability Narrative Intelligence

## Project Overview

SCALPEL is an AI-driven ESG/sustainability narrative intelligence platform focused on Chinese fashion, lifestyle, and consumer brands. It monitors brand channels, extracts sustainability claims, classifies greenwashing risk, generates analytical breakdowns, and rewrites content into sharp editorial commentary.

**This is NOT a generic ESG website.** It is:
- A next-generation industry intelligence media
- A sustainability watchdog
- A narrative analysis system
- An AI-assisted investigative publication

## Live URLs

- **Production**: https://www.scalpelonline.com
- **Review Admin**: https://www.scalpelonline.com/review (hidden, no public link)
- **Local dev**: http://localhost:3001

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Deployment | Vercel |
| Database | Supabase (Postgres) — auto-switches from local JSON when credentials present |
| AI Engine | DeepSeek v4-pro (via OpenAI-compatible SDK) |
| Email | Resend (verification codes, review notifications, contact form) |
| Domain | scalpelonline.com via Cloudflare |
| GitHub | Maxi1027/scalpel |

## Database Schema (Supabase)

4 tables:
- `brands` — 15 brands with slug, name, name_zh, industry, website, description
- `analyses` — AI-generated analysis records linked to brands, stores source_url and raw_content
- `claims` — Individual sustainability claims extracted from analyses, with risk_level, risk_labels, category, explanation
- `articles` — Editorial content with review_status (pending/reviewed/published), analysis blocks (JSONB)

Schema at `supabase/schema.sql`.

## Architecture / Workflow

1. AI agents monitor brand channels (via `/api/monitor`)
2. AI extracts sustainability-related claims from scraped content (HTML + PDF)
3. AI classifies risk level (low/medium/high/critical) and narrative type
4. AI generates analytical breakdowns (5 editorial blocks)
5. AI rewrites content into sharp editorial commentary
6. Content goes to `/review` for human approval → published to website

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/analyzer.ts` | AI analysis pipeline — claim extraction + editorial generation prompts |
| `src/lib/monitor.ts` | Monitoring engine — per-brand URL config, content hash change detection, batch scan |
| `src/lib/scraper.ts` | Web scraper (cheerio for HTML, PyPDF2 via Python subprocess for PDF) |
| `src/lib/storage/` | Storage abstraction — `SupabaseStorage` when credentials present, `JsonStorage` fallback |
| `src/lib/email.ts` | Resend email — verification codes, review notifications, contact form alerts |
| `src/lib/auth.ts` | JWT-based session management for review admin |
| `src/middleware.ts` | Protects `/review` routes, redirects to login |
| `src/types/index.ts` | TypeScript types for Brand, Claim, Article, AnalysisBlock, risk labels/categories |

## Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage — published articles, brand cards, narrative categories |
| `/brand/[slug]` | Brand profile with claims history and published analyses |
| `/article/[slug]` | Full article with analysis blocks and source attribution |
| `/review` | Admin review panel (email login required, all Chinese UI) |
| `/review/login` | Admin login — email → verification code → session |
| `/contact` | Public contact form (submissions saved to Supabase + emailed) |
| `/disclaimer` | Legal disclaimer (English only) |
| `/api/analyze` | POST — trigger AI analysis for a brand |
| `/api/monitor` | POST — run batch monitoring scan (Bearer token auth) |
| `/api/review` | PATCH — update article status; GET — list by status |
| `/api/auth/send-code` | POST — send email verification code |
| `/api/auth/verify` | POST — verify code, create session |
| `/api/contact` | POST — submit contact form |

## Environment Variables

All secrets in `.env.local` (gitignored). Required:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `REVIEW_AUTH_SECRET`

## Editorial Voice & Constraints

- Sharp, intelligent, cold humor — professional observer, not judge or activist
- Structure: what they said → what was disclosed → what's missing → why it matters → industry context → what better looks like
- NEVER: accuse fraud/lying, use attack words, convict brands
- DO: "This framing could lead consumers to...", "The gap between claim and data is notable"
- Headlines: provocative but defensible, use specific numbers, quote brand's own language
- All public-facing content must be English only

## Review Workflow

1. AI generates article → saved as "pending"
2. Email notification sent to maxiqin1027@gmail.com
3. Editor logs into `/review`, previews article
4. Can publish (→ live on site) or reject with reason note
5. Rejected articles can be re-reviewed later

## Admin Access

- Login at `/review` with maxiqin1027@gmail.com
- Verification code sent via Resend email
- Session lasts 24 hours
- Review panel: three tabs (pending/published/rejected), preview modal, one-click actions

## Deployment

```bash
npm run dev          # local development (port 3001)
npx vercel --prod    # deploy to production
git push origin main # triggers Vercel auto-deploy
```

## Known Issues

- 10 of 15 brands have 0 claims — monitoring URLs need to be corrected to point to actual ESG/sustainability pages
- Anta, UR, Snow Flying URLs returned 404 during last scan
- Local Supabase queries can be slow (15s homepage) due to N+1 queries; needs batching optimization
- PDF parsing requires Python + PyPDF2 to be available on the deployment environment
- Middleware uses deprecated `middleware.ts` convention; should migrate to `proxy.ts`
