import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

export default function StudentNotFound() {
    return (
        <div className="p-8 sm:p-10 max-w-5xl mx-auto space-y-6">
            <Link
                href="/dashboard/instructor/students"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Students
            </Link>

            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 mb-4">
                    <UserX className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 mb-2">Student Not Found</h1>
                <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
                    The requested student could not be found or you do not have permission to view their risk details.
                </p>
                <Link
                    href="/dashboard/instructor/students"
                    className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                    Return to Student List
                </Link>
            </div>
        </div>
    );
}
