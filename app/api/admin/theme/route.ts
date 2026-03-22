import { NextResponse } from "next/server";
import { getSiteTheme, updateSiteTheme, userHasPermission } from "@/lib/site-data";
import { requireValidApiSession } from "@/lib/device-session";
import type { ThemeBackgroundStyle } from "@/lib/theme";

async function requireManageTheme() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "manage_theme"))) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireManageTheme();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const theme = await getSiteTheme();
  return NextResponse.json({ theme });
}

export async function POST(request: Request) {
  const session = await requireManageTheme();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      backgroundStyle?: ThemeBackgroundStyle;
      gradientStart?: string;
      gradientEnd?: string;
      gradientDirection?: number;
      gradientIntensity?: number;
      accent?: string;
      surface?: string;
      surfaceStrong?: string;
      text?: string;
      mutedText?: string;
    };

    const theme = await updateSiteTheme(body);
    return NextResponse.json({ theme });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save theme.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
