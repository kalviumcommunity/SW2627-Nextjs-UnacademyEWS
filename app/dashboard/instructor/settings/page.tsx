import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/dashboard/SettingsForm";

export default async function InstructorSettingsPage() {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        redirect("/login");
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

    return <SettingsForm initialUser={user} />;
}
