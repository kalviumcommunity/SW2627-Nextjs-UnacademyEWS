import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AuthLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const session = await getSession();

    if (session?.role === "STUDENT") {
        redirect("/dashboard/student");
    }

    if (session?.role === "INSTRUCTOR") {
        redirect("/dashboard/instructor");
    }

    return children;
}
