import { logServerError } from "@/lib/error-logging";
import { NextRequest, NextResponse } from "next/server";
import { getShopItemById } from "@/lib/site-data";
import { getStripeServer } from "@/lib/stripe";

function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { itemId?: string; quantity?: number };
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    const requestedQuantity = Math.trunc(Number(body.quantity ?? 1));

    if (!itemId) {
      return NextResponse.json({ error: "Item id is required." }, { status: 400 });
    }

    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1." }, { status: 400 });
    }

    const item = await getShopItemById(itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    const maxQuantity = item.quantityTracked ? Math.max(item.quantity ?? 0, 0) : 99;
    if (item.quantityTracked && maxQuantity <= 0) {
      return NextResponse.json({ error: "This item is currently out of stock." }, { status: 409 });
    }

    if (requestedQuantity > maxQuantity) {
      return NextResponse.json(
        { error: `Only ${maxQuantity} ${maxQuantity === 1 ? "unit is" : "units are"} currently available.` },
        { status: 409 },
      );
    }

    const stripe = getStripeServer();
    const origin = getRequestOrigin(request);
    const description = item.description.trim();
    const imageUrl = /^https?:\/\//i.test(item.imageUrl) ? item.imageUrl : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/shop/${item.id}?checkout=success`,
      cancel_url: `${origin}/shop/${item.id}?checkout=cancelled`,
      billing_address_collection: "required",
      line_items: [
        {
          quantity: requestedQuantity,
          price_data: {
            currency: "gbp",
            unit_amount: item.costPence,
            product_data: {
              name: item.title,
              description: description ? description.slice(0, 500) : item.deliveryTime,
              images: imageUrl ? [imageUrl] : undefined,
              metadata: {
                itemId: item.id,
                deliveryType: item.deliveryType,
              },
            },
          },
        },
      ],
      metadata: {
        itemId: item.id,
        quantity: String(requestedQuantity),
        deliveryType: item.deliveryType,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    await logServerError(error, { source: "/api/shop/checkout" });
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


