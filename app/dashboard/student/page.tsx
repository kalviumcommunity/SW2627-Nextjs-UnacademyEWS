import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function StudentDashboardPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT") {
        redirect("/dashboard/instructor");
    }

    return (
        <main className="flex-1 p-6 sm:p-10">
            <section className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-medium text-zinc-500">Student dashboard</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                    Welcome back
                </h1>
                <p className="mt-3 text-zinc-600">
                    View your progress, course activity, and early-warning updates here.
                </p>
            </section>
        </main>
    );
}
