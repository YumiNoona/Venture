// Stub: Requires 'stripe' package in production

export async function createCheckoutSession(userId, priceId) {
  console.log(`[Stripe Checkout] Creating session for user ${userId} and price ${priceId}`)
  
  // Real implementation:
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card'],
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   mode: 'subscription',
  //   success_url: 'https://vorld.app/dashboard?success=true',
  //   cancel_url: 'https://vorld.app/dashboard?canceled=true',
  //   client_reference_id: userId,
  // })
  // return session

  return { url: "https://stripe.com/checkout/test-session-mock" }
}

export function handleWebhook(eventBody, signature) {
  console.log("[Stripe Webhook] Received event of type: ", eventBody.type)
  // 1. Verify signature
  // 2. Switch block on eventBody.type
  // 3. E.g. case "checkout.session.completed": update supabase plan to 'pro'
  
  if (eventBody.type === "checkout.session.completed") {
    const session = eventBody.data.object
    const userId = session.client_reference_id
    console.log(`[Stripe] Successfully processed payment for user ${userId}`)
    // Call supabase RPC or update query to set plan to "pro"
  }
}
