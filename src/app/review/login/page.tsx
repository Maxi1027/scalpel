"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  async function handleSendCode() {
    if (!email) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("code");
        if (data.dev_code) setDevCode(data.dev_code);
      } else {
        setError(data.error || "发送失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/review");
      } else {
        setError(data.error || "验证失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm mx-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-medium tracking-tight mb-2">
            SCALPEL 审核系统
          </h1>
          <p className="text-sm text-[var(--muted)]">登录以审核 AI 生成的分析内容</p>
        </div>

        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          {step === "email" ? (
            <>
              <label className="block text-sm font-medium mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                placeholder="maxiqin1027@gmail.com"
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                autoFocus
              />
              <button
                onClick={handleSendCode}
                disabled={loading || !email}
                className="w-full mt-4 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "发送中..." : "发送验证码"}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)] mb-4">
                验证码已发送至 {email}
              </p>
              <label className="block text-sm font-medium mb-2">
                输入 6 位验证码
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="000000"
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm text-center text-lg tracking-[0.3em] focus:outline-none focus:border-[var(--accent)] transition-colors"
                autoFocus
              />
              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                className="w-full mt-4 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "验证中..." : "登录"}
              </button>

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  ← 更换邮箱
                </button>
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  重新发送
                </button>
              </div>

              {devCode && (
                <p className="mt-3 text-xs text-[var(--accent-foreground)] text-center">
                  开发模式，验证码: {devCode}
                </p>
              )}
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
