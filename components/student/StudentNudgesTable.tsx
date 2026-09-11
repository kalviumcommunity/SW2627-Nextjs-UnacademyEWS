"use client";

import React, { useState, useMemo } from "react";
import { Search, RotateCcw, ChevronLeft, ChevronRight, MessageSquare, X, Calendar, User, Mail } from "lucide-react";

export interface StudentNudgeItem {
  nudgeId: string;
  instructorName: string;
  instructorEmail?: string;
  message: string;
  sentAt: string | null;
  sentAtMs: number;
}

interface StudentNudgesTableProps {
  nudges: StudentNudgeItem[];
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

const ITEMS_PER_PAGE = 10;

export default function StudentNudgesTable({ nudges }: StudentNudgesTableProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNudge, setSelectedNudge] = useState<StudentNudgeItem | null>(null);

  const handleClear = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const isFiltered = search.trim() !== "";

  // Filter by instructor name or message content and sort by sent date (descending)
  const filteredNudges = useMemo(() => {
    const query = search.toLowerCase().trim();
    return nudges
      .filter((n) => {
        if (!query) return true;
        const matchesInstructor = n.instructorName.toLowerCase().includes(query);
        const matchesMessage = n.message.toLowerCase().includes(query);
        return matchesInstructor || matchesMessage;
      })
      .sort((a, b) => b.sentAtMs - a.sentAtMs);
  }, [nudges, search]);

  // Pagination calculations
  const total = filteredNudges.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedNudges = filteredNudges.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Search Bar - only show if there are nudges or search is active */}
      {(nudges.length > 0 || isFiltered) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by instructor or message..."
              data-testid="search-nudges-input"
              className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
            />
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Student Nudges Table Container */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-xs sm:text-sm font-semibold text-zinc-900 border-b border-zinc-200">
                <th scope="col" className="px-6 py-3.5">
                  Instructor
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Nudge Message
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Sent Date
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {total === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 space-y-3">
                    <div className="flex justify-center">
                      <MessageSquare className="w-10 h-10 text-zinc-300" />
                    </div>
                    <p className="text-base font-semibold text-zinc-700">
                      {isFiltered ? "No nudges match your search" : "No nudges received yet"}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
                      {isFiltered
                        ? "Try adjusting your search terms or clearing the filter."
                        : "When your instructors send you guidance or feedback, it will appear here."}
                    </p>
                    {isFiltered && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleClear}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Clear Search
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedNudges.map((nudge) => {
                  const isLongMessage = nudge.message.length > 80;
                  const previewText = isLongMessage
                    ? nudge.message.slice(0, 80) + "..."
                    : nudge.message;

                  return (
                    <tr key={nudge.nudgeId} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Instructor Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">{nudge.instructorName}</div>
                        {nudge.instructorEmail && (
                          <div className="text-xs text-zinc-500">{nudge.instructorEmail}</div>
                        )}
                      </td>

                      {/* Message Content */}
                      <td className="px-6 py-4 text-zinc-800 max-w-md">
                        <p className="line-clamp-2 text-sm">{previewText}</p>
                      </td>

                      {/* Sent Date & Time */}
                      <td className="px-6 py-4 text-zinc-600 text-xs sm:text-sm whitespace-nowrap">
                        {formatDateTime(nudge.sentAt)}
                      </td>

                      {/* View Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedNudge(nudge)}
                          className="inline-flex items-center justify-center bg-white hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer"
                        >
                          View Full
                        </button>
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
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-zinc-200 bg-white gap-3">
            <div className="text-xs sm:text-sm text-zinc-600">
              Showing <span className="font-medium text-zinc-900">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-zinc-900">{Math.min(startIndex + ITEMS_PER_PAGE, total)}</span> of{" "}
              <span className="font-medium text-zinc-900">{total}</span> nudges
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

      {/* Expanded Nudge Modal */}
      {selectedNudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedNudge(null)} />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-zinc-700" />
                Instructor Nudge
              </h3>
              <button
                type="button"
                onClick={() => setSelectedNudge(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-zinc-700">
                <User className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Instructor: <strong className="text-zinc-900">{selectedNudge.instructorName}</strong></span>
              </div>

              {selectedNudge.instructorEmail && (
                <div className="flex items-center gap-2 text-zinc-700">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Email: <strong className="text-zinc-900">{selectedNudge.instructorEmail}</strong></span>
                </div>
              )}

              <div className="flex items-center gap-2 text-zinc-700">
                <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Sent Date: <strong className="text-zinc-900">{formatDateTime(selectedNudge.sentAt)}</strong></span>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
                  Message Content
                </label>
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 leading-relaxed whitespace-pre-wrap">
                  {selectedNudge.message}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedNudge(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
