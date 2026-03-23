import { NextResponse } from "next/server";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { logServerError } from "@/lib/error-logging";
import type { DeliveryType } from "@prisma/client";
import { requireValidApiSession } from "@/lib/device-session";
import { deleteShopItem, moveShopItem, updateShopItem, userHasPermission } from "@/lib/site-data";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
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
      displayOrder?: number;
      direction?: "up" | "down";
    };

    const { itemId } = await context.params;

    if (body.direction === "up" || body.direction === "down") {
      const item = await moveShopItem(session.user.id, itemId, body.direction);
      await logAdminAuditEvent(session.user.id, {
        action: "move_shop_item",
        section: "shop",
        targetType: "shop_item",
        targetId: itemId,
        details: { direction: body.direction, displayOrder: item.displayOrder },
      });
      return NextResponse.json({ item });
    }

    const item = await updateShopItem(session.user.id, itemId, {
      title: body.title ?? "",
      description: body.description ?? "",
      imageUrl: body.imageUrl ?? "",
      costPence: typeof body.costPence === "number" ? body.costPence : 0,
      deliveryTime: body.deliveryTime ?? "",
      deliveryType: body.deliveryType === "digital" ? "digital" : "post",
      displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : undefined,
      quantityTracked: Boolean(body.quantityTracked),
      quantity: typeof body.quantity === "number" ? body.quantity : null,
    });

    await logAdminAuditEvent(session.user.id, {
      action: "update_shop_item",
      section: "shop",
      targetType: "shop_item",
      targetId: itemId,
      details: {
        title: item.title,
        deliveryType: item.deliveryType,
        quantityTracked: item.quantityTracked,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/shop/[itemId]" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update item." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const session = await requireManageShop();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await context.params;
    await deleteShopItem(session.user.id, itemId);
    await logAdminAuditEvent(session.user.id, {
      action: "delete_shop_item",
      section: "shop",
      targetType: "shop_item",
      targetId: itemId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/shop/[itemId]" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete item." },
      { status: 400 },
    );
  }
}
