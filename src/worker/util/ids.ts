import { tryGetContext } from "hono/context-storage";
import { init } from "@paralleldrive/cuid2";

const length = 10; // 50% odds of collision after ~51,386,368 ids
const fallbackFigPrint = "CoNT3xF3tCHF41lDU3ingThiS1";
const SUPPORT_TICKET_LENGTH = 18;

function resolveFingerprint(): string {
    const ctx = tryGetContext<{ Bindings: Env }>();
    return ctx?.env.CUID_SEED ?? fallbackFigPrint;
}

export function createId(): string {
    const generator = init({ length, fingerprint: resolveFingerprint() });
    return generator();
}

export function supportTicketId(): string {
    const generator = init({ length: SUPPORT_TICKET_LENGTH, fingerprint: resolveFingerprint() });
    return generator();
}
