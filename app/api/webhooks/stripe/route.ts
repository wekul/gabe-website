import Stripe from "stripe";
import { NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/db";
import { logServerError } from "@/lib/error-logging";
import { prisma } from "@/lib/prisma";
import { getStripeServer, getStripeWebhookSecret } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function getCheckoutMetadata(session: Stripe.Checkout.Session) {
  const itemId = session.metadata?.itemId?.trim() || null;
  const quantityValue = Number.parseInt(session.metadata?.quantity ?? "", 10);
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : null;

  return {
    itemId,
    quantity,
    checkoutSessionId: session.id,
  };
}

async function processCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  payload: Stripe.Metadata,
) {
  const metadata = getCheckoutMetadata(session);

  return prisma.$transaction(async (tx) => {
    const existingEvent = await tx.stripeWebhookEvent.findUnique({
      where: { id: event.id },
      select: { id: true, status: true },
    });

    if (existingEvent) {
      return { duplicate: true, status: existingEvent.status };
    }

    await tx.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        livemode: event.livemode,
        status: "received",
        checkoutSessionId: metadata.checkoutSessionId,
        itemId: metadata.itemId,
        quantity: metadata.quantity,
        payload,
      },
    });

    if (metadata.itemId && metadata.quantity) {
      const item = await tx.shopItem.findUnique({
        where: { id: metadata.itemId },
        select: { id: true, quantityTracked: true, quantity: true },
      });

      if (item?.quantityTracked) {
        const currentQuantity = Math.max(item.quantity ?? 0, 0);
        const nextQuantity = Math.max(currentQuantity - metadata.quantity, 0);

        await tx.shopItem.update({
          where: { id: item.id },
          data: { quantity: nextQuantity },
        });
      }
    }

    await tx.stripeWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: "processed",
        processedAt: new Date(),
      },
    });

    return { duplicate: false, status: "processed" };
  });
}

async function storeUnhandledEvent(event: Stripe.Event, payload: Stripe.Metadata) {
  const checkoutSessionId =
    typeof event.data.object === "object" && event.data.object && "id" in event.data.object
      ? String(event.data.object.id)
      : null;

  const existingEvent = await prisma.stripeWebhookEvent.findUnique({
    where: { id: event.id },
    select: { id: true, status: true },
  });

  if (existingEvent) {
    return { duplicate: true, status: existingEvent.status };
  }

  await prisma.stripeWebhookEvent.create({
    data: {
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      status: "ignored",
      checkoutSessionId,
      payload,
      processedAt: new Date(),
    },
  });

  return { duplicate: false, status: "ignored" };
}

export async function POST(request: Request) {
  let eventId: string | null = null;

  try {
    await ensureDatabase();

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const rawBody = await request.text();
    const stripe = getStripeServer();
    const webhookSecret = getStripeWebhookSecret();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const payload = JSON.parse(rawBody) as Stripe.Metadata;
    eventId = event.id;

    if (event.type === "checkout.session.completed") {
      const result = await processCheckoutCompleted(
        event,
        event.data.object as Stripe.Checkout.Session,
        payload,
      );

      return NextResponse.json({ received: true, duplicate: result.duplicate, status: result.status });
    }

    const result = await storeUnhandledEvent(event, payload);
    return NextResponse.json({ received: true, duplicate: result.duplicate, status: result.status });
  } catch (error) {
    if (eventId) {
      try {
        await prisma.stripeWebhookEvent.upsert({
          where: { id: eventId },
          update: {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Webhook processing failed.",
          },
          create: {
            id: eventId,
            type: "unknown",
            livemode: false,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Webhook processing failed.",
          },
        });
      } catch {
        // Ignore secondary logging failures.
      }
    }

    await logServerError(error, { source: "/api/webhooks/stripe" });

    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    const status = error instanceof Stripe.errors.StripeSignatureVerificationError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
