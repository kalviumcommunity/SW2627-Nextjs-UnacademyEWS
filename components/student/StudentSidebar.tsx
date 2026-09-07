"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutUser } from "@/app/actions/auth";

interface NavItem {
    label: string;
    href: string;
}

const primaryNavItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard/student" },
    { label: "My Courses", href: "/dashboard/student/courses" },
    { label: "Quizzes", href: "/dashboard/student/quizzes" },
    { label: "Nudges", href: "/dashboard/student/nudges" },
];

export default function StudentSidebar() {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const isActiveRoute = (href: string) => {
        if (href === "/dashboard/student") {
            return pathname === "/dashboard/student";
        }
        return pathname.startsWith(href);
    };

    const handleLogout = () => {
        startTransition(async () => {
            await logoutUser();
        });
    };

    return (
        <aside className="w-56 shrink-0 border-r border-zinc-200 bg-[#f9fafb] flex flex-col justify-between p-4 h-[calc(100vh-3.5rem)] sticky top-14 self-start overflow-y-auto">
            <div>
                {/* Primary Navigation */}
                <nav className="space-y-1">
                    {primaryNavItems.map((item) => {
                        const active = isActiveRoute(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className={`block rounded-md px-3.5 py-2.5 text-sm transition-colors ${
                                    active
                                        ? "bg-[#e5e7eb] font-semibold text-zinc-900"
                                        : "font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200"
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="my-5 border-t border-zinc-200" />

                {/* Secondary Navigation */}
                <nav className="space-y-1">
                    <Link
                        href="/dashboard/student/settings"
                        prefetch={true}
                        className={`block rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                            pathname.startsWith("/dashboard/student/settings")
                                ? "bg-[#e5e7eb] font-semibold text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200"
                        }`}
                    >
                        Settings
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isPending}
                        className="w-full text-left rounded-md px-3.5 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {isPending ? "Logging out..." : "Logout"}
                    </button>
                </nav>
            </div>
        </aside>
    );
}
