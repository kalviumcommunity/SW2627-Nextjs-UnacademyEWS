import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { TriangleAlert, CheckCircle2 } from "lucide-react";
import SendNudgeButton from "@/components/dashboard/SendNudgeButton";

interface PageProps {
    params: Promise<{ id: string }>;
}

function formatRelativeDate(date: Date | null): string {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
}

function formatActivityDate(date: Date | null): string {
    if (!date) return "None";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

export default async function StudentDetailPage({ params }: PageProps) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "INSTRUCTOR") {
        redirect("/dashboard/student");
    }

    const { id: studentId } = await params;

    // Verify instructor
    const instructor = await prisma.instructor.findUnique({
        where: { userId: session.userId },
        select: { id: true },
    });

    if (!instructor) {
        notFound();
    }

    // Query student details
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            user: { select: { name: true, email: true } },
            risks: { orderBy: { calculatedAt: "desc" }, take: 1 },
            loginActivities: { orderBy: { loginTime: "desc" } },
            quizAttempts: {
                include: { quiz: true },
                orderBy: { submittedAt: "desc" },
            },
            enrollments: {
                include: {
                    course: {
                        include: {
                            quizzes: true,
                        },
                    },
                },
            },
        },
    });

    if (!student) {
        notFound();
    }

    // Check if instructor teaches any course this student is enrolled in
    const teachesStudent = student.enrollments.some(
        (e) => e.course.instructorId === instructor.id
    );

    if (!teachesStudent) {
        notFound();
    }

    const studentName = student.user?.name || "Student";
    const lastLogin = student.loginActivities[0]?.loginTime ?? null;
    const now = new Date();

    const daysSinceLastLogin = lastLogin
        ? Math.floor((now.getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    // Assigned and completed quizzes calculation
    const assignedQuizzesMap = new Map<string, { id: string; dueDate: Date; quizTitle: string }>();
    for (const enrollment of student.enrollments) {
        for (const quiz of enrollment.course.quizzes) {
            assignedQuizzesMap.set(quiz.id, quiz);
        }
    }
    const totalAssignedQuizzes = assignedQuizzesMap.size;

    const completedAttempts = student.quizAttempts.filter((a) => a.completed);
    const completedQuizIds = new Set(completedAttempts.map((a) => a.quizId));
    const completedCount = completedQuizIds.size;
    const uncompletedCount = Math.max(0, totalAssignedQuizzes - completedCount);

    const latestCompletedAttempt = completedAttempts[0];
    let lastQuizCompletedDate = latestCompletedAttempt?.submittedAt ?? null;
    if (lastLogin && lastQuizCompletedDate && new Date(lastQuizCompletedDate) > new Date(lastLogin)) {
        lastQuizCompletedDate = lastLogin;
    }

    // 1. Calculate actual Login Activity Factor (0..50)
    let loginScore = 0;
    if (!lastLogin || daysSinceLastLogin >= 14) {
        loginScore = 50;
    } else if (daysSinceLastLogin >= 5) {
        loginScore = Math.min(50, 20 + (daysSinceLastLogin - 5) * 3);
    } else {
        loginScore = 0;
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentLogins = student.loginActivities.filter(
        (l) => new Date(l.loginTime) >= sevenDaysAgo
    ).length;
    if (recentLogins >= 3 && loginScore > 0) {
        loginScore = Math.max(0, loginScore - 5);
    }

    // 2. Calculate actual Quiz Activity Factor (0..50)
    let quizPenalty = 0;
    let missedOverdueCount = 0;
    for (const quiz of assignedQuizzesMap.values()) {
        if (!completedQuizIds.has(quiz.id) && new Date(quiz.dueDate) < now) {
            quizPenalty += 15;
            missedOverdueCount++;
        }
    }
    for (const attempt of completedAttempts) {
        if (attempt.totalScore > 0) {
            const percentage = (attempt.score / attempt.totalScore) * 100;
            if (percentage < 50) {
                quizPenalty += 15;
            } else if (percentage >= 80) {
                quizPenalty -= 10;
            }
        }
    }
    const quizScore = Math.min(50, Math.max(0, quizPenalty));

    // 3. Compute authentic Total Risk Score & Level
    const totalRiskScore = Math.min(100, Math.max(0, Math.round(loginScore + quizScore)));
    const riskLevel = (totalRiskScore >= 70 ? "HIGH" : totalRiskScore >= 30 ? "MEDIUM" : "LOW") as
        | "HIGH"
        | "MEDIUM"
        | "LOW";

    // 4. Persist calculated risk to database so Students Table and Dashboard match
    const existingRisk = student.risks[0];
    if (existingRisk) {
        if (existingRisk.riskScore !== totalRiskScore || existingRisk.riskLevel !== riskLevel) {
            await prisma.studentRisk.update({
                where: { riskId: existingRisk.riskId },
                data: {
                    riskScore: totalRiskScore,
                    riskLevel,
                    calculatedAt: now,
                },
            });
        }
    } else {
        await prisma.studentRisk.create({
            data: {
                studentId: student.id,
                riskScore: totalRiskScore,
                riskLevel,
                explanation: `Login: ${loginScore}/50, Quiz: ${quizScore}/50`,
                calculatedAt: now,
            },
        });
    }

    // Dynamic warning risk factors
    const riskWarnings: string[] = [];
    if (daysSinceLastLogin >= 7) {
        riskWarnings.push(`No login for ${daysSinceLastLogin} days (threshold: 7 days)`);
    } else if (daysSinceLastLogin >= 5) {
        riskWarnings.push(`Inactivity alert: ${daysSinceLastLogin} days since last login`);
    }

    if (missedOverdueCount > 0) {
        riskWarnings.push(`${missedOverdueCount} missed quiz(zes) past deadline`);
    } else if (uncompletedCount > 0) {
        riskWarnings.push(`${uncompletedCount} out of ${totalAssignedQuizzes} assigned quizzes pending`);
    }

    const lowScoreAttempts = completedAttempts.filter(
        (a) => a.totalScore > 0 && (a.score / a.totalScore) * 100 < 50
    );
    if (lowScoreAttempts.length > 0) {
        riskWarnings.push(`${lowScoreAttempts.length} quiz(zes) scored below 50% passing threshold`);
    }

    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const loginsPast14Days = student.loginActivities.filter(
        (l) => new Date(l.loginTime) >= fourteenDaysAgo
    ).length;

    if ((riskLevel === "HIGH" || riskLevel === "MEDIUM") && loginsPast14Days <= 3) {
        riskWarnings.push("Declining login frequency over past 14 days");
    }

    return (
        <div className="p-8 sm:p-10 max-w-6xl mx-auto space-y-6 font-sans">
            {/* Back Navigation */}
            <div>
                <Link
                    href="/dashboard/instructor/students"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                    <span>&larr;</span> Back to Students
                </Link>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Student Risk Details
                </h1>
                <p className="text-lg font-bold text-zinc-900 mt-1">
                    {studentName}
                </p>
            </div>

            {/* Top 2 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Risk Score Card */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
                    <p className="text-xs font-semibold text-zinc-400">Risk Score</p>
                    <p className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-1.5">
                        {totalRiskScore} / 100
                    </p>
                    <div className="mt-4 space-y-1 text-sm text-zinc-800">
                        <p>
                            Risk Level:{" "}
                            <span className="font-bold text-zinc-900">{riskLevel}</span>
                        </p>
                        <p className="text-zinc-700">
                            Last Login: {formatRelativeDate(lastLogin)}
                        </p>
                        <p className="text-zinc-700">
                            Quiz Completion: {completedCount}/{totalAssignedQuizzes} assigned quizzes completed
                        </p>
                    </div>
                </div>

                {/* Recent Activity Card */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
                    <p className="text-xs font-semibold text-zinc-400">Recent Activity</p>
                    <ul className="mt-4 space-y-2.5 text-sm text-zinc-800">
                        <li className="flex items-center gap-2">
                            <span className="text-zinc-600">&bull;</span>
                            <span>Last login: {formatActivityDate(lastLogin)}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-zinc-600">&bull;</span>
                            <span>Last quiz completed: {formatActivityDate(lastQuizCompletedDate)}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Risk Factors Bottom Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-zinc-900">Risk Factors</h2>
                
                {riskWarnings.length > 0 ? (
                    <div className="space-y-2">
                        {riskWarnings.map((warning, index) => (
                            <div key={index} className="flex items-start gap-2.5 text-sm text-zinc-800 font-medium">
                                <TriangleAlert className="w-4 h-4 text-zinc-800 shrink-0 mt-0.5" />
                                <span>{warning}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Student engagement and quiz completion are on track.</span>
                    </div>
                )}

                <div className="pt-2">
                    <p className="text-xs text-zinc-500">
                        Score breakdown: Login factor ({loginScore}/50) + Quiz factor ({quizScore}/50) = {totalRiskScore}
                    </p>
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
                <SendNudgeButton studentName={studentName} />
            </div>
        </div>
    );
}
