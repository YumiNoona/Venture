import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ventry/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error: ${err.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Handle Event types
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id; // Pass this during checkout
    const stripeCustomerId = session.customer as string;
    const planName = session.metadata?.planName; // Optional: Pass plan metadata

    if (userId) {
      // 1. Find the corresponding Plan in Ventry
      const plan = await prisma.plan.findUnique({
        where: { name: planName || "Pro" } // Default to Pro if not specified
      });

      // 2. Update the User
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId,
          subscriptionStatus: "active",
          planId: plan?.id,
        },
      });

      console.log(`[Stripe Webhook] Successfully updated user ${userId} to plan ${plan?.name}`);
    }
  }

  return NextResponse.json({ received: true });
}
