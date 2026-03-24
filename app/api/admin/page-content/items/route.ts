import { NextResponse } from "next/server";
import { requireValidApiSession } from "@/lib/device-session";
import { createPageContentItem } from "@/lib/page-content";
import { isPageEditorBetaEnabled, userHasPermission } from "@/lib/site-data";

async function requireManagePages() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "manage_pages"))) {
    return null;
  }

  if (!(await isPageEditorBetaEnabled())) {
    return null;
  }

  return session;
}

export async function POST(request: Request) {
  const session = await requireManagePages();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      pageKey?: string;
      slotKey?: string;
      title?: string;
      body?: string;
      imageUrl?: string;
      linkLabel?: string;
      linkHref?: string;
    };

    const item = await createPageContentItem(session.user.id, {
      pageKey: body.pageKey ?? "",
      slotKey: body.slotKey ?? "",
      title: body.title ?? "",
      body: body.body ?? "",
      imageUrl: body.imageUrl,
      linkLabel: body.linkLabel,
      linkHref: body.linkHref,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create page item." },
      { status: 400 },
    );
  }
}
