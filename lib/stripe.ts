import Stripe from "stripe";

declare global {
  var __stripe__: Stripe | undefined;
}

export function getStripeServer() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  if (!globalThis.__stripe__) {
    globalThis.__stripe__ = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }

  return globalThis.__stripe__;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required.");
  }

  return webhookSecret;
}
