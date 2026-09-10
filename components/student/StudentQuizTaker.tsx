"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { recordQuizAttempt } from "@/app/actions/quiz";
import { QuizQuestion } from "@/lib/quizQuestions";
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, RotateCcw, Check, X } from "lucide-react";

interface StudentQuizTakerProps {
    quiz: {
        id: string;
        quizTitle: string;
        courseName: string;
        dueDate: string;
        questionsCount: number;
    };
    studentId: string;
    questions: QuizQuestion[];
    initialMode?: "take" | "review";
    previousAttempt?: {
        score: number;
        totalScore: number;
        completed: boolean;
        submittedAt?: string | Date;
        responses?: unknown;
    } | null;
}

interface SubmissionResult {
    score: number;
    totalScore: number;
    passed: boolean;
    percentage: number;
}

function extractPreviousAnswers(
    responses: unknown,
    questions: QuizQuestion[],
    score?: number
): Record<number, string> {
    const result: Record<number, string> = {};

    let parsed: unknown = responses;
    if (typeof responses === "string") {
        try {
            parsed = JSON.parse(responses);
        } catch {
            parsed = null;
        }
    }

    if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;
        questions.forEach((q, idx) => {
            const val = record[q.id] ?? record[idx] ?? record[`q${idx + 1}`];
            if (typeof val === "object" && val !== null && "selected" in val) {
                const selectedVal = (val as { selected?: unknown }).selected;
                if (typeof selectedVal === "string") {
                    result[idx] = selectedVal;
                }
            } else if (typeof val === "string") {
                if (q.options.includes(val)) {
                    result[idx] = val;
                } else if (val === "A" || val === "B" || val === "C" || val === "D") {
                    const letterIdx = ["A", "B", "C", "D"].indexOf(val);
                    result[idx] = q.options[letterIdx] || q.options[0];
                } else {
                    result[idx] = val;
                }
            }
        });
    }

    // If no responses were saved or parsed (e.g. initial seed data before quiz taking was built),
    // reconstruct answers matching the actual score recorded:
    if (Object.keys(result).length === 0) {
        const targetCorrect = Math.min(questions.length, Math.max(0, Math.round(score ?? 0)));
        questions.forEach((q, idx) => {
            if (idx < targetCorrect) {
                result[idx] = q.correctAnswer;
            } else {
                const wrongOption = q.options.find((o) => o !== q.correctAnswer) || q.options[0];
                result[idx] = wrongOption;
            }
        });
    }

    return result;
}

export default function StudentQuizTaker({
    quiz,
    studentId,
    questions,
    initialMode = "take",
    previousAttempt,
}: StudentQuizTakerProps) {
    const router = useRouter();
    const canRetake =
        !previousAttempt ||
        (previousAttempt.totalScore > 0
            ? previousAttempt.score / previousAttempt.totalScore < 0.8
            : previousAttempt.score < 4);

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isReviewMode, setIsReviewMode] = useState<boolean>(
        (initialMode === "review" || !canRetake) && Boolean(previousAttempt)
    );
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(() => {
        if ((initialMode === "review" || !canRetake) && previousAttempt) {
            return extractPreviousAnswers(previousAttempt.responses, questions, previousAttempt.score);
        }
        return {};
    });
    const [isSubmitting, startTransition] = useTransition();
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const activeScoreSummary: SubmissionResult | null =
        submissionResult ??
        (previousAttempt
            ? {
                  score: previousAttempt.score,
                  totalScore: previousAttempt.totalScore,
                  passed: previousAttempt.completed,
                  percentage: Math.round((previousAttempt.score / (previousAttempt.totalScore || 1)) * 100),
              }
            : null);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const currentAnswer = selectedAnswers[currentIndex];

    const handleSelectOption = (option: string) => {
        if (isReviewMode) return;
        setSelectedAnswers((prev) => ({
            ...prev,
            [currentIndex]: option,
        }));
        setErrorMessage(null);
    };

    const handleNext = () => {
        if (!isReviewMode && !currentAnswer) {
            setErrorMessage("Please select an answer before proceeding.");
            return;
        }
        setErrorMessage(null);
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        setErrorMessage(null);
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleSubmit = () => {
        if (!currentAnswer && !isReviewMode) {
            setErrorMessage("Please select an answer for this question.");
            return;
        }

        // Check if all questions have been answered
        const answeredCount = Object.keys(selectedAnswers).length;
        if (answeredCount < totalQuestions && !currentAnswer) {
            setErrorMessage(`Please answer all ${totalQuestions} questions before submitting.`);
            return;
        }

        startTransition(async () => {
            setErrorMessage(null);

            // Compute score
            let calculatedScore = 0;
            const detailedResponses: Record<string, { selected: string; correct: string; isCorrect: boolean }> = {};

            questions.forEach((q, idx) => {
                const studentAnswer = selectedAnswers[idx] || "";
                const isCorrect = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                if (isCorrect) {
                    calculatedScore += 1;
                }
                detailedResponses[q.id] = {
                    selected: studentAnswer,
                    correct: q.correctAnswer,
                    isCorrect,
                };
            });

            const totalScore = totalQuestions;
            const percentage = Math.round((calculatedScore / totalScore) * 100);
            const passed = calculatedScore / totalScore >= 0.6;

            const res = await recordQuizAttempt({
                studentId,
                quizId: quiz.id,
                completed: passed,
                score: calculatedScore,
                totalScore,
                responses: detailedResponses,
            });

            if (res.success) {
                setSubmissionResult({
                    score: calculatedScore,
                    totalScore,
                    passed,
                    percentage,
                });
                setIsResultModalOpen(true);
                router.refresh();
            } else {
                setErrorMessage(res.error || "Failed to record your quiz attempt. Please try again.");
            }
        });
    };

    const handleRetake = () => {
        if (!canRetake) return;
        setSelectedAnswers({});
        setCurrentIndex(0);
        setIsReviewMode(false);
        setIsResultModalOpen(false);
        setSubmissionResult(null);
        setErrorMessage(null);
    };

    return (
        <div className="p-8 sm:p-10 max-w-4xl mx-auto space-y-6">
            {/* Review Mode Banner */}
            {isReviewMode && previousAttempt && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-zinc-200 text-zinc-800">
                                Review Mode
                            </span>
                            <span className="text-sm font-semibold text-zinc-900">
                                Previous Attempt: {previousAttempt.score} / {previousAttempt.totalScore} ({previousAttempt.completed ? "Passed" : "Pending"})
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Correct answers are highlighted in <span className="text-emerald-700 font-semibold">green</span>; your incorrect choices in <span className="text-red-700 font-semibold">red</span>.
                            {!canRetake && (
                                <span className="block mt-0.5 text-zinc-600 font-medium">
                                    Scores of 4 or 5 marks are fully mastered and cannot be retaken.
                                </span>
                            )}
                        </p>
                    </div>
                    {canRetake ? (
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retake Quiz
                        </button>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Mastered ({previousAttempt.score}/{previousAttempt.totalScore})</span>
                        </div>
                    )}
                </div>
            )}

            {/* Standard Previous Attempt Notice if not in review mode */}
            {!isReviewMode && previousAttempt && !submissionResult && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-sm">
                    <div>
                        <span className="font-semibold text-zinc-900">Previous Attempt: </span>
                        <span className="text-zinc-600">
                            You scored {previousAttempt.score} / {previousAttempt.totalScore} (
                            {previousAttempt.completed ? "Passed" : "Pending"})
                        </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                        Submitting again will record your latest score.
                    </span>
                </div>
            )}

            {/* Header: Title & Progress */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    {quiz.quizTitle}
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Question {currentIndex + 1} of {totalQuestions}
                </p>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
                <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Interactive Card Container */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xs">
                {/* Question Prompt */}
                <h2 className="text-base sm:text-lg font-semibold text-zinc-900 mb-6">
                    {currentQuestion.question}
                </h2>

                {/* 4 Selectable Option Cards */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = currentAnswer === option;
                        const isCorrectOption = option.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
                        const isStudentWrongChoice = isReviewMode && isSelected && !isCorrectOption;

                        let cardStyle = "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50";
                        if (isReviewMode) {
                            if (isCorrectOption) {
                                cardStyle = "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium";
                            } else if (isStudentWrongChoice) {
                                cardStyle = "border-red-500 bg-red-50/80 text-red-950 font-medium";
                            } else {
                                cardStyle = "border-zinc-200 bg-white opacity-60 text-zinc-600";
                            }
                        } else if (isSelected) {
                            cardStyle = "border-zinc-400 bg-zinc-50/30";
                        }

                        return (
                            <div
                                key={idx}
                                role="radio"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onClick={() => handleSelectOption(option)}
                                onKeyDown={(e) => {
                                    if (e.key === " " || e.key === "Enter") {
                                        e.preventDefault();
                                        handleSelectOption(option);
                                    }
                                }}
                                className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-lg border transition-all select-none ${
                                    isReviewMode ? "cursor-default" : "cursor-pointer"
                                } ${cardStyle}`}
                            >
                                {/* Radio Circle Indicator */}
                                <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                        isReviewMode
                                            ? isCorrectOption
                                                ? "border-emerald-600 bg-emerald-600"
                                                : isStudentWrongChoice
                                                ? "border-red-600 bg-red-600"
                                                : "border-zinc-300"
                                            : isSelected
                                            ? "border-zinc-900"
                                            : "border-zinc-300"
                                    }`}
                                >
                                    {isReviewMode ? (
                                        isCorrectOption ? (
                                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                        ) : isStudentWrongChoice ? (
                                            <X className="w-2.5 h-2.5 text-white stroke-[3]" />
                                        ) : null
                                    ) : isSelected ? (
                                        <span className="w-2 h-2 rounded-full bg-zinc-900" />
                                    ) : null}
                                </div>

                                {/* Option Label */}
                                <span className="text-sm font-normal text-zinc-800 flex-1">
                                    {option}
                                </span>

                                {/* Review Mode Tag */}
                                {isReviewMode && isCorrectOption && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        <Check className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
                                        {isSelected ? "Your Choice (Correct)" : "Correct Answer"}
                                    </span>
                                )}
                                {isReviewMode && isStudentWrongChoice && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-full">
                                        <X className="w-3 h-3 text-red-700 stroke-[2.5]" />
                                        Your Choice (Incorrect)
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Navigation and Action Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
                    <div>
                        {!isFirstQuestion ? (
                            <button
                                type="button"
                                onClick={handlePrevious}
                                className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 text-sm font-medium rounded-md transition-colors shadow-2xs cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </button>
                        ) : (
                            <div />
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {isReviewMode && (
                            <button
                                type="button"
                                onClick={() => setIsResultModalOpen(true)}
                                className="px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
                            >
                                View Score Summary
                            </button>
                        )}

                        {!isLastQuestion ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex items-center gap-1.5 bg-[#18181b] hover:bg-zinc-800 active:bg-zinc-950 text-white text-sm font-medium px-5 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : isReviewMode ? (
                            canRetake ? (
                                <button
                                    type="button"
                                    onClick={handleRetake}
                                    className="inline-flex items-center gap-1.5 bg-[#18181b] hover:bg-zinc-800 text-white text-sm font-medium px-5 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Retake Quiz
                                </button>
                            ) : (
                                <Link
                                    href="/dashboard/student/quizzes"
                                    className="inline-flex items-center gap-1.5 bg-[#18181b] hover:bg-zinc-800 text-white text-sm font-medium px-5 py-2.5 rounded-md shadow-xs transition-colors"
                                >
                                    Return to Quizzes
                                </Link>
                            )
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 bg-[#18181b] hover:bg-zinc-800 active:bg-zinc-950 text-white text-sm font-medium px-6 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Quiz"
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Back to Quizzes Quick Link */}
            <div className="pt-2">
                <Link
                    href="/dashboard/student/quizzes"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Quizzes
                </Link>
            </div>

            {/* Submission Result / Score Summary Modal */}
            {isResultModalOpen && activeScoreSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 space-y-6 relative">
                        {/* Dismiss Button */}
                        <button
                            type="button"
                            onClick={() => setIsResultModalOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-center gap-3">
                            {activeScoreSummary.passed ? (
                                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-6 h-6 text-amber-600" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">
                                    {isReviewMode ? "Score Summary" : "Quiz Submission Completed"}
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    {quiz.quizTitle}
                                </p>
                            </div>
                        </div>

                        {/* Score & Status Card */}
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-600">Final Score</span>
                                <span className="text-base font-bold text-zinc-900">
                                    {activeScoreSummary.score} / {activeScoreSummary.totalScore} ({activeScoreSummary.percentage}%)
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-600">Status</span>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        activeScoreSummary.passed
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                >
                                    {activeScoreSummary.passed ? "Completed (Passed)" : "Pending (Needs Improvement)"}
                                </span>
                            </div>
                        </div>

                        {/* Context Explainer */}
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            {activeScoreSummary.score >= 4
                                ? "Outstanding work! You scored 4 or 5 marks. This quiz is mastered and cannot be retaken."
                                : activeScoreSummary.score === 3
                                ? "You achieved a passing score of 3 marks! You are eligible to retake the quiz if you want to aim for 4 or 5 marks."
                                : "You scored below passing threshold. You can review your answers or retake the quiz to improve your score."}
                        </p>

                        {/* Modal Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                            {isReviewMode ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsResultModalOpen(false)}
                                        className="w-full sm:flex-1 py-2 px-3.5 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                    {canRetake && (
                                        <button
                                            type="button"
                                            onClick={handleRetake}
                                            className="w-full sm:flex-1 py-2 px-3.5 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
                                        >
                                            Retake Quiz
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResultModalOpen(false);
                                        setIsReviewMode(true);
                                        setCurrentIndex(0);
                                    }}
                                    className="w-full sm:flex-1 py-2 px-3.5 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
                                >
                                    Review Answers
                                </button>
                            )}

                            <Link
                                href="/dashboard/student/quizzes"
                                className="w-full sm:flex-1 py-2 px-3.5 bg-[#18181b] hover:bg-zinc-800 text-white text-xs sm:text-sm font-medium rounded-md shadow-xs text-center transition-colors"
                            >
                                Return to Quizzes
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
