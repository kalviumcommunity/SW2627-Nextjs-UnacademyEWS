"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

export interface StudentTableItem {
    id: string;
    name: string;
    email: string;
    courses: Array<{ id: string; courseName: string }>;
    riskScore: number;
    riskLevel: "HIGH" | "MEDIUM" | "LOW";
    lastLogin: string | null;
    lastLoginTimeMs: number;
    nudgeStatus: "PENDING" | "SENT" | "NOT_REQUIRED";
}

export interface CourseOption {
    id: string;
    courseName: string;
}

const NUDGE_CONFIG: Record<string, { label: string; className: string }> = {
    SENT: { label: "Sent", className: "bg-blue-50 text-blue-700 border border-blue-200" },
    PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    NOT_REQUIRED: { label: "Not Required", className: "bg-zinc-100 text-zinc-600 border border-zinc-200" },
};

const RISK_CONFIG: Record<string, { label: string; className: string }> = {
    HIGH: { label: "High", className: "bg-red-50 text-red-700 border border-red-200" },
    MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    LOW: { label: "Low", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

function formatRelativeDate(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
}

function SelectInput({
    value,
    onChange,
    options,
    testId,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string; label: string }>;
    testId?: string;
}) {
    return (
        <div className="relative inline-block">
            <select
                value={value}
                onChange={onChange}
                data-testid={testId}
                className="appearance-none bg-white border border-zinc-300 rounded-md pl-3 pr-8 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer shadow-xs max-w-xs truncate"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
    );
}

const ITEMS_PER_PAGE = 10;

export default function StudentManagementTable({
    students,
    courses,
}: {
    students: StudentTableItem[];
    courses: CourseOption[];
}) {
    const [search, setSearch] = useState("");
    const [riskFilter, setRiskFilter] = useState("ALL");
    const [nudgeFilter, setNudgeFilter] = useState("ALL");
    const [courseFilter, setCourseFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("RISK_HIGH_TO_LOW");
    const [currentPage, setCurrentPage] = useState(1);

    const handleClear = () => {
        setSearch("");
        setRiskFilter("ALL");
        setNudgeFilter("ALL");
        setCourseFilter("ALL");
        setSortBy("RISK_HIGH_TO_LOW");
        setCurrentPage(1);
    };

    const isFiltered = search.trim() !== "" || riskFilter !== "ALL" || nudgeFilter !== "ALL" || courseFilter !== "ALL";

    // Filtering and sorting
    const filteredStudents = useMemo(() => {
        const query = search.toLowerCase().trim();
        return students
            .filter((s) => {
                if (query && !s.name.toLowerCase().includes(query)) return false;
                if (riskFilter !== "ALL" && s.riskLevel !== riskFilter) return false;
                if (nudgeFilter !== "ALL" && s.nudgeStatus !== nudgeFilter) return false;
                if (courseFilter !== "ALL" && !s.courses.some((c) => c.id === courseFilter)) return false;
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "RISK_HIGH_TO_LOW") return b.riskScore - a.riskScore;
                if (sortBy === "RISK_LOW_TO_HIGH") return a.riskScore - b.riskScore;
                if (sortBy === "LOGIN_MOST_RECENT") return b.lastLoginTimeMs - a.lastLoginTimeMs;
                if (sortBy === "LOGIN_LEAST_RECENT") return a.lastLoginTimeMs - b.lastLoginTimeMs;
                return 0;
            });
    }, [students, search, riskFilter, nudgeFilter, courseFilter, sortBy]);

    // Pagination calculations
    const total = filteredStudents.length;
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Search students..."
                        data-testid="search-students-input"
                        className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-sm font-medium text-zinc-600">Sort By:</span>
                    <SelectInput
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        testId="sort-by-select"
                        options={[
                            { value: "RISK_HIGH_TO_LOW", label: "Risk Score: High to Low" },
                            { value: "RISK_LOW_TO_HIGH", label: "Risk Score: Low to High" },
                            { value: "LOGIN_MOST_RECENT", label: "Last Login: Most Recent" },
                            { value: "LOGIN_LEAST_RECENT", label: "Last Login: Least Recent" },
                        ]}
                    />
                </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <span className="text-sm font-medium text-zinc-700">Filter By:</span>
                <div className="flex flex-wrap items-center gap-2.5">
                    <SelectInput
                        value={riskFilter}
                        onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
                        testId="filter-risk-level"
                        options={[
                            { value: "ALL", label: "Risk Level: All" },
                            { value: "HIGH", label: "High" },
                            { value: "MEDIUM", label: "Medium" },
                            { value: "LOW", label: "Low" },
                        ]}
                    />
                    <SelectInput
                        value={nudgeFilter}
                        onChange={(e) => { setNudgeFilter(e.target.value); setCurrentPage(1); }}
                        testId="filter-nudge-status"
                        options={[
                            { value: "ALL", label: "Nudge Status: All" },
                            { value: "PENDING", label: "Pending" },
                            { value: "SENT", label: "Sent" },
                            { value: "NOT_REQUIRED", label: "Not Required" },
                        ]}
                    />
                    <SelectInput
                        value={courseFilter}
                        onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1); }}
                        testId="filter-course"
                        options={[
                            { value: "ALL", label: "Course: All" },
                            ...courses.map((c) => ({ value: c.id, label: c.courseName })),
                        ]}
                    />
                    {isFiltered && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Students Table */}
            <div className="rounded-lg border border-zinc-200 overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f9fafb] text-xs font-semibold text-zinc-700 border-b border-zinc-200">
                                <th className="px-5 py-3.5">Student Name</th>
                                <th className="px-5 py-3.5">Course Name</th>
                                <th className="px-5 py-3.5 text-center">Risk Score</th>
                                <th className="px-5 py-3.5">Risk Level</th>
                                <th className="px-5 py-3.5">Last Login</th>
                                <th className="px-5 py-3.5">Nudge Status</th>
                                <th className="px-5 py-3.5">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-sm">
                            {total === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-500 space-y-3">
                                        <p className="text-base font-medium text-zinc-700">No students found matching your criteria</p>
                                        <p className="text-xs text-zinc-500">Try modifying your search or clearing your active filters.</p>
                                        <div>
                                            <button
                                                type="button"
                                                onClick={handleClear}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                Clear Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedStudents.map((s) => {
                                    const nudge = NUDGE_CONFIG[s.nudgeStatus] || NUDGE_CONFIG.NOT_REQUIRED;
                                    const risk = RISK_CONFIG[s.riskLevel] || RISK_CONFIG.LOW;
                                    const courseNames = s.courses.map((c) => c.courseName).join(", ") || "Not Enrolled";

                                    return (
                                        <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                                            <td className="px-5 py-4 font-medium text-zinc-900 whitespace-nowrap">{s.name}</td>
                                            <td className="px-5 py-4 text-zinc-600 max-w-xs truncate" title={courseNames}>{courseNames}</td>
                                            <td className="px-5 py-4 font-normal text-zinc-800 text-center whitespace-nowrap">{Math.round(s.riskScore)}</td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.className}`}>
                                                    {risk.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-zinc-600 whitespace-nowrap">{formatRelativeDate(s.lastLogin)}</td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${nudge.className}`}>
                                                    {nudge.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <Link href={`/dashboard/instructor/students/${s.id}`} className="text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:underline transition-colors">
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

                {/* Pagination Controls */}
                {total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-zinc-200 bg-white gap-3">
                        <div className="text-xs sm:text-sm text-zinc-600">
                            Showing <span className="font-medium text-zinc-900">{startIndex + 1}</span> to{" "}
                            <span className="font-medium text-zinc-900">{Math.min(startIndex + ITEMS_PER_PAGE, total)}</span> of{" "}
                            <span className="font-medium text-zinc-900">{total}</span> students
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>

                            <div className="flex items-center gap-1 px-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`min-w-[32px] h-8 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                            pageNum === page ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
