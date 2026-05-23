import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendContactNotification } from "@/lib/email";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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
      name: name?.trim() || null,
      email: email?.trim() || null,
      company: company?.trim() || null,
      message: message.trim(),
      status: "new",
    };

    // Save to Supabase
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("inquiries").insert(inquiry);
      if (error) {
        console.error("[Contact] Supabase insert error:", error.message);
        throw new Error("Failed to save inquiry");
      }
    } else {
      console.log("[Contact] No Supabase — inquiry not saved:", inquiry.message.slice(0, 80));
    }

    console.log(`[Contact] New inquiry from ${name || email || "anonymous"}: ${message.slice(0, 100)}`);

    // Send email notification (await so Vercel doesn't kill it)
    await sendContactNotification(inquiry).catch((e) =>
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
