"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

export type StudentItem = {
    id: string;
    name: string;
    email: string;
    riskScore: number;
    riskLevel: "HIGH" | "MEDIUM" | "LOW";
    lastLogin: Date | string | null;
    nudgeStatus: "NOT_REQUIRED" | "PENDING" | "SENT" | string;
    course?: string;
};

interface StudentsClientTableProps {
    students: StudentItem[];
}

function formatRelativeDate(date: Date | string | null | undefined): string {
    if (!date) return "Never";
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays === 0) {
        if (diffHours < 1) return "Just now";
        return "Today";
    }
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
}

function formatNudgeStatus(status: string | undefined): string {
    switch (status) {
        case "SENT":
            return "Nudged";
        case "PENDING":
            return "Not Nudged";
        case "NOT_REQUIRED":
        default:
            return "Not Nudged";
    }
}

function formatRiskLevel(level: string | undefined): string {
    switch (level) {
        case "HIGH":
            return "High";
        case "MEDIUM":
            return "Medium";
        case "LOW":
        default:
            return "Low";
    }
}

export default function StudentsClientTable({ students }: StudentsClientTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("risk-desc");
    const [riskFilter, setRiskFilter] = useState("ALL");
    const [nudgeFilter, setNudgeFilter] = useState("ALL");
    const [courseFilter, setCourseFilter] = useState("ALL");

    const filteredAndSortedStudents = useMemo(() => {
        let list = [...students];

        // 1. Search Query Filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(
                (s) =>
                    s.name.toLowerCase().includes(query) ||
                    s.email.toLowerCase().includes(query),
            );
        }

        // 2. Risk Level Filter
        if (riskFilter !== "ALL") {
            list = list.filter((s) => s.riskLevel === riskFilter);
        }

        // 3. Nudge Status Filter
        if (nudgeFilter !== "ALL") {
            if (nudgeFilter === "NUDGED") {
                list = list.filter((s) => s.nudgeStatus === "SENT");
            } else if (nudgeFilter === "NOT_NUDGED") {
                list = list.filter(
                    (s) => s.nudgeStatus !== "SENT",
                );
            }
        }

        // 4. Sort
        list.sort((a, b) => {
            if (sortBy === "risk-desc") {
                return b.riskScore - a.riskScore;
            }
            if (sortBy === "risk-asc") {
                return a.riskScore - b.riskScore;
            }
            if (sortBy === "name-asc") {
                return a.name.localeCompare(b.name);
            }
            if (sortBy === "name-desc") {
                return b.name.localeCompare(a.name);
            }
            if (sortBy === "login-recent") {
                const timeA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
                const timeB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
                return timeB - timeA;
            }
            return 0;
        });

        return list;
    }, [students, searchQuery, sortBy, riskFilter, nudgeFilter, courseFilter]);

    return (
        <div className="space-y-6">
            {/* Header Title & Subtitle */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Students
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 mt-1">
                    Monitor student engagement and risk levels
                </p>
            </div>

            {/* Filter and Sort Toolbar */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search students..."
                            className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-300 rounded-md shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800 placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Sort By Dropdown */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-sm font-semibold text-zinc-800 whitespace-nowrap">
                            Sort By:
                        </span>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-zinc-300 rounded-md px-3.5 py-2 pr-8 text-sm text-zinc-700 font-normal shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-800 cursor-pointer"
                            >
                                <option value="risk-desc">Risk Score: High to Low</option>
                                <option value="risk-asc">Risk Score: Low to High</option>
                                <option value="name-asc">Student Name: A to Z</option>
                                <option value="name-desc">Student Name: Z to A</option>
                                <option value="login-recent">Last Login: Most Recent</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-600">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter By Section */}
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-800">
                        Filter By:
                    </span>

                    {/* Risk Level Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                            className="appearance-none bg-white border border-zinc-300 rounded-md px-3.5 py-1.5 pr-8 text-sm text-zinc-700 font-normal shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-800 cursor-pointer"
                        >
                            <option value="ALL">Risk Level</option>
                            <option value="HIGH">High Risk</option>
                            <option value="MEDIUM">Medium Risk</option>
                            <option value="LOW">Low Risk</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-600">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>

                    {/* Nudge Status Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={nudgeFilter}
                            onChange={(e) => setNudgeFilter(e.target.value)}
                            className="appearance-none bg-white border border-zinc-300 rounded-md px-3.5 py-1.5 pr-8 text-sm text-zinc-700 font-normal shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-800 cursor-pointer"
                        >
                            <option value="ALL">Nudge Status</option>
                            <option value="NUDGED">Nudged</option>
                            <option value="NOT_NUDGED">Not Nudged</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-600">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>

                    {/* Course Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="appearance-none bg-white border border-zinc-300 rounded-md px-3.5 py-1.5 pr-8 text-sm text-zinc-700 font-normal shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-800 cursor-pointer"
                        >
                            <option value="ALL">Course</option>
                            <option value="ALL">All Courses</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-600">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="rounded-lg border border-zinc-200 overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f3f4f6] text-xs font-semibold text-zinc-800 border-b border-zinc-200">
                                <th className="px-5 py-3.5">Student Name</th>
                                <th className="px-5 py-3.5">Risk Score</th>
                                <th className="px-5 py-3.5">Risk Level</th>
                                <th className="px-5 py-3.5">Last Login</th>
                                <th className="px-5 py-3.5">Nudge Status</th>
                                <th className="px-5 py-3.5 text-right sm:text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-sm">
                            {filteredAndSortedStudents.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-10 text-center text-zinc-500"
                                    >
                                        No students found matching the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedStudents.map((student) => {
                                    const nudgeLabel = formatNudgeStatus(student.nudgeStatus);
                                    const riskLevelLabel = formatRiskLevel(student.riskLevel);

                                    return (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-zinc-50/80 transition-colors"
                                        >
                                            {/* Student Name */}
                                            <td className="px-5 py-4 font-normal text-zinc-900 whitespace-nowrap">
                                                {student.name}
                                            </td>

                                            {/* Risk Score as plain number */}
                                            <td className="px-5 py-4 font-normal text-zinc-800 whitespace-nowrap">
                                                {Math.round(student.riskScore)}
                                            </td>

                                            {/* Risk Level */}
                                            <td className="px-5 py-4 font-normal text-zinc-700 whitespace-nowrap">
                                                {riskLevelLabel}
                                            </td>

                                            {/* Last Login Relative Date */}
                                            <td className="px-5 py-4 text-zinc-600 whitespace-nowrap">
                                                {formatRelativeDate(student.lastLogin)}
                                            </td>

                                            {/* Nudge Status */}
                                            <td className="px-5 py-4 text-zinc-700 whitespace-nowrap">
                                                {nudgeLabel}
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
        </div>
    );
}
