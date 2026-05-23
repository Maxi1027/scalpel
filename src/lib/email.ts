import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const ALLOWED_EMAILS = ["maxiqin1027@gmail.com"];

export function isAllowedEmail(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.toLowerCase().trim());
}

export async function sendVerificationCode(
  to: string,
  code: string,
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log(`[EMAIL] Resend not configured. Verification code for ${to}: ${code}`);
    return false;
  }

  try {
    await resend.emails.send({
      from: "SCALPEL Review <review@scalpelonline.com>",
      to,
      subject: `验证码: ${code} — SCALPEL 审核登录`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #000;">SCALPEL 审核系统</h2>
          <p>你的登录验证码是：</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 0.2em; color: #2d5a3d;">${code}</p>
          <p style="color: #666; font-size: 14px;">验证码 10 分钟内有效。</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("[EMAIL] Failed to send verification code:", e);
    return false;
  }
}

export async function sendReviewNotification(
  to: string,
  brandName: string,
  articleTitle: string,
  claimCount: number,
  highRiskCount: number,
  reviewUrl: string,
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log(`[EMAIL] Notification would go to ${to}: ${articleTitle}`);
    return false;
  }

  try {
    await resend.emails.send({
      from: "SCALPEL <system@scalpelonline.com>",
      to,
      subject: `🔔 新分析待审核: ${brandName} — ${articleTitle.slice(0, 60)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #000;">新分析完成，待你审核</h2>
          <p><strong>品牌:</strong> ${brandName}</p>
          <p><strong>标题:</strong> ${articleTitle}</p>
          <p><strong>提取声明:</strong> ${claimCount} 条 (${highRiskCount} 条高风险)</p>
          <p style="margin-top: 24px;">
            <a href="${reviewUrl}" style="background: #2d5a3d; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px;">前往审核</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("[EMAIL] Failed to send notification:", e);
    return false;
  }
}

export async function sendContactNotification(
  inquiry: {
    name: string | null;
    email: string | null;
    company: string | null;
    message: string;
  },
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log(`[EMAIL] Contact notification would go to maxiqin1027@gmail.com: ${inquiry.message.slice(0, 80)}`);
    return false;
  }

  try {
    await resend.emails.send({
      from: "SCALPEL Contact <system@scalpelonline.com>",
      to: "maxiqin1027@gmail.com",
      subject: `📬 New inquiry: ${inquiry.name || inquiry.email || "Anonymous"} — ${inquiry.company || "No company"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #000;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 0; color: #666; width: 80px;">Name</td><td>${inquiry.name || "—"}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Email</td><td>${inquiry.email || "—"}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Company</td><td>${inquiry.company || "—"}</td></tr>
          </table>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${inquiry.message}</p>
          </div>
          <p style="color: #999; font-size: 12px;">Submitted at ${new Date().toISOString()}</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("[EMAIL] Failed to send contact notification:", e);
    return false;
  }
}
