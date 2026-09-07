import StudentSidebar from "@/components/student/StudentSidebar";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] bg-white text-zinc-900">
            <StudentSidebar />
            <main className="flex-1 bg-white min-h-[calc(100vh-3.5rem)] overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
