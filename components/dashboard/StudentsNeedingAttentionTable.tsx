import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export type StudentWithRelations = {
    id: string;
    user?: { name: string; email: string } | null;
    risks: Array<{ riskScore: number; riskLevel: "LOW" | "MEDIUM" | "HIGH"; calculatedAt: Date }>;
    loginActivities: Array<{ loginTime: Date }>;
    nudges: Array<{ status: "NOT_REQUIRED" | "PENDING" | "SENT" }>;
};

export interface StudentsNeedingAttentionTableProps {
    students?: StudentWithRelations[];
    limit?: number;
    className?: string;
}

function formatRelativeDate(date: Date | null | undefined): string {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays === 0) {
        if (diffHours < 1) return "Just now";
        return "Today";
    }
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
}

function formatNudgeStatus(status: string | undefined): { label: string; className: string } {
    switch (status) {
        case "SENT":
            return {
                label: "Sent",
                className: "bg-blue-50 text-blue-700 border border-blue-200",
            };
        case "PENDING":
            return {
                label: "Pending",
                className: "bg-amber-50 text-amber-700 border border-amber-200",
            };
        case "NOT_REQUIRED":
        default:
            return {
                label: "Not Required",
                className: "bg-zinc-100 text-zinc-600 border border-zinc-200",
            };
    }
}

function formatRiskLevel(level: string | undefined): { label: string; className: string } {
    switch (level) {
        case "HIGH":
            return {
                label: "High",
                className: "bg-red-50 text-red-700 border border-red-200",
            };
        case "MEDIUM":
            return {
                label: "Medium",
                className: "bg-amber-50 text-amber-700 border border-amber-200",
            };
        case "LOW":
        default:
            return {
                label: "Low",
                className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            };
    }
}

export default async function StudentsNeedingAttentionTable({
    students: providedStudents,
    limit,
    className = "",
}: StudentsNeedingAttentionTableProps) {
    let rawStudents = providedStudents;

    if (!rawStudents) {
        try {
            rawStudents = await prisma.student.findMany({
                include: {
                    user: {
                        select: { name: true, email: true },
                    },
                    risks: {
                        orderBy: { calculatedAt: "desc" },
                        take: 1,
                    },
                    loginActivities: {
                        orderBy: { loginTime: "desc" },
                        take: 1,
                    },
                    nudges: {
                        orderBy: { nudgeId: "desc" },
                        take: 1,
                    },
                },
            });
        } catch (error) {
            console.error("Error querying students from database:", error);
            rawStudents = [];
        }
    }

    // Map each student with sensible defaults
    const processedStudents = rawStudents.map((student) => {
        const latestRisk = student.risks[0];
        const riskScore = latestRisk?.riskScore ?? 0;
        const riskLevel = latestRisk?.riskLevel ?? "LOW";
        const lastLogin = student.loginActivities[0]?.loginTime ?? null;
        const nudgeStatus = student.nudges[0]?.status ?? "NOT_REQUIRED";

        return {
            id: student.id,
            name: student.user?.name || "Unnamed Student",
            email: student.user?.email || "",
            riskScore,
            riskLevel,
            lastLogin,
            nudgeStatus,
        };
    });

    // Only show students whose nudge status is PENDING
    const pendingStudents = processedStudents.filter(
        (student) => student.nudgeStatus === "PENDING"
    );

    // Sort students by highest Risk Score first
    pendingStudents.sort((a, b) => b.riskScore - a.riskScore);

    const displayStudents =
        typeof limit === "number" && limit > 0
            ? pendingStudents.slice(0, limit)
            : pendingStudents;

    return (
        <div className={`rounded-lg border border-zinc-200 overflow-hidden bg-white ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#f3f4f6] text-xs font-semibold text-zinc-700 border-b border-zinc-200">
                            <th className="px-5 py-3.5">Student Name</th>
                            <th className="px-5 py-3.5 text-center">Risk Score</th>
                            <th className="px-5 py-3.5">Risk Level</th>
                            <th className="px-5 py-3.5">Last Login</th>
                            <th className="px-5 py-3.5">Nudge Status</th>
                            <th className="px-5 py-3.5 text-right sm:text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-sm">
                        {displayStudents.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-5 py-8 text-center text-zinc-500"
                                >
                                    No students currently have pending nudges.
                                </td>
                            </tr>
                        ) : (
                            displayStudents.map((student) => {
                                const nudgeBadge = formatNudgeStatus(student.nudgeStatus);
                                const riskBadge = formatRiskLevel(student.riskLevel);

                                return (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-zinc-50/80 transition-colors"
                                    >
                                        {/* Student Name */}
                                        <td className="px-5 py-4 font-normal text-zinc-900 whitespace-nowrap">
                                            {student.name}
                                        </td>

                                        {/* Risk Score */}
                                        <td className="px-5 py-4 font-normal text-zinc-800 text-center whitespace-nowrap">
                                            {Math.round(student.riskScore)}
                                        </td>

                                        {/* Risk Level Badge */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskBadge.className}`}>
                                                {riskBadge.label}
                                            </span>
                                        </td>

                                        {/* Last Login Relative Date */}
                                        <td className="px-5 py-4 text-zinc-600 whitespace-nowrap">
                                            {formatRelativeDate(student.lastLogin)}
                                        </td>

                                        {/* Nudge Status Badge */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${nudgeBadge.className}`}>
                                                {nudgeBadge.label}
                                            </span>
                                        </td>

                                        {/* Action Button */}
                                        <td className="px-5 py-4 text-right sm:text-left whitespace-nowrap">
                                            <Link
                                                href={`/dashboard/instructor/students/${student.id}`}
                                                className="text-sm font-normal text-zinc-700 hover:text-zinc-900 hover:underline transition-colors"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
