import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { PrismaClient } from "../app/generated/prisma/client";
import { Role, RiskLevel, NudgeStatus } from "../app/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 10,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Set reproducible seed for faker if needed, or leave dynamic
faker.seed(12345);

async function main() {
  console.log("⚡ Starting faker.js dynamic bulk seeding for 8 instructors, 20 technical courses, and 200 students...");
  const startTime = Date.now();

  // 1. Clean existing records in reverse dependency order
  await prisma.quizAttempt.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.nudge.deleteMany();
  await prisma.loginActivity.deleteMany();
  await prisma.studentRisk.deleteMany();
  await prisma.student.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.user.deleteMany();
  console.log("🧹 Cleaned existing database records.");

  // Pre-compute single password hash
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 2. Prepare 8 Instructors dynamically using faker.js
  const TOTAL_INSTRUCTORS = 8;
  const instructorsToInsert: Array<{ id: string; userId: string }> = [];
  const instructorUsers: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }> = [];

  for (let i = 1; i <= TOTAL_INSTRUCTORS; i++) {
    const userId = crypto.randomUUID();
    const instructorId = crypto.randomUUID();
    const name = `Prof. ${faker.person.firstName()} ${faker.person.lastName()}`;
    const email = faker.internet.email({
      firstName: name.replace("Prof. ", "").split(" ")[0],
      lastName: name.split(" ")[1] || "instructor",
      provider: "unacademy.com",
    }).toLowerCase();

    instructorUsers.push({
      id: userId,
      name,
      email,
      passwordHash: defaultPasswordHash,
      role: Role.INSTRUCTOR,
    });

    instructorsToInsert.push({
      id: instructorId,
      userId,
    });
  }

  // 3. Prepare 20 Technical Courses dynamically using faker.js
  const TOTAL_COURSES = 20;
  const technicalTopics = [
    "Full-Stack Web Development",
    "Data Structures & Algorithms",
    "System Design & Architecture",
    "Machine Learning & AI Engineering",
    "Cloud Computing with AWS & DevOps",
    "Cybersecurity & Network Defense",
    "Database Systems & Query Tuning",
    "Mobile App Development with React Native",
    "Backend Engineering with Microservices",
    "Data Science & Predictive Analytics",
    "Kubernetes & Container Orchestration",
    "Modern Frontend Engineering with TypeScript",
    "Blockchain & Smart Contract Architecture",
    "Operating Systems & Low-Level C++",
    "GraphQL & High-Performance REST APIs",
    "Compilers & Language Design",
    "Computer Networks & Protocols",
    "Agile Software Engineering & CI/CD",
    "Deep Learning & Neural Networks",
    "Site Reliability Engineering (SRE)",
  ];

  const courseData = Array.from({ length: TOTAL_COURSES }, (_, idx) => {
    const assignedInstructorIndex = idx % TOTAL_INSTRUCTORS;
    const topic = technicalTopics[idx % technicalTopics.length];
    const modifier = faker.helpers.arrayElement(["Advanced", "Applied", "Core", "Modern", "Mastering", "Fundamentals of"]);
    const courseName = `${modifier} ${topic}`;

    return {
      id: crypto.randomUUID(),
      courseName,
      instructorId: instructorsToInsert[assignedInstructorIndex].id,
    };
  });

  // Helper date utility
  const now = new Date();
  const daysAgo = (days: number, hours = 0) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000);

  // 4. Prepare Quizzes per course (2 quizzes per course => 40 total)
  const quizzesToInsert: Array<{
    id: string;
    courseId: string;
    quizTitle: string;
    dueDate: Date;
    questionsCount: number;
  }> = [];

  for (const course of courseData) {
    const courseShort = course.courseName.split(" ")[1] || "Technical";
    quizzesToInsert.push({
      id: crypto.randomUUID(),
      courseId: course.id,
      quizTitle: `${courseShort} Mid-Term Assessment`,
      dueDate: daysAgo(5),
      questionsCount: 5,
    });

    quizzesToInsert.push({
      id: crypto.randomUUID(),
      courseId: course.id,
      quizTitle: `${courseShort} Practical Milestone Evaluation`,
      dueDate: daysAgo(-7),
      questionsCount: 5,
    });
  }

  // 5. Prepare 200 Students dynamically using faker.js
  const TOTAL_STUDENTS = 200;
  const usedEmails = new Set<string>();

  const usersToInsert: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }> = [...instructorUsers];

  const studentsToInsert: Array<{ id: string; userId: string; status: string }> = [];
  const risksToInsert: Array<{ riskId: string; studentId: string; riskScore: number; riskLevel: RiskLevel; explanation: string; calculatedAt: Date }> = [];
  const loginsToInsert: Array<{ loginId: string; studentId: string; loginTime: Date }> = [];
  const nudgesToInsert: Array<{ nudgeId: string; studentId: string; instructorId: string; status: NudgeStatus; message: string; sentAt: Date | null }> = [];
  const enrollmentsToInsert: Array<{ id: string; studentId: string; courseId: string; enrollmentDate: Date }> = [];
  const attemptsToInsert: Array<{
    id: string;
    studentId: string;
    quizId: string;
    completed: boolean;
    score: number;
    totalScore: number;
    responses: string;
    submittedAt: Date;
  }> = [];

  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    let email = faker.internet.email({ firstName, lastName, provider: "unacademy.com" }).toLowerCase();
    let dupCounter = 1;
    while (usedEmails.has(email)) {
      email = faker.internet.email({ firstName: `${firstName}${dupCounter}`, lastName, provider: "unacademy.com" }).toLowerCase();
      dupCounter++;
    }
    usedEmails.add(email);

    const studentUserId = crypto.randomUUID();
    const studentId = crypto.randomUUID();

    usersToInsert.push({
      id: studentUserId,
      name,
      email,
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
    });

    studentsToInsert.push({
      id: studentId,
      userId: studentUserId,
      status: "ACTIVE",
    });

    // Assign courses evenly
    const primaryCourseIndex = i % TOTAL_COURSES;
    const secondaryCourseIndex = (i + 7) % TOTAL_COURSES;
    const chosenCourseIndices = new Set<number>([primaryCourseIndex, secondaryCourseIndex]);

    let riskScore = 0;
    let riskLevel: RiskLevel = RiskLevel.LOW;
    let explanation = "";
    let nudgeStatus: NudgeStatus = NudgeStatus.NOT_REQUIRED;
    let nudgeMessage = "";
    let sentAt: Date | null = null;
    let loginDays: number[] = [];

    if (i < 70) {
      riskLevel = RiskLevel.LOW;
      riskScore = 0;
      explanation = "High platform interaction, regular attendance, and >85% quiz completion rate.";
      nudgeStatus = NudgeStatus.NOT_REQUIRED;
      nudgeMessage = "Outstanding consistency in your coursework! Keep up the momentum.";
      sentAt = null;
      loginDays = [i % 4, (i % 4) + 2, (i % 4) + 5];
    } else if (i < 140) {
      riskLevel = RiskLevel.MEDIUM;
      const lastLoginDay = 5 + (i % 5);
      const loginPenalty = 20 + (lastLoginDay - 5) * 3;
      const quizPenalty = 25; // moderate quiz penalty for <50% scores
      riskScore = Math.min(69, Math.max(30, loginPenalty + quizPenalty));
      explanation = "Login gaps extending beyond 4-6 days. Quiz performance dropped below target threshold.";
      nudgeStatus = i % 2 === 0 ? NudgeStatus.PENDING : NudgeStatus.SENT;
      nudgeMessage = `Hi ${firstName}, we noticed a dip in your practice submissions. Let us know if you need mentor assistance.`;
      sentAt = nudgeStatus === NudgeStatus.SENT ? daysAgo(2) : null;
      loginDays = [lastLoginDay, 12, 18];
    } else {
      riskLevel = RiskLevel.HIGH;
      const loginPenalty = 50; // >14 days inactive
      const quizPenalty = 35; // missed milestones & low scores
      riskScore = Math.min(98, Math.max(70, loginPenalty + quizPenalty));
      explanation = "Critical disengagement alert. Extended period of inactivity with multiple missed milestones.";
      nudgeStatus = i % 2 === 0 ? NudgeStatus.PENDING : NudgeStatus.SENT;
      nudgeMessage = `Hi ${firstName}, urgent check-in regarding your coursework progress and milestone completion.`;
      sentAt = nudgeStatus === NudgeStatus.SENT ? daysAgo(4) : null;
      loginDays = [14 + (i % 8), 28, 40];
    }

    risksToInsert.push({
      riskId: crypto.randomUUID(),
      studentId,
      riskScore,
      riskLevel,
      explanation,
      calculatedAt: daysAgo(0, Math.floor(Math.random() * 8)),
    });

    for (const day of loginDays) {
      loginsToInsert.push({
        loginId: crypto.randomUUID(),
        studentId,
        loginTime: daysAgo(day, Math.floor(Math.random() * 12)),
      });
    }

    // Add enrollments, quiz attempts, and nudges for each enrolled course
    for (const courseIdx of chosenCourseIndices) {
      const assignedCourse = courseData[courseIdx];

      enrollmentsToInsert.push({
        id: crypto.randomUUID(),
        studentId,
        courseId: assignedCourse.id,
        enrollmentDate: daysAgo(30 + ((i + courseIdx) % 60)),
      });

      if (assignedCourse.instructorId) {
        nudgesToInsert.push({
          nudgeId: crypto.randomUUID(),
          studentId,
          instructorId: assignedCourse.instructorId,
          status: nudgeStatus,
          message: nudgeMessage,
          sentAt,
        });
      }

      // Add quiz attempts for quizzes in this course
      const courseQuizzes = quizzesToInsert.filter((q) => q.courseId === assignedCourse.id);
      for (let qIdx = 0; qIdx < courseQuizzes.length; qIdx++) {
        const quiz = courseQuizzes[qIdx];
        let score = 5;
        if (riskLevel === RiskLevel.LOW) {
          score = (i + qIdx) % 2 === 0 ? 5 : 4;
        } else if (riskLevel === RiskLevel.MEDIUM) {
          const mediumScores = [2, 3, 4, 3];
          score = mediumScores[(i + qIdx) % mediumScores.length];
        } else {
          score = (i + qIdx) % 3 === 0 ? 2 : (i + qIdx) % 3 === 1 ? 1 : 3;
        }

        attemptsToInsert.push({
          id: crypto.randomUUID(),
          studentId,
          quizId: quiz.id,
          completed: score >= 3 || riskLevel !== RiskLevel.HIGH || i % 2 === 0,
          score,
          totalScore: 5,
          responses: JSON.stringify({ q1: "A", q2: "B" }),
          submittedAt: daysAgo(loginDays[0] ?? 0, 1),
        });
      }
    }
  }

  // 6. Execute bulk batch insertions
  console.log("💾 Inserting users in bulk...");
  await prisma.user.createMany({ data: usersToInsert });

  console.log("💾 Inserting instructors, courses, and students in bulk...");
  await prisma.instructor.createMany({ data: instructorsToInsert });
  await prisma.course.createMany({ data: courseData });
  await prisma.student.createMany({ data: studentsToInsert });

  console.log("💾 Inserting quizzes in bulk...");
  await prisma.quiz.createMany({ data: quizzesToInsert });

  console.log("💾 Inserting enrollments in bulk...");
  await prisma.enrollment.createMany({ data: enrollmentsToInsert });

  console.log("💾 Inserting quiz attempts in bulk...");
  await prisma.quizAttempt.createMany({ data: attemptsToInsert });

  console.log("💾 Inserting risk records in bulk...");
  await prisma.studentRisk.createMany({ data: risksToInsert });

  console.log("💾 Inserting login activities in bulk...");
  await prisma.loginActivity.createMany({ data: loginsToInsert });

  console.log("💾 Inserting nudges in bulk...");
  await prisma.nudge.createMany({ data: nudgesToInsert });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⚡ Bulk seeding completed successfully in ${duration}s! (${TOTAL_INSTRUCTORS} Instructors + ${TOTAL_COURSES} Courses + ${quizzesToInsert.length} Quizzes + ${TOTAL_STUDENTS} Students + ${attemptsToInsert.length} Quiz Attempts)`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
