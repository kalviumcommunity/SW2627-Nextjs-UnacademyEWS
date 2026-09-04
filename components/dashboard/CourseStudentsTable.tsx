"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface CourseStudentItem {
    id: string;
    name: string;
    email: string;
    riskScore: number;
    riskLevel: "HIGH" | "MEDIUM" | "LOW";
    enrollmentDate: string;
}

const RISK_CONFIG: Record<string, { label: string; className: string }> = {
    HIGH: { label: "High", className: "bg-red-50 text-red-700 border border-red-200" },
    MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    LOW: { label: "Low", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

const ITEMS_PER_PAGE = 10;

export default function CourseStudentsTable({
    students,
}: {
    students: CourseStudentItem[];
}) {
    const [search, setSearch] = useState("");
    const [riskFilter, setRiskFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const query = search.toLowerCase().trim();
            const matchesSearch =
                query === "" ||
                student.name.toLowerCase().includes(query) ||
                student.email.toLowerCase().includes(query);

            const matchesRisk = riskFilter === "ALL" || student.riskLevel === riskFilter;

            return matchesSearch && matchesRisk;
        });
    }, [students, search, riskFilter]);

    const total = filteredStudents.length;
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const handleRiskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRiskFilter(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search student by name or email..."
                        value={search}
                        onChange={handleSearchChange}
                        className="w-full bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-200 rounded-lg pl-9 pr-3.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                </div>

                <div className="relative inline-block shrink-0">
                    <select
                        value={riskFilter}
                        onChange={handleRiskChange}
                        className="appearance-none bg-white border border-zinc-300 rounded-md pl-3 pr-8 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer shadow-xs"
                    >
                        <option value="ALL">All Risk Levels</option>
                        <option value="HIGH">High Risk</option>
                        <option value="MEDIUM">Medium Risk</option>
                        <option value="LOW">Low Risk</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-600">
                        <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold text-zinc-700 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3.5">Student</th>
                                <th scope="col" className="px-6 py-3.5">Risk Level</th>
                                <th scope="col" className="px-6 py-3.5">Enrollment Date</th>
                                <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-sm">
                            {paginatedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                        No students found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedStudents.map((student) => {
                                    const riskBadge = RISK_CONFIG[student.riskLevel] || RISK_CONFIG.LOW;

                                    return (
                                        <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-900">
                                                    {student.name}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    {student.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskBadge.className}`}>
                                                    {riskBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                                                {new Date(student.enrollmentDate).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <Link
                                                    href={`/dashboard/instructor/students/${student.id}`}
                                                    className="text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:underline transition-colors"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls matching StudentManagementTable */}
                {total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-zinc-200 bg-white">
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                                        className={`min-w-[32px] h-8 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
