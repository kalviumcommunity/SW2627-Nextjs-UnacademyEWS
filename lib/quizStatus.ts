export type QuizStatus = "Completed" | "Pending" | "Not Completed" | "Not Attempted";

export interface QuizAttemptLike {
    completed?: boolean;
    score?: number;
    totalScore?: number;
    submittedAt?: Date | string | null;
}

/**
 * Checks if a quiz attempt is passing (score >= 60% of total score, e.g. >= 3 out of 5).
 */
export function isQuizPassed(attempt?: QuizAttemptLike | null): boolean {
    if (!attempt) return false;
    const total = attempt.totalScore && attempt.totalScore > 0 ? attempt.totalScore : 1;
    const score = attempt.score ?? 0;
    return score / total >= 0.6;
}

/**
 * Universal quiz status determination rule:
 * 1. "Completed": Student attempted and passed with score >= 60% (>= 3/5 marks)
 * 2. If due date has NOT passed yet (now < dueDate):
 *    - "Pending": Student has not attempted yet OR attempted but did not pass (< 3 marks)
 * 3. If due date HAS passed (now >= dueDate):
 *    - "Not Completed": Student attempted the quiz, but did not pass (scored < 3 marks)
 *    - "Not Attempted": Student never attempted the quiz at all
 */
export function getQuizStatus(
    dueDate: Date | string,
    attempt?: QuizAttemptLike | null,
    now: Date = new Date()
): QuizStatus {
    if (isQuizPassed(attempt)) {
        return "Completed";
    }

    const isExpired = new Date(dueDate).getTime() <= now.getTime();

    // Within due date: student has not attempted or attempted but did not pass -> Pending
    if (!isExpired) {
        return "Pending";
    }

    // Deadline has passed:
    // If student attempted (attempt exists and was submitted) but didn't pass -> Not Completed
    const hasAttempted = Boolean(
        attempt &&
            (attempt.completed ||
                attempt.submittedAt ||
                (attempt.score !== undefined && attempt.score !== null)),
    );

    if (hasAttempted) {
        return "Not Completed";
    }

    // Deadline passed and student never even attempted -> Not Attempted
    return "Not Attempted";
}
