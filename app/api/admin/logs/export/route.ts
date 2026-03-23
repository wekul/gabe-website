import { NextResponse } from "next/server";
import { getAdminStats, getUserPermissions } from "@/lib/site-data";
import { requireValidApiSession } from "@/lib/device-session";

const CSV_HEADERS = {
  sessions: [
    "id",
    "visitorId",
    "authenticatedUserIdentifier",
    "path",
    "startedAt",
    "endedAt",
    "durationSeconds",
    "maxStillSeconds",
    "topStillPoint",
  ],
  messages: ["id", "name", "email", "authenticatedUserIdentifier", "createdAt", "adminMessage", "message"],
  image_views: ["id", "imageId", "visitorId", "authenticatedUserIdentifier", "path", "viewedSeconds", "createdAt"],
} as const;

type ExportTarget = keyof typeof CSV_HEADERS;

function toCsvCell(value: string | number | boolean | null | undefined) {
  const normalized = String(value ?? "");
  return `"${normalized.replace(/"/g, '""')}"`;
}

function toCsv(headers: readonly string[], rows: Array<Record<string, unknown>>) {
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => toCsvCell(row[header] as string | number | boolean | null | undefined)).join(","));
  }

  return lines.join("\n");
}

function getTarget(searchParams: URLSearchParams): ExportTarget {
  const value = searchParams.get("target");

  if (value === "sessions" || value === "messages" || value === "image_views") {
    return value;
  }

  return "sessions";
}

export async function GET(request: Request) {
  const session = await requireValidApiSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = await getUserPermissions(session.user.id);
  const { searchParams } = new URL(request.url);
  const target = getTarget(searchParams);

  if (target === "sessions" && !permissions.includes("view_sessions")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (target === "image_views" && !permissions.includes("view_image_views")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canSeeMessages =
    permissions.includes("view_contact_messages") ||
    permissions.includes("view_admin_messages");

  if (target === "messages" && !canSeeMessages) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getAdminStats();

  const rows =
    target === "sessions"
      ? stats.recentSessions.map((entry) => ({
          id: entry.id,
          visitorId: entry.visitorId,
          authenticatedUserIdentifier: entry.authenticatedUserIdentifier ?? "",
          path: entry.path,
          startedAt: entry.startedAt,
          endedAt: entry.endedAt ?? "",
          durationSeconds: entry.durationSeconds ?? "",
          maxStillSeconds: entry.maxStillSeconds ?? "",
          topStillPoint: entry.topStillPoint ?? "",
        }))
      : target === "messages"
        ? stats.contactMessages
            .filter((message) => {
              if (message.adminMessage) {
                return permissions.includes("view_admin_messages");
              }

              return permissions.includes("view_contact_messages");
            })
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
              email: entry.email,
              authenticatedUserIdentifier: entry.authenticatedUserIdentifier ?? "",
              createdAt: entry.createdAt,
              adminMessage: entry.adminMessage,
              message: entry.message,
            }))
        : stats.imageViews.map((entry) => ({
            id: entry.id,
            imageId: entry.imageId,
            visitorId: entry.visitorId,
            authenticatedUserIdentifier: entry.authenticatedUserIdentifier ?? "",
            path: entry.path,
            viewedSeconds: entry.viewedSeconds,
            createdAt: entry.createdAt,
          }));

  const csv = toCsv(CSV_HEADERS[target], rows);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${target}-${timestamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

