import { NextResponse } from "next/server";
import { requireValidApiSession } from "@/lib/device-session";
import { deletePageContentItem, movePageContentItem, updatePageContentItem } from "@/lib/page-content";
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

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await requireManagePages();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    const body = (await request.json()) as {
      pageKey?: string;
      slotKey?: string;
      title?: string;
      body?: string;
      imageUrl?: string;
      linkLabel?: string;
      linkHref?: string;
      direction?: "up" | "down";
      displayOrder?: number;
    };

    if (body.direction) {
      const item = await movePageContentItem(session.user.id, itemId, body.direction);
      return NextResponse.json({ item });
    }

    const item = await updatePageContentItem(session.user.id, itemId, {
      pageKey: body.pageKey ?? "",
      slotKey: body.slotKey ?? "",
      title: body.title ?? "",
      body: body.body ?? "",
      imageUrl: body.imageUrl,
      linkLabel: body.linkLabel,
      linkHref: body.linkHref,
      displayOrder: body.displayOrder,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update page item." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await requireManagePages();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    await deletePageContentItem(session.user.id, itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete page item." },
      { status: 400 },
    );
  }
}
