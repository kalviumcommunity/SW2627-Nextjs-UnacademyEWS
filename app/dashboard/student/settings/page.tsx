import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function StudentSettingsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT") {
        redirect("/dashboard/instructor");
    }

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Settings
            </h1>
        </div>
    );
}
