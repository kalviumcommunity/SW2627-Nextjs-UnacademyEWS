import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "unacademy_ews_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionRole = "STUDENT" | "INSTRUCTOR";

export interface Session {
    userId: string;
    role: SessionRole;
    expiresAt: number;
}

function getSessionSecret() {
    const secret = process.env.SESSION_SECRET;

    if (!secret) {
        throw new Error("SESSION_SECRET is not configured.");
    }

    return secret;
}

function sign(payload: string) {
    return createHmac("sha256", getSessionSecret())
        .update(payload)
        .digest("base64url");
}

function parseSession(value: string): Session | null {
    const [payload, signature, ...extraParts] = value.split(".");

    if (!payload || !signature || extraParts.length > 0) {
        return null;
    }

    const expectedSignature = Buffer.from(sign(payload));
    const receivedSignature = Buffer.from(signature);

    if (
        expectedSignature.length !== receivedSignature.length ||
        !timingSafeEqual(expectedSignature, receivedSignature)
    ) {
        return null;
    }

    try {
        const parsed = JSON.parse(
            Buffer.from(payload, "base64url").toString("utf8"),
        ) as Partial<Session>;

        if (
            typeof parsed.userId !== "string" ||
            (parsed.role !== "STUDENT" && parsed.role !== "INSTRUCTOR") ||
            typeof parsed.expiresAt !== "number" ||
            parsed.expiresAt <= Date.now()
        ) {
            return null;
        }

        return {
            userId: parsed.userId,
            role: parsed.role,
            expiresAt: parsed.expiresAt,
        };
    } catch {
        return null;
    }
}

export async function createSession(user: {
    id: string;
    role: SessionRole;
}) {
    const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
    const payload = Buffer.from(
        JSON.stringify({ userId: user.id, role: user.role, expiresAt }),
    ).toString("base64url");
    const value = `${payload}.${sign(payload)}`;
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DURATION_SECONDS,
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    return value ? parseSession(value) : null;
}
