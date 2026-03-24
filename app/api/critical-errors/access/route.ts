import { NextResponse } from "next/server";
import { canCurrentUserViewCriticalErrors } from "@/lib/critical-error-logging";

export async function GET() {
  return NextResponse.json({
    canViewCriticalErrors: await canCurrentUserViewCriticalErrors(),
  });
}
