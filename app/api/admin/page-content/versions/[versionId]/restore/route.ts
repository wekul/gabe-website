import { NextResponse } from "next/server";
import { requireValidApiSession } from "@/lib/device-session";
import { restorePageContentVersion } from "@/lib/page-content";
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

export async function POST(_request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const session = await requireManagePages();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { versionId } = await params;
    const pageKey = await restorePageContentVersion(session.user.id, versionId);
    return NextResponse.json({ pageKey });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore page version." },
      { status: 400 },
    );
  }
}
