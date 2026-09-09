"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { QuizStatus } from "@/lib/quizStatus";

export interface StudentQuizItem {
    id: string;
    quizTitle: string;
    courseName: string;
    dueDate: string;
    formattedDueDate: string;
    status: QuizStatus;
}

interface StudentQuizzesTableProps {
    quizzes: StudentQuizItem[];
}

type TabType = "All" | QuizStatus;

const STATUS_CONFIG: Record<QuizStatus, { label: string; className: string }> = {
    Completed: {
        label: "Completed",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    Pending: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    "Not Completed": {
        label: "Not Completed",
        className: "bg-orange-50 text-orange-700 border border-orange-200",
    },
    "Not Attempted": {
        label: "Not Attempted",
        className: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    },
};

const TABS: TabType[] = [
    "All",
    "Pending",
    "Completed",
    "Not Completed",
    "Not Attempted",
];

export default function StudentQuizzesTable({ quizzes }: StudentQuizzesTableProps) {
    const [activeTab, setActiveTab] = useState<TabType>("All");

    const filteredQuizzes = useMemo(() => {
        if (activeTab === "All") return quizzes;
        return quizzes.filter((q) => q.status === activeTab);
    }, [quizzes, activeTab]);

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                                isActive
                                    ? "bg-white text-zinc-900 border border-zinc-400 shadow-2xs font-semibold"
                                    : "bg-white text-zinc-600 border border-zinc-200 hover:text-zinc-900 hover:bg-zinc-50 font-normal"
                            }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Quizzes Table Container */}
            <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f9fafb] text-xs sm:text-sm font-semibold text-zinc-900 border-b border-zinc-200">
                                <th scope="col" className="px-6 py-3.5">
                                    Quiz Title
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Course
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Due Date
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3.5">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-sm">
                            {filteredQuizzes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-zinc-500 text-sm"
                                    >
                                        No {activeTab !== "All" ? activeTab.toLowerCase() : ""} quizzes found.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuizzes.map((quiz) => {
                                    const badge =
                                        STATUS_CONFIG[quiz.status] ||
                                        STATUS_CONFIG["Not Attempted"];

                                    return (
                                        <tr
                                            key={quiz.id}
                                            className="hover:bg-zinc-50/60 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-normal text-zinc-900 whitespace-nowrap">
                                                {quiz.quizTitle}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                                                {quiz.courseName}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                                                {quiz.formattedDueDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {quiz.status === "Pending" && (
                                                    <Link
                                                        href={`/dashboard/student/quizzes/${quiz.id}`}
                                                        className="inline-flex items-center justify-center bg-[#18181b] hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-md shadow-xs transition-colors"
                                                    >
                                                        Start Quiz
                                                    </Link>
                                                )}

                                                {quiz.status === "Completed" && (
                                                    <Link
                                                        href={`/dashboard/student/quizzes/${quiz.id}`}
                                                        className="inline-flex items-center justify-center bg-white hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-md shadow-2xs transition-colors"
                                                    >
                                                        Review
                                                    </Link>
                                                )}

                                                {(quiz.status === "Not Completed" ||
                                                    quiz.status === "Not Attempted") && (
                                                    <span className="text-zinc-500 text-base font-normal select-none">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
