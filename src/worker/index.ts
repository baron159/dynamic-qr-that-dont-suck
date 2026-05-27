import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { HTTPException } from "hono/http-exception";
import { jwt } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { SignatureKey } from "hono/utils/jwt/jws";
import type { VerifyOptions } from "hono/utils/jwt/jwt";
import type { User } from "pc/client";
import type Stripe from "stripe";
import type { QrUncheckedUpdateInput } from "pc/models";

export interface JwtPayload extends JWTPayload {
    userId: string;
    stripeCustomerId: string | null;
    monthlySuber: string | null;
    exp: number;
    iat: number;
    nbf: number;
    iss: string;
}


const app = new Hono<{ Bindings: Env }>();
app.use(contextStorage());
app.onError((err, c) => {
    console.error('THROWN ERROR, CAUGHT BY GLOBAL ERROR HANDLER', err);
    if (err instanceof HTTPException) {
        // Get the custom response
        return err.getResponse()
    }
    console.log('err.message', err.name);
    if (err.name.includes('JwtTokenInvalid')) {
        console.log('Bad Token Error');
        return c.json({ error: 'Unauthorized' }, 401);
    }
    return c.json({ error: 'Internal Server Error' }, 500)
});

// Middleware
app.use('/api/auth/*', (c, next) => {
    return jwt({
        secret: c.env.JWT_SECRET as SignatureKey,
        alg: 'EdDSA',
        verification: {
            iss: c.env.APP_HOST as string
        } as VerifyOptions
    })(c, next)
});

// heartbeat route
app.get("/api/", (c) => c.json({ name: "dynamic-qr-codes-that-dont-suck-api", status: 'up' }));

// Route for account signup
app.post('/api/entry', async c => {
    const { InitDb } = await import('./util/db.client');
    const client = await InitDb(c.env);
    const { newPasswordHash, verifyPassword } = await import('./util/password.things');
    const body = await c.req.json() as { email: string, password: string, name?: string, phone?: string };
    let user: User | null;
    if ('name' in body && !!body.name) {
        // Create an account for the user
        const passHash = newPasswordHash(body.password);
        user = await client.user.create({
            data: {
                email: body.email,
                passHash: passHash,
                name: body.name,
                phone: body.phone
            }
        });
    } else if ('name' in body && !body.name) {
        // Provoked signup but missing name
        return c.json({ error: 'Name is required' }, 400);
    } else {
        // Normal signin
        user = await client.user.findUnique({
            where: {
                email: body.email
            }
        });
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        if (!verifyPassword(body.password, user.passHash)) {
            return c.json({ error: 'Invalid password' }, 401);
        }
    }
    const jwtPayload: JwtPayload = {
        userId: user.id,
        stripeCustomerId: user.stripeCustomerId || null,
        monthlySuber: user.monthlySubscription || null,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
        iss: c.env.APP_HOST
    }
    const { sign } = await import('hono/jwt');
    const token = await sign(jwtPayload, c.env.JWT_SECRET, 'EdDSA');
    c.executionCtx.waitUntil(client.$disconnect());
    return c.json({
        token,
        user: {
            id: user.id,
        }
    })
});

// Route for getting account -- populates the user portal
// TODO --> Add a update PUT logic that updates the user info
app.on(['get', 'put', 'post'], '/api/auth/info', async c => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const { InitDb } = await import('./util/db.client');
    const client = await InitDb(c.env);
    switch (c.req.method) {
        case 'GET':
            const user = await client.user.findUnique({
                where: { id: payload.userId },
                omit: { passHash: true, createdAt: true },
                include: {
                    Qr: true,
                    _count: {
                        select: {
                            Credit: true
                        }
                    }
                }
            });
            c.executionCtx.waitUntil(client.$disconnect());
            return c.json({ user, billingPortal: c.env.STRIPE_CUSTOMER_PORTAL }, 200);
        case 'POST':
        case 'PUT':
            const data = await c.req.json() as {phone?:string, name?:string};
            const updated = await client.user.update({
                where: { id: payload.userId },
                data
            })
            return c.json({user: updated},200);
        default:
            return c.json({ err: 'un-supported method' }, 405);
    }
});

// Embedded Checkout for dynamic-credit price (lookup key in Stripe Dashboard)
app.get('/api/auth/credit/purchase', async (c) => {
    const { createDynamicCreditCheckoutSession } = await import('./util/stripe.things');
    const payload = c.get('jwtPayload') as JwtPayload;
    const qnty = c.req.query('q');
    try {
        const checkoutKeys = await createDynamicCreditCheckoutSession(
            payload.userId,
            !!qnty ? parseInt(qnty) : 1
        );
        if (!checkoutKeys.sessionUrl) {
            return c.json({ error: 'No session URL' }, 502);
        }
        return c.json({url: checkoutKeys.sessionUrl}, 200);
    } catch (e) {
        console.error('createDynamicCreditCheckoutSession', e);
        const msg = e instanceof Error ? e.message : 'Stripe checkout failed';
        return c.json({ error: msg }, 502);
    }
});

app.get('/api/auth/monthly/purchase', async (c) => {
    const { createDynamicCreditCheckoutSession, DYNAMIC_MONTHLY_LOOKUP_KEY } = await import('./util/stripe.things');
    const payload = c.get('jwtPayload') as JwtPayload;
    try {
        const checkoutKeys = await createDynamicCreditCheckoutSession(
            payload.userId,
            1,
            DYNAMIC_MONTHLY_LOOKUP_KEY
        );
        if (!checkoutKeys.sessionUrl) {
            return c.json({ error: 'No session URL' }, 502);
        }
        return c.json({url: checkoutKeys.sessionUrl}, 200);
    } catch (e) {
        console.error('createDynamicCreditCheckoutSession', e);
        const msg = e instanceof Error ? e.message : 'Stripe checkout failed';
        return c.json({ error: msg }, 502);
    }
});

// Route for buying new qrs
// CURRENTLY Assuming the GET will return a Strip purchase link
// and the POST will create a new QR
// PUT will update a QR
app.on(['get', 'post', 'put'], '/api/auth/qr', async (c) => {
    const { InitDb } = await import('./util/db.client');
    const client = await InitDb(c.env);
    const payload = c.get('jwtPayload') as JwtPayload;

    switch (c.req.method) {
        case 'GET':
            // TODO: Implement this
            return c.json({ link: 'noop' }, 200);
        case 'POST':
            const body = await c.req.json() as { nickname?: string, redirectLink: string };
            // *** 4/15/26 Update-- I don't think checking ahead of time is needed anymore... Tho
            // *** doing a check to auto enable the QR would probably be nice.
            // TODO: Check the stripe purchase id is valid
            // if (body.stripePurchaseId === 'subscription') {
            //     // TODO: Check the user has a subscription
            //     if (!payload.monthlySuber) {
            //         return c.json({ error: 'invalid QR creation: no purchase or subscription' }, 400);
            //     }
            // } else {
            //     // TODO: Check the user has a purchase
            // }
            const { createId } = await import('./util/ids');
            const qr = await client.qr.create({
                data: {
                    kvId: `${c.env.APP_HOST}/l/${createId()}`,
                    redirectLink: body.redirectLink,
                    userId: payload.userId,
                    nickname: body.nickname || 'QR Dynamics',
                    active: false // Hardcoded false for the moment -- until we get a little smarter about it
                }
            });
            const ac = await client.qr.count({
                where: {
                    userId: payload.userId,
                    active: true
                }
            });
            c.executionCtx.waitUntil(client.$disconnect());
            return c.json({ qr, activeCount: ac }, 200);
        case 'PUT':
            const b = await c.req.json() as QrUncheckedUpdateInput;
            if('kvId' in b) return c.json({msg: 'You can not change the kvId once created'}, 400);
            else if(!b.id) return c.json({msg: 'an id is required to update, but not present'}, 400);
            const cqr = await client.qr.findUniqueOrThrow({ where: { id: b.id as string }, select: { active: true}});
            // Check if the active status is changing. And if it is, then check things
            if('active' in b && !cqr.active && !!b.active){
                const creditInfo = await client.user.findUniqueOrThrow({where: {id: payload.userId}, select:{ _count: {
                    select: {
                        Qr: {where: {active: true, NOT: {id: b.id as string}}},
                        Credit: true
                    }
                }}});
                if(creditInfo._count.Qr >= creditInfo._count.Credit ){
                    // trying to change the active status, but lacking credit to do so
                    return c.json({msg: "lacking credit. Unable to activate"}, 400);
                }
            }
            const updatedQr = await client.qr.update({
                where: { id: b.id as string },
                data: {...b},
            });
            const activeCount = await client.qr.count({
                where: {
                    userId: payload.userId,
                    active: true
                }
            });
            const kvParts = updatedQr.kvId.split('/');
            if(updatedQr.active){
                await c.env.KV.put(kvParts[kvParts.length -1], updatedQr.redirectLink);
            } else {
                await c.env.KV.delete(kvParts[kvParts.length -1])
            }
            c.executionCtx.waitUntil(client.$disconnect());
            return c.json({ qr: updatedQr, activeCount }, 200);
        default:
            // Unsupported method hit
            return c.text("Method not allowed", 405);
    }

});

// Route for subscribing??

// Route for managing qr @deprecated?
app.all('/api/auth/qr/:linkId');

// Route for getting the QR
app.get('/api/qr/:linkId')

const MAX_FILE_BYTES = 1024 * 1024 * 1024; // 1 GB

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120) || 'file';
}

function fileKeyOwnerPrefix(userId: string): string {
    return `files/${userId}/`;
}

// Start a multipart upload for a file to attach to a QR
app.post('/api/auth/files/start', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const body = await c.req.json() as { filename: string; contentType?: string; size: number };
    if (typeof body.size !== 'number' || body.size <= 0) {
        return c.json({ error: 'Invalid size' }, 400);
    }
    if (body.size > MAX_FILE_BYTES) {
        return c.json({ error: 'File too large (max 1GB)' }, 413);
    }
    const { createId } = await import('./util/ids');
    const fileId = createId();
    const safeName = sanitizeFilename(body.filename || 'file');
    const key = `${fileKeyOwnerPrefix(payload.userId)}${fileId}/${safeName}`;
    const upload = await c.env.R2.createMultipartUpload(key, {
        httpMetadata: body.contentType ? { contentType: body.contentType } : undefined,
        customMetadata: { uploaderUserId: payload.userId, originalFilename: safeName },
    });
    return c.json({
        key,
        uploadId: upload.uploadId,
        url: `${c.env.APP_HOST}/f/${key}`,
    }, 200);
});

// Upload a single part of a multipart upload. Body is the raw bytes of the part.
app.put('/api/auth/files/part', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const key = c.req.query('key');
    const uploadId = c.req.query('uploadId');
    const partNumberStr = c.req.query('partNumber');
    if (!key || !uploadId || !partNumberStr) {
        return c.json({ error: 'key, uploadId, partNumber are required' }, 400);
    }
    if (!key.startsWith(fileKeyOwnerPrefix(payload.userId))) {
        return c.json({ error: 'forbidden' }, 403);
    }
    const partNumber = parseInt(partNumberStr, 10);
    if (!Number.isFinite(partNumber) || partNumber < 1) {
        return c.json({ error: 'Invalid partNumber' }, 400);
    }
    const body = c.req.raw.body;
    if (!body) return c.json({ error: 'Missing body' }, 400);
    const upload = c.env.R2.resumeMultipartUpload(key, uploadId);
    const uploaded = await upload.uploadPart(partNumber, body);
    return c.json(uploaded, 200);
});

// Complete a multipart upload and return the public URL
app.post('/api/auth/files/complete', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const body = await c.req.json() as { key: string; uploadId: string; parts: { partNumber: number; etag: string }[] };
    if (!body.key || !body.uploadId || !Array.isArray(body.parts) || body.parts.length === 0) {
        return c.json({ error: 'key, uploadId and parts are required' }, 400);
    }
    if (!body.key.startsWith(fileKeyOwnerPrefix(payload.userId))) {
        return c.json({ error: 'forbidden' }, 403);
    }
    const upload = c.env.R2.resumeMultipartUpload(body.key, body.uploadId);
    const obj = await upload.complete(body.parts);
    if (obj.size > MAX_FILE_BYTES) {
        await c.env.R2.delete(body.key);
        return c.json({ error: 'File exceeds 1GB limit' }, 413);
    }
    return c.json({
        key: body.key,
        size: obj.size,
        etag: obj.httpEtag,
        url: `${c.env.APP_HOST}/f/${body.key}`,
    }, 200);
});

// Abort a multipart upload
app.post('/api/auth/files/abort', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const body = await c.req.json() as { key: string; uploadId: string };
    if (!body.key || !body.uploadId) return c.json({ error: 'key, uploadId required' }, 400);
    if (!body.key.startsWith(fileKeyOwnerPrefix(payload.userId))) {
        return c.json({ error: 'forbidden' }, 403);
    }
    const upload = c.env.R2.resumeMultipartUpload(body.key, body.uploadId);
    await upload.abort();
    return c.json({ ok: true }, 200);
});

// Public route to serve a file from R2. The first path segment after /f/ is the
// owner userId; the rest forms the rest of the R2 key.
app.get('/f/*', async (c) => {
    const path = new URL(c.req.url).pathname;
    const key = decodeURIComponent(path.replace(/^\/f\//, ''));
    if (!key || !key.startsWith('files/')) {
        return c.text('not found', 404);
    }
    const rangeHeader = c.req.header('range');
    const getOpts: R2GetOptions = {};
    if (rangeHeader) {
        // Let R2 handle range parsing via the Range header semantics.
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
        if (match) {
            const start = match[1] === '' ? undefined : parseInt(match[1], 10);
            const end = match[2] === '' ? undefined : parseInt(match[2], 10);
            if (start !== undefined && end !== undefined) {
                getOpts.range = { offset: start, length: end - start + 1 };
            } else if (start !== undefined) {
                getOpts.range = { offset: start };
            } else if (end !== undefined) {
                getOpts.range = { suffix: end };
            }
        }
    }
    const obj = await c.env.R2.get(key, getOpts);
    if (!obj) return c.text('not found', 404);
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    headers.set('accept-ranges', 'bytes');
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    const filename = obj.customMetadata?.originalFilename;
    if (filename && !headers.has('content-disposition')) {
        headers.set('content-disposition', `inline; filename="${filename}"`);
    }
    if (obj.range) {
        const totalSize = obj.size;
        const offset = 'offset' in obj.range ? (obj.range.offset ?? 0) : 0;
        const length = 'length' in obj.range && obj.range.length !== undefined ? obj.range.length : totalSize - offset;
        headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${totalSize}`);
        headers.set('content-length', String(length));
        return new Response(obj.body, { status: 206, headers });
    }
    headers.set('content-length', String(obj.size));
    return new Response(obj.body, { status: 200, headers });
});

app.post('/api/auth/support/ticket', async c => {
    const { InitDb } = await import('./util/db.client');
    const { supportTicketId } = await import('./util/ids');
    const client = await InitDb(c.env);
    const payload = c.get('jwtPayload') as JwtPayload;
    // Look for the user
    const usr = await client.user.findUniqueOrThrow({
        where:{id: payload.userId},
        include: {_count: {select: {Credit: true}}}
    });
    const supportBdy = await c.req.json() as {msg: string, mthd?:'phone' | 'email'};
    const tid = supportTicketId();
    const supportDoc = {
        tid,
        uName: usr.name,
        email: usr.email,
        phone: usr.phone,
        numCredits: usr._count.Credit,
        subscriber: usr.monthlySubscription,
        ...supportBdy
    };
    await c.env.R2.put(`/support/tickets/${usr.name}_${tid}.json`, JSON.stringify(supportDoc));
    c.executionCtx.waitUntil(client.$disconnect());
    return c.text('ok', 200)
})

// The route that looks up the redirect 
app.get("/l/:linkId", async (c) => {
    const kvid = c.req.param('linkId');
    const rl = await c.env.KV.get(kvid, 'text');
    if (!rl) {
        return c.text('deactivated or unknown location', 404);
        // KV is persistant enough that we can rely on it soley
        // const { InitDb } = await import('./util/db.client');
        // const client = await InitDb(c.env);
        // const qr = await client.qr.findFirst({
        //     where: { kvId: kvid, active: true },
        // });
        // if (!qr) {
        //     return c.text("unknown", 404);
        // }
        // c.executionCtx.waitUntil(client.$disconnect());
        // const putIntoKv = async () => {
        //     await c.env.KV.put(kvid, qr.redirectLink!, { expirationTtl: 30 });
        // }
        // c.executionCtx.waitUntil(putIntoKv());
        // return c.redirect(qr.redirectLink, 301);
    } else return c.redirect(rl, 301);
})

app.all('/api/webhooks/stripe', async (c) => {
    const { verifyWebhookSignature, checkoutCompletedHandler, invoicPaymentSuccessHandler, subscriptionChangeHandler } = await import('./util/stripe.things');
    const sig = c.req.header('stripe-signature');
    if (!sig) throw new Error('Stripe signature not found');
    const body: Stripe.Event = await verifyWebhookSignature(await c.req.raw.text(), sig);
    switch (body.type) {
        case 'checkout.session.completed':
            console.log('checkout session hook hit');
            c.executionCtx.waitUntil(checkoutCompletedHandler(body.data));
            break;
        case 'invoice.payment_succeeded':
            console.log('invoice payment succeeded');
            c.executionCtx.waitUntil(invoicPaymentSuccessHandler(body.data));
            break;
        case 'customer.subscription.updated':
            console.log('customer subscription update');
            c.executionCtx.waitUntil(subscriptionChangeHandler(body.data));
            break;
        default:
            console.warn('UNKNOWN WEBHOOK HIT', body.type);
    }
    return c.json({ message: 'Webhook received' }, 200);
});

export default {
    fetch: app.fetch,
    scheduled: async( _ctn:ScheduledController, _env:Env, _ctx:ExecutionContext )=>{
        /**
         * Need to check for invalid subscriber dates
         * Check the latest subscription status
         * - if no reneual, turn off all QRs. Remove parts in user obj
         * - if yes, update the 'until' column with the latest
         * 
         * NOTE -- It may be better to watch the `invoice.payment_succeeded` hook
         */
    }
};
