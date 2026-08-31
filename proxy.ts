import { NextRequest, NextResponse } from "next/server";
import { parseSession, SESSION_COOKIE_NAME } from "@/lib/session";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Read session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? parseSession(sessionCookie) : null;

    // 1. Alias handling: /instructor/* -> /dashboard/instructor/*, /student/* -> /dashboard/student/*
    if (pathname === "/instructor" || pathname.startsWith("/instructor/")) {
        const targetPath = pathname.replace(/^\/instructor/, "/dashboard/instructor");
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        return NextResponse.redirect(new URL(targetPath, request.url));
    }

    if (pathname === "/student" || pathname.startsWith("/student/")) {
        const targetPath = pathname.replace(/^\/student/, "/dashboard/student");
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        return NextResponse.redirect(new URL(targetPath, request.url));
    }

    // 2. Protected routes: /dashboard/*
    if (pathname.startsWith("/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Role-based route protection
        if (pathname.startsWith("/dashboard/instructor") && session.role !== "INSTRUCTOR") {
            return NextResponse.redirect(new URL("/dashboard/student", request.url));
        }

        if (pathname.startsWith("/dashboard/student") && session.role !== "STUDENT") {
            return NextResponse.redirect(new URL("/dashboard/instructor", request.url));
        }

        return NextResponse.next();
    }

    // 3. Auth pages & root: /login, /register, /
    if (pathname === "/login" || pathname === "/register" || pathname === "/") {
        if (session) {
            const destination =
                session.role === "INSTRUCTOR"
                    ? "/dashboard/instructor"
                    : "/dashboard/student";
            return NextResponse.redirect(new URL(destination, request.url));
        }

        if (pathname === "/") {
            return NextResponse.redirect(new URL("/register", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/login",
        "/register",
        "/instructor/:path*",
        "/instructor",
        "/student/:path*",
        "/student",
        "/dashboard/:path*",
    ],
};
