import { NextResponse } from "next/server";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { logServerError } from "@/lib/error-logging";
import type { DeliveryType } from "@prisma/client";
import { requireValidApiSession } from "@/lib/device-session";
import { createShopItem, listShopItems, userHasPermission } from "@/lib/site-data";

async function requireManageShop() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "manage_shop"))) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireManageShop();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await listShopItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireManageShop();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      imageUrl?: string;
      costPence?: number;
      deliveryTime?: string;
      deliveryType?: DeliveryType;
      quantityTracked?: boolean;
      quantity?: number;
    };

    const item = await createShopItem(session.user.id, {
      title: body.title ?? "",
      description: body.description ?? "",
      imageUrl: body.imageUrl ?? "",
      costPence: typeof body.costPence === "number" ? body.costPence : 0,
      deliveryTime: body.deliveryTime ?? "",
      deliveryType: body.deliveryType === "digital" ? "digital" : "post",
      quantityTracked: Boolean(body.quantityTracked),
      quantity: typeof body.quantity === "number" ? body.quantity : null,
    });

    await logAdminAuditEvent(session.user.id, {
      action: "create_shop_item",
      section: "shop",
      targetType: "shop_item",
      targetId: item.id,
      details: { title: item.title, deliveryType: item.deliveryType },
    });

    return NextResponse.json({ item });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/shop" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create item." },
      { status: 400 },
    );
  }
}
