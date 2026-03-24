import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logCriticalError } from "@/lib/critical-error-logging";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await request.json()) as {
      source?: string;
      path?: string;
      message?: string;
      stack?: string | null;
      digest?: string | null;
    };

    await logCriticalError({
      source: body.source?.trim() || "app_error_boundary",
      path: body.path?.trim() || undefined,
      message: body.message?.trim() || "Unknown critical error",
      stack: body.stack || null,
      digest: body.digest || null,
      userId: session?.user?.id || null,
      userIdentifier:
        session?.user?.name || session?.user?.email || session?.user?.id || "Anonymous",
      context: {
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({ logged: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to log critical error." },
      { status: 500 },
    );
  }
}
