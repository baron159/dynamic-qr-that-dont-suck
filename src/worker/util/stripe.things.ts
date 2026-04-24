import type Stripe from "stripe";
// import { tryGetContext } from "hono/context-storage";

export const DYNAMIC_CREDIT_LOOKUP_KEY = "dynamic-credit" as const;
export const DYNAMIC_MONTHLY_LOOKUP_KEY = "dynamic-monthly" as const;
export const DYNAMIC_YEARLY_LOOKUP_KEY = "dynamic-yearly" as const;
export type DynamicLookupKey = 'dynamic-credit' | 'dynamic-monthly' | 'dynamic-monthly'

async function stripeClient(secret: string) {
    const { Stripe } = await import('stripe');
    return new Stripe(secret, {
        httpClient: Stripe.createFetchHttpClient(),
    });
}

function resolveReturnUrl(appHost: string, given?: string): string {
    const base = appHost.replace(/\/$/, "");
    if (!given) {
        return `${base}/dashboard`;
    }
    try {
        return new URL(given).href;
    } catch {
        return new URL(given, base).href;
    }
}

/**
 * Creates an embedded Checkout Session for the Stripe Price with lookup key `dynamic-credit`.
 * Returns the client secret for Stripe.js Embedded Checkout.
 */
export async function createDynamicCreditCheckoutSession(userId: string, quantity = 1, checkoutType: DynamicLookupKey = DYNAMIC_CREDIT_LOOKUP_KEY): Promise<{ sessionUrl: string | null }> {
    const { tryGetContext } = await import('hono/context-storage');
    const ctx = tryGetContext<{ Bindings: Env }>();
    if (!ctx) throw new Error('Unable to retrieve context');
    const stripe = await stripeClient(ctx.env.STRIPE_SECRET);
    const prices = await stripe.prices.list({
        lookup_keys: [checkoutType],
        limit: 1,
        active: true,
    });
    const price = prices.data[0];
    if (!price) {
        throw new Error(
            `No active Stripe price found for lookup key "${checkoutType}"`,
        );
    }
    const mode = price.type === "recurring" ? "subscription" : "payment";
    // const returnUrl = resolveReturnUrl(env.APP_HOST, options?.returnUrl);
    const session = await stripe.checkout.sessions.create({
        mode,
        line_items: [{ price: price.id, quantity }],
        success_url: `${ctx.env.APP_HOST}/dashboard`,
        ui_mode: 'hosted_page',
        metadata: {
            userId, quantity
        }
    });
    // if (!session.client_secret) {
    //     throw new Error("Checkout Session did not return client_secret");
    // }
    console.log('session', session);
    return { sessionUrl: session.url };
}

/**
 * Verify the signature of a webhook
 * @param body The body of the webhook
 * @param sig The signature of the webhook request
 * @returns The event
 * @throws Error if the signature is invalid or the webhook secret is not found
 */
export async function verifyWebhookSignature(body: string | Buffer, sig: string): Promise<Stripe.Event> {
    const { tryGetContext } = await import('hono/context-storage');
    const ctx = tryGetContext<{ Bindings: Env }>();
    if (!ctx) throw new Error('Unable to retrieve context');
    if (!ctx.env.STRIPE_WHSEC) throw new Error('Stripe webhook secret not found');
    const stripe = await stripeClient(ctx.env.STRIPE_SECRET);
    return await stripe.webhooks.constructEventAsync(body, sig, ctx.env.STRIPE_WHSEC);
}

export async function checkoutCompletedHandler(payload: Stripe.CheckoutSessionCompletedEvent.Data) {
    const { tryGetContext } = await import('hono/context-storage');
    const ctx = tryGetContext<{ Bindings: Env }>();
    if (!ctx) throw new Error('Unable to retrieve context');
    // Will be present in a subscription as well
    const { userId, quantity } = payload.object.metadata as { userId: string, quantity: string };
    try {
        const { InitDb } = await import('./db.client');
        const client = await InitDb(ctx.env);
        if (!!payload.object.subscription) {
            const stripe = await stripeClient(ctx.env.STRIPE_SECRET);
            const sub = await stripe.subscriptions.retrieve(payload.object.subscription as string);
            console.log('SUBSCRIPTION HERE\n\n', sub);
            // @ts-ignore
            const endStamp = sub.items.data[0].current_period_end as number;
            await client.user.update({
                where: { id: userId },
                data: {
                    monthlySubscription: sub.id, 
                    stripeCustomerId: sub.customer as string,
                    subscriptionValidTill: new Date(endStamp * 1000)
                }
            })
        } else {
            // One-time purchase credits
            const count = parseInt(quantity);
            const credits: number[] = [];
            credits.length = count;
            await client.credit.createMany({
                data: credits.fill(0).map(() => { return { userId, shopifyOrderId: payload.object.id } })
            });
        }

        ctx.executionCtx.waitUntil(client.$disconnect());

    } catch (error) {
        console.error(`DURING CHECKOUT COMPLETE\n\n`, error)
    }
};
