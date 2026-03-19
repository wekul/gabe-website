import { NextResponse } from "next/server";
import { addContactMessage } from "@/lib/site-data";
import { getCurrentAuthenticatedLogIdentifier } from "@/lib/logged-in-user";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
      reason?: string;
      adminMessage?: boolean;
    };

    const authenticatedUserIdentifier = await getCurrentAuthenticatedLogIdentifier();

    await addContactMessage(
      body.name ?? "",
      body.email ?? "",
      body.message ?? "",
      body.reason ?? "",
      body.adminMessage === true,
      authenticatedUserIdentifier,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit message.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
