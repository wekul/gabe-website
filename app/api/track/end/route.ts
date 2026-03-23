import { NextResponse } from "next/server";
import { endSession } from "@/lib/site-data";

async function parseRequestBody(request: Request): Promise<{ sessionId?: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as { sessionId?: string };
  }

  const raw = await request.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as { sessionId?: string };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = (await parseRequestBody(request)) as {
    sessionId?: string;
    maxStillSeconds?: number;
    topStillPoint?: string;
  };
  const sessionId = body.sessionId?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  await endSession(sessionId, {
    maxStillSeconds:
      typeof body.maxStillSeconds === "number" ? body.maxStillSeconds : undefined,
    topStillPoint: body.topStillPoint?.trim() || undefined,
  });
  return NextResponse.json({ ok: true });
}

