import { NextResponse } from "next/server";
import { verifyCode, createSession, clearSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "请输入邮箱和验证码" },
        { status: 400 },
      );
    }

    if (!verifyCode(email, code)) {
      return NextResponse.json(
        { success: false, error: "验证码错误或已过期" },
        { status: 401 },
      );
    }

    await createSession(email);

    return NextResponse.json({
      success: true,
      message: "登录成功",
      redirect: "/review",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "验证失败" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true, message: "已退出登录" });
}
