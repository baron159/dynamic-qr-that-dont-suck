import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { HTTPException } from "hono/http-exception";
import { jwt } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { SignatureKey } from "hono/utils/jwt/jws";
import type { VerifyOptions } from "hono/utils/jwt/jwt";
import type { User } from "pc/client";

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
    const body = await c.req.json() as { email: string, password: string, name?: string };
    let user: User | null;
    if ('name' in body && !!body.name) {
        // Create an account for the user
        const passHash = newPasswordHash(body.password);
        user = await client.user.create({
            data: {
                email: body.email,
                passHash: passHash,
                name: body.name
            }
        });
    } else if ('name' in body && !body.name) {
        // Provoked signup but missing name
        return c.json({ error: 'Name is required' }, 400);
    } else {
        // Normal signup
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
            name: user.name,
            email: user.email,
            phone: user.phone,
            stripeCustomerId: !!user.stripeCustomerId,
            monthlySubscription: !!user.monthlySubscription
        }
    })
});

// Route for getting account QRs -- populates the user portal
// TODO --> Add a update PUT logic
app.get('/api/auth/info', async c => {
    const payload = c.get('jwtPayload') as JwtPayload;
    const { InitDb } = await import('./util/db.client');
    const client = await InitDb(c.env);
    const user = await client.user.findUnique({
        where: { id: payload.userId },
        include: { Qr: true }
    });
    c.executionCtx.waitUntil(client.$disconnect());
    return c.json({ user }, 200)
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
            const body = await c.req.json() as { stripePurchaseId: string, redirectLink: string };
            // TODO: Check the stripe purchase id is valid
            if (body.stripePurchaseId === 'subscription') {
                // TODO: Check the user has a subscription
                if (!payload.monthlySuber) {
                    return c.json({ error: 'invalid QR creation: no purchase or subscription' }, 400);
                }
            } else {
                // TODO: Check the user has a purchase
            }
            const { createId } = await import('./util/ids');
            const qr = await client.qr.create({
                data: {
                    kvId: createId(),
                    redirectLink: body.redirectLink,
                    stripePurchaseId: body.stripePurchaseId,
                    userId: payload.userId
                }
            });
            c.executionCtx.waitUntil(client.$disconnect());
            return c.json({ qr }, 200);
        case 'PUT':
            const b = await c.req.json() as { redirectLink: string, id: string };
            const updatedQr = await client.qr.update({
                where: { id: b.id },
                data: {
                    redirectLink: b.redirectLink
                }
            });
            c.executionCtx.waitUntil(client.$disconnect());
            return c.json({ qr: updatedQr }, 200);
    }

});

// Route for subscribing??

// Route for managing qr @deprecated?
app.all('/api/auth/qr/:linkId');

// Route for getting the QR
app.get('/api/qr/:linkId')

// The route that looks up the redirect 
app.get("/l/:linkId", async (c) => {
    const kvid = c.req.param('linkId');
    const rl = await c.env.KV.get(kvid, 'text');
    if (!rl) {
        const { InitDb } = await import('./util/db.client');
        const client = await InitDb(c.env);
        const qr = await client.qr.findFirst({
            where: { kvId: kvid, active: true },
        });
        if (!qr) {
            return c.text("unknown", 404);
        }
        c.executionCtx.waitUntil(client.$disconnect());
        const putIntoKv = async () => {
            await c.env.KV.put(kvid, qr.redirectLink!, { expirationTtl: 30 });
        }
        c.executionCtx.waitUntil(putIntoKv());
        return c.redirect(qr.redirectLink, 301);
    } else return c.redirect(rl, 301);
})

export default app;
