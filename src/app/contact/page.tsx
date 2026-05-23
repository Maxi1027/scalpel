"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          company: company.trim() || null,
          message: message.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-6 py-32 text-center">
        <h1 className="text-xl font-medium mb-4">Thank you for your message.</h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          We have received your inquiry and will review it promptly.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setName("");
            setEmail("");
            setCompany("");
            setMessage("");
          }}
          className="text-sm text-[var(--accent-foreground)] hover:underline"
        >
          Submit another message →
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-2xl font-medium mb-2 tracking-tight">Contact</h1>
      <p className="text-sm text-[var(--muted)] mb-10">
        If you believe any content on this platform contains factual inaccuracies,
        information omissions, or requires clarification, please reach out
        through this form. We review every submission and will make corrections
        or updates upon verification.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Name <span className="text-[var(--muted)] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Company <span className="text-[var(--muted)] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Please specify which article and what needs to be corrected or clarified..."
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full py-2.5 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
        Your message will go directly to the SCALPEL editorial team. We take
        every submission seriously. If you would like a response, please ensure
        you provide a valid email address.
      </p>
    </div>
  );
}
