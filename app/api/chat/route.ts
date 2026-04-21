import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/graph";
import { getOrCreateSession, setSession } from "@/lib/session/store";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  let body: { sessionId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { sessionId, message } = body;

  if (
    typeof sessionId !== "string" ||
    !sessionId.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return NextResponse.json(
      { error: "sessionId and message are required" },
      { status: 400 }
    );
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Message too long" },
      { status: 400 }
    );
  }

  const session = getOrCreateSession(sessionId.trim());

  try {
    const result = await runAgent({
      sessionId: session.sessionId,
      message: message.trim(),
      fields: session.fields,
      conversationHistory: session.conversationHistory,
    });

    setSession({
      sessionId: session.sessionId,
      fields: result.fields,
      conversationHistory: result.conversationHistory,
    });

    return NextResponse.json({
      reply: result.reply,
      isComplete: result.isComplete,
      ...(result.bookingLink && { bookingLink: result.bookingLink }),
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        reply: "Sorry — something went wrong. Let's continue.",
        isComplete: false,
      },
      { status: 200 }
    );
  }
}
