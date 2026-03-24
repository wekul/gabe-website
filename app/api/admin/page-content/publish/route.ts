import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { publishPageContentSnapshot, type PageBuiltinLayoutMap, type PageContentItemRecord } from "@/lib/page-content";
import { isPageEditorBetaEnabled, userHasPermission } from "@/lib/site-data";
import { logServerError } from "@/lib/error-logging";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!(await userHasPermission(session.user.id, "manage_pages")) || !(await isPageEditorBetaEnabled())) {
    return NextResponse.json({ error: "Page editor beta is disabled." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      pageKey?: string;
      content?: Record<string, string>;
      items?: PageContentItemRecord[];
      layout?: PageBuiltinLayoutMap;
    };

    if (!body.pageKey || !body.content || !body.layout || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Invalid page snapshot payload." }, { status: 400 });
    }

    const snapshot = await publishPageContentSnapshot(session.user.id, {
      pageKey: body.pageKey,
      content: body.content,
      items: body.items,
      layout: body.layout,
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    await logServerError(error, {
      source: "/api/admin/page-content/publish",
      context: { userId: session.user.id },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish page content." },
      { status: 500 },
    );
  }
}
