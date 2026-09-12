import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentSettingsForm from "@/components/student/StudentSettingsForm";

export default async function StudentSettingsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT") {
        redirect("/dashboard/instructor");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    return <StudentSettingsForm initialUser={user} />;
}

