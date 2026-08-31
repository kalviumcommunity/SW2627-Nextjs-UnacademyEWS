import Sidebar from "@/components/dashboard/Sidebar";

export default function InstructorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] bg-white text-zinc-900">
            <Sidebar />
            <main className="flex-1 bg-white min-h-[calc(100vh-3.5rem)] overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
