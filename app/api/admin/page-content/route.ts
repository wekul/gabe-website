import { NextResponse } from "next/server";
import { requireValidApiSession } from "@/lib/device-session";
import { getPageContent, updatePageContentBlock, type PageKey } from "@/lib/page-content";
import { isPageEditorBetaEnabled, userHasPermission } from "@/lib/site-data";

const knownPages: PageKey[] = ["home", "contact", "shop"];

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

export async function GET(request: Request) {
  const session = await requireManagePages();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageKey = searchParams.get("page") ?? "";

  if (!knownPages.includes(pageKey as PageKey)) {
    return NextResponse.json({ error: "Unknown page." }, { status: 400 });
  }

  const content = await getPageContent(pageKey as PageKey);
  return NextResponse.json({ content });
}

export async function POST(request: Request) {
  const session = await requireManagePages();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      pageKey?: string;
      blockKey?: string;
      value?: string;
    };

    const block = await updatePageContentBlock(
      session.user.id,
      body.pageKey ?? "",
      body.blockKey ?? "",
      body.value ?? "",
    );

    return NextResponse.json({ block });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save page content." },
      { status: 400 },
    );
  }
}
