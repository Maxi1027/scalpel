import Link from "next/link";

export const metadata = {
  title: "Disclaimer — SCALPEL",
  description: "Legal disclaimer and content policy for SCALPEL.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-2xl font-medium mb-10 tracking-tight">Disclaimer</h1>

      <div className="prose-editorial space-y-6">
        <section>
          <p>
            All content published on this platform is based on publicly disclosed
            corporate information, publicly available brand communications, and
            third-party accessible materials. Our analysis, commentary, and
            editorial content is produced for the purpose of industry research
            and public discussion related to ESG, sustainability, and brand
            communications.
          </p>
        </section>

        <section>
          <p>
            The content published on this platform does not constitute any legal
            determination, factual ruling, investment advice, or commercial
            evaluation. It does not represent a subjective qualitative judgment
            of any enterprise, institution, or individual.
          </p>
        </section>

        <section>
          <p>
            Platform commentary aims to explore issues of information completeness
            and transparency in ESG disclosure, sustainability communications,
            and public engagement. Some content carries the nature of industry
            observation and commentary.
          </p>
        </section>

        <section>
          <p>
            If relevant parties believe that platform content contains factual
            inaccuracies, information omissions, or requires supplementary
            explanation, they may contact us through our
            {" "}
            <Link href="/contact" className="text-[var(--accent-foreground)] hover:underline">official contact channel</Link>.
            We will review the matter and make revisions or updates upon verification.
          </p>
        </section>

        <section>
          <p>
            This platform respects the genuine sustainability practices and
            continuous improvement efforts of all enterprises. We advocate for
            a more transparent, prudent, and responsible ESG communications
            environment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mt-8 mb-3">AI-Assisted Content</h2>
          <p>
            Articles published on this platform are produced through an AI analysis
            pipeline with human editorial review before publication. AI-generated
            content is based on the source materials ingested during analysis.
            While we strive for accuracy, automated analysis may contain errors,
            omissions, or misinterpretations. All content is reviewed by human
            editors prior to publication.
          </p>
        </section>

        <section className="mt-12 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted)]">
            Last updated: May 2026
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            For inquiries or corrections:{" "}
            <Link href="/contact" className="text-[var(--accent-foreground)] hover:underline">
              Contact Form →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
