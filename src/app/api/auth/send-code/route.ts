import { NextResponse } from "next/server";
import { isAllowedEmail, sendVerificationCode } from "@/lib/email";
import { generateCode, storeCode } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "请输入邮箱地址" },
        { status: 400 },
      );
    }

    if (!isAllowedEmail(email)) {
      return NextResponse.json(
        { success: false, error: "该邮箱未被授权访问审核系统" },
        { status: 403 },
      );
    }

    const code = generateCode();
    storeCode(email, code);

    const sent = await sendVerificationCode(email, code);

    return NextResponse.json({
      success: true,
      message: sent
        ? "验证码已发送到你的邮箱"
        : `验证码: ${code}（Resend 未配置，请查看服务器日志或配置 RESEND_API_KEY）`,
      dev_code: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "发送验证码失败" },
      { status: 500 },
    );
  }
}
