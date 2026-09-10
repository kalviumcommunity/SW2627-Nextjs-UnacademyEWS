import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getQuizQuestions } from "@/lib/quizQuestions";
import StudentQuizTaker from "@/components/student/StudentQuizTaker";

interface StudentQuizTakingPageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ mode?: string }>;
}

export default async function StudentQuizTakingPage({
    params,
    searchParams,
}: StudentQuizTakingPageProps) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT") {
        redirect("/dashboard/instructor");
    }

    const { id: quizId } = await params;
    const { mode } = (await searchParams) || {};

    // Fetch quiz with its course
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            course: true,
        },
    });

    if (!quiz) {
        notFound();
    }

    // Fetch student profile and enrollments
    const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        include: {
            enrollments: true,
        },
    });

    if (!student) {
        redirect("/login");
    }

    // Enrollment Security: Ensure student is enrolled in the quiz's course
    const isEnrolled = student.enrollments.some(
        (enrollment) => enrollment.courseId === quiz.courseId,
    );

    if (!isEnrolled) {
        redirect("/dashboard/student/quizzes?error=not_enrolled");
    }

    // Fetch any previous attempt by this student
    const previousAttempt = await prisma.quizAttempt.findFirst({
        where: {
            studentId: student.id,
            quizId: quiz.id,
        },
        orderBy: { submittedAt: "desc" },
    });

    const canRetake =
        !previousAttempt ||
        (previousAttempt.totalScore > 0
            ? previousAttempt.score / previousAttempt.totalScore < 0.8
            : previousAttempt.score < 4);

    // If student scored 4 or 5 marks, retakes are disallowed; direct to review mode
    if (previousAttempt && !canRetake && mode !== "review") {
        redirect(`/dashboard/student/quizzes/${quiz.id}?mode=review`);
    }

    // Retrieve questions tailored to quiz topic and count
    const questions = getQuizQuestions(
        quiz.quizTitle,
        quiz.course.courseName,
        quiz.questionsCount || 5,
    );

    return (
        <StudentQuizTaker
            quiz={{
                id: quiz.id,
                quizTitle: quiz.quizTitle,
                courseName: quiz.course.courseName,
                dueDate: quiz.dueDate.toISOString(),
                questionsCount: quiz.questionsCount,
            }}
            studentId={student.id}
            questions={questions}
            initialMode={mode === "review" && previousAttempt ? "review" : "take"}
            previousAttempt={
                previousAttempt
                    ? {
                          score: previousAttempt.score,
                          totalScore: previousAttempt.totalScore,
                          completed: previousAttempt.completed,
                          submittedAt: previousAttempt.submittedAt,
                          responses: previousAttempt.responses,
                      }
                    : null
            }
        />
    );
}
