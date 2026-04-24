import { tryGetContext } from "hono/context-storage";
import { init } from "@paralleldrive/cuid2";

const length = 10; // 50% odds of collision after ~51,386,368 ids
const fallbackFigPrint = "CoNT3xF3tCHF41lDU3ingThiS1";
const SUPPORT_TICKET_LENGTH = 18;

// Self calling function that creates the CUID creation function
export const createId = (() => {
    const ctx = tryGetContext<{ Bindings: Env }>();
    console.log(`Checking env: ${!!ctx ? ctx.env.CUID_SEED : 'NOT PRESENT' }`)
    const fingerprint = !!ctx ? ctx.env.CUID_SEED : fallbackFigPrint;
    return init({length, fingerprint});
})() // Self calling function

export const supportTicketId = (() => {
    const ctx = tryGetContext<{ Bindings: Env }>();
    console.log(`Checking env: ${!!ctx ? ctx.env.CUID_SEED : 'NOT PRESENT' }`)
    const fingerprint = !!ctx ? ctx.env.CUID_SEED : fallbackFigPrint;
    return init({length: SUPPORT_TICKET_LENGTH, fingerprint});
})() // Self calling function