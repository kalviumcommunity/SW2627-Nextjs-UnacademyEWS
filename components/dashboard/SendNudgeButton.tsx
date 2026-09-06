import Link from "next/link";

export default function SendNudgeButton({
    studentName: _studentName,
}: {
    studentName?: string;
} = {}) {
    return (
        <Link
            href="/dashboard/instructor/nudges"
            className="inline-block bg-[#1e2329] hover:bg-[#111418] active:scale-[0.99] text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer text-center"
        >
            Send Nudge
        </Link>
    );
}
