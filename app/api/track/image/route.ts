import { NextResponse } from "next/server";
import { addImageView } from "@/lib/site-data";
import { getCurrentAuthenticatedLogIdentifier } from "@/lib/logged-in-user";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      imageId?: string;
      visitorId?: string;
      path?: string;
      viewedSeconds?: number;
    };

    const authenticatedUserIdentifier = await getCurrentAuthenticatedLogIdentifier();

    await addImageView(
      body.imageId ?? "",
      body.visitorId ?? "",
      body.path ?? "/",
      typeof body.viewedSeconds === "number" ? body.viewedSeconds : 0,
      authenticatedUserIdentifier,
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

