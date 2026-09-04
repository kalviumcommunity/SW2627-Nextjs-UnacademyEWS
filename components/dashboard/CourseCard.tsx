import Link from "next/link";

export interface CourseCardProps {
    id: string;
    courseName: string;
    enrolledStudentsCount: number;
    quizzesCount: number;
}

export default function CourseCard({
    id,
    courseName,
    enrolledStudentsCount,
    quizzesCount,
}: CourseCardProps) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-shadow flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 truncate">
                    {courseName}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1.5">
                    {enrolledStudentsCount} {enrolledStudentsCount === 1 ? "student" : "students"} enrolled
                </p>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                    {quizzesCount} {quizzesCount === 1 ? "quiz" : "quizzes"}
                </p>
            </div>
            <Link
                href={`/dashboard/instructor/courses/${id}`}
                className="shrink-0 bg-[#18181b] hover:bg-[#27272a] active:scale-[0.98] text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-md transition-all inline-flex items-center justify-center cursor-pointer shadow-xs"
            >
                View
            </Link>
        </div>
    );
}
