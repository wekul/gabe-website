import { NextResponse } from "next/server";
import { startSession } from "@/lib/site-data";
import { getCurrentAuthenticatedLogIdentifier } from "@/lib/logged-in-user";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      visitorId?: string;
      path?: string;
    };

    const visitorId = body.visitorId?.trim();
    const pagePath = body.path?.trim() || "/";

    if (!visitorId) {
      return NextResponse.json(
        { error: "visitorId is required" },
        { status: 400 },
      );
    }

    const authenticatedUserIdentifier = await getCurrentAuthenticatedLogIdentifier();
    const sessionId = await startSession(visitorId, pagePath, authenticatedUserIdentifier);
    return NextResponse.json({ sessionId });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
