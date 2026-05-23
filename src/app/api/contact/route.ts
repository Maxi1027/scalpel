import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { sendContactNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter a message." },
        { status: 400 },
      );
    }

    const inquiry = {
      id: crypto.randomUUID(),
      name: name?.trim() || null,
      email: email?.trim() || null,
      company: company?.trim() || null,
      message: message.trim(),
      created_at: new Date().toISOString(),
      status: "new",
    };

    // Save to JSON file
    const filePath = path.join(process.cwd(), "data", "inquiries.json");
    let inquiries: typeof inquiry[] = [];
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      inquiries = JSON.parse(raw);
    } catch {
      // file doesn't exist yet
    }
    inquiries.push(inquiry);
    await fs.writeFile(filePath, JSON.stringify(inquiries, null, 2), "utf-8");

    console.log(`[Contact] New inquiry from ${name || email || "anonymous"}: ${message.slice(0, 100)}`);

    // Send email notification
    sendContactNotification(inquiry).catch((e) =>
      console.error("[Contact] Email notify failed:", e),
    );

    return NextResponse.json({
      success: true,
      message: "Thank you for your message. We will review and respond.",
    });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return NextResponse.json(
      { success: false, error: "Submission failed. Please try again later." },
      { status: 500 },
    );
  }
}
