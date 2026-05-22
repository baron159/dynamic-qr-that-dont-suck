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

// function resolveReturnUrl(appHost: string, given?: string): string {
//     const base = appHost.replace(/\/$/, "");
//     if (!given) {
//         return `${base}/dashboard`;
//     }
//     try {
//         return new URL(given).href;
//     } catch {
//         return new URL(given, base).href;
//     }
// }

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

export async function invoicPaymentSuccessHandler(payload: Stripe.InvoicePaymentSucceededEvent.Data){
    if(payload.object.billing_reason !== 'subscription_cycle'){
        console.log('invoice payment success event recieved -- but the billing reason is not one we care about::', payload.object.billing_reason);
        return;
    };
    const { tryGetContext } = await import('hono/context-storage');
    const ctx = tryGetContext<{ Bindings: Env }>();
    if (!ctx) throw Error('Unable to retrieve context');
    try{
        const sid = payload.object.parent?.subscription_details?.subscription as string;
        if(!sid || sid === '') throw Error('Subscription ID is not present');
        const subStatus = await checkSubscriptionStatus(sid);
        const { InitDb } = await import('./db.client');
        const client = await InitDb(ctx.env);
        if(!subStatus.isActive){
            // Should this be used to clear a subscription within our database???
            console.info('Subscription is not active');
            return;
        } else {
            if(!subStatus.endDate){
                console.error('no end date found');
                throw Error('Subscription status returned without a "endDate" present... unable to contiune with the process')
            }
            await client.user.updateMany({
                where: { monthlySubscription: sid },
                data: { subscriptionValidTill: subStatus.endDate }
            });
            console.info('User subscription has been extended');
        }
    } catch(error){
        console.error(`[stripe.things::invoicePaymentSiccessHandler] Error occurred\n${error}`)
    }
}

export async function subscriptionChangeHandler(payload: Stripe.CustomerSubscriptionUpdatedEvent.Data){
    if(payload.object.status !== 'canceled'){
        console.log('subscription change not canceled -- so we dont handle anything here');
        return;
    }
    const { tryGetContext } = await import('hono/context-storage');
    const ctx = tryGetContext<{ Bindings: Env }>();
    if (!ctx) throw Error('Unable to retrieve context');
    try {
        const { InitDb } = await import('./db.client');
        const client = await InitDb(ctx.env);
        const sid = payload.object.items.data[0].subscription as string;
        const uids = await client.user.updateManyAndReturn({
            where: {monthlySubscription: sid},
            data: { 
                monthlySubscription: null,
                subscriptionValidTill: null,
            },
            select: { id: true }
        });
        await client.qr.updateMany({
            where: { userId: { in: uids.map(ii => ii.id) }},
            data: { active: false }
        });
        console.log('[stripe.things::subscriptionChangeHandler] All user qrs have been deactivated.');
        return;
    } catch (error) {
        console.error(`[stripe.things::subscriptionChangeHandler] Error occurred\n${error}`)
    }
}

interface SubscriptionStatusResult {
    isActive: boolean;
    endDate: Date | null;
    status: Stripe.Subscription.Status;
    cancelAtPeriodEnd: boolean;
}

/**
 * Check if a Stripe subscription is active and return its end date.
 *
 * @param subscriptionId - The Stripe subscription ID (e.g., 'sub_xxx')
 * @returns SubscriptionStatusResult with active status and end date
 *
 * Active statuses: 'active', 'trialing'
 * End date is current_period_end for active subs, ended_at for canceled subs
 */
export async function checkSubscriptionStatus(
    subscriptionId: string
): Promise<SubscriptionStatusResult> {
    const { tryGetContext } = await import('hono/context-storage');
    const ctx = tryGetContext<{ Bindings: Env }>();
    if (!ctx) throw new Error('Unable to retrieve context');
    const stripe = await stripeClient(ctx.env.STRIPE_SECRET);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Consider both 'active' and 'trialing' as active states
    const activeStatuses: Stripe.Subscription.Status[] = ['active', 'trialing'];
    const isActive = activeStatuses.includes(subscription.status);

    // Determine the end date:
    // - If canceled/ended: use ended_at
    // - Otherwise: use current_period_end (when the current billing period ends)
    let endDate: Date | null = null;

    if (subscription.ended_at) {
        endDate = new Date(subscription.ended_at * 1000);
        // @ts-ignore
    } else if ('current_period_end' in subscription.current_period_end) {
        // @ts-ignore
        endDate = new Date(subscription.current_period_end * 1000);
    } else if (subscription.items.data.length > 0){
        endDate = new Date(subscription.items.data[0].current_period_end as number * 1000)
    }

    return {
        isActive,
        endDate,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
}
