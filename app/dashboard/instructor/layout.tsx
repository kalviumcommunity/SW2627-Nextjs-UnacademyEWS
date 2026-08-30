import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function InstructorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "INSTRUCTOR") {
        redirect("/dashboard/student");
    }

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] bg-white text-zinc-900">
            {/* Reusable Left Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 bg-white min-h-[calc(100vh-3.5rem)] overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
