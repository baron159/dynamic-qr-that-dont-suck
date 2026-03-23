import { type PrismaClient } from "pc/client";
import { PrismaD1 } from "@prisma/adapter-d1";

/**
 * Remember to `ctx.waitUnik(client.$disconnect())` to disconnect the client when the context is destroyed.
 * @param e 
 * @returns 
 */
export async function InitDb(e?: Env): Promise<PrismaClient> {
    if (!e) {
        const { getContext } = await import("hono/context-storage");
        const ctx = getContext<{ Bindings: Env }>();
        e = ctx.env;
        
    }
    if (!e?.DB) {
        throw new Error('D1 database binding not found in environment');
    }
    
    const { PrismaClient } = await import("pc/client");
    const instance = new PrismaClient({
        adapter: new PrismaD1(e.DB),
        log: ['error'],
    });
    
    // Add connection test
    try {
        await instance.$connect();
        console.log('Prisma client connected successfully');
    } catch (error) {
        console.error('Failed to connect Prisma client:', error);
        throw error;
    }
    
    return instance;
}