import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
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

async function main() {
  console.log("⚡ Starting ultra-fast bulk seeding for 50 students...");
  const startTime = Date.now();

  // 1. Clean existing records
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

  // 2. Prepare Instructor
  const instructorUserId = crypto.randomUUID();
  const instructorId = crypto.randomUUID();

  const instructorUser = {
    id: instructorUserId,
    name: "Dr. Rajesh Sharma",
    email: "rajesh.sharma@unacademy.com",
    passwordHash: defaultPasswordHash,
    role: Role.INSTRUCTOR,
  };

  // 3. Prepare Courses taught by Instructor
  const courseData = [
    { id: crypto.randomUUID(), courseName: "Full Stack Web Development", instructorId },
    { id: crypto.randomUUID(), courseName: "Data Structures & Algorithms", instructorId },
    { id: crypto.randomUUID(), courseName: "System Design & Architecture", instructorId },
  ];

  // Helper date utility
  const now = new Date();
  const daysAgo = (days: number, hours = 0) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000);

  // 4. Raw dataset for 50 students
  const studentNames = [
    "Aarav Patel", "Priya Sharma", "Rohan Gupta", "Sneha Reddy", "Karan Johar",
    "Diya Sengupta", "Arjun Rampal", "Ishita Bose", "Nikhil Chawla", "Kavya Menon",
    "Siddharth Rao", "Anika Roy", "Manish Pandey", "Pooja Hegde", "Varun Dhawan",
    "Shruti Haasan", "Gaurav Kapoor", "Bhavna Mishra", "Vikram Malhotra", "Ananya Iyer",
    "Kabir Mehta", "Tanvi Deshmukh", "Harsh Vardhan", "Rhea Chakraborty", "Devendra Joshi",
    "Neelam Kothari", "Pranav Mukhopadhyay", "Simran Kaur", "Tarun Bajaj", "Zoya Akhtar",
    "Yashvardhan Singhania", "Pallavi Shinde", "Omkar Salunkhe", "Gayatri Pillai", "Deepak Trivedi",
    "Aditya Verma", "Meera Nair", "Rishi Chatterjee", "Kunal Kapoor", "Natasha Roy",
    "Saurabh Shukla", "Esha Deol", "Alok Nath", "Bipasha Basu", "Farhan Akhtar",
    "Juhi Chawla", "Ishaan Kapoor", "Madhavan Balaji", "Preity Zinta", "Abhay Deol"
  ];

  // 5. Prepare bulk arrays for batch insert
  const usersToInsert: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }> = [instructorUser];
  const studentsToInsert: Array<{ id: string; userId: string; status: string }> = [];
  const risksToInsert: Array<{ riskId: string; studentId: string; riskScore: number; riskLevel: RiskLevel; explanation: string; calculatedAt: Date }> = [];
  const loginsToInsert: Array<{ loginId: string; studentId: string; loginTime: Date }> = [];
  const nudgesToInsert: Array<{ nudgeId: string; studentId: string; instructorId: string; status: NudgeStatus; message: string; sentAt: Date | null }> = [];
  const enrollmentsToInsert: Array<{ id: string; studentId: string; courseId: string; enrollmentDate: Date }> = [];

  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const emailPrefix = name.toLowerCase().replace(/\s+/g, ".");
    const email = `${emailPrefix}@student.unacademy.com`;

    // Linear spread of risk scores from 6.0 to 98.0
    const riskScore = Math.round((6.0 + (i / (studentNames.length - 1)) * 92.0) * 10) / 10;
    const riskLevel =
      riskScore >= 70
        ? RiskLevel.HIGH
        : riskScore >= 35
        ? RiskLevel.MEDIUM
        : RiskLevel.LOW;

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

    // Assign each student to a single individual course (round-robin)
    const assignedCourse = courseData[i % courseData.length];
    enrollmentsToInsert.push({
      id: crypto.randomUUID(),
      studentId,
      courseId: assignedCourse.id,
      enrollmentDate: daysAgo(30 + (i % 60)),
    });

    let explanation = "";
    let nudgeStatus: NudgeStatus = NudgeStatus.NOT_REQUIRED;
    let nudgeMessage = "";
    let sentAt: Date | null = null;
    let loginDays: number[] = [];

    if (riskLevel === RiskLevel.LOW) {
      explanation = "High platform interaction, regular attendance, and >85% quiz completion rate.";
      nudgeStatus = NudgeStatus.NOT_REQUIRED;
      nudgeMessage = "Outstanding consistency in your coursework! Keep up the momentum.";
      loginDays = [0, 1, 2, 3, 5, 7];
    } else if (riskLevel === RiskLevel.MEDIUM) {
      explanation = "Login gaps extending beyond 4-6 days. Quiz performance dropped below target threshold.";
      nudgeStatus = i % 2 === 0 ? NudgeStatus.PENDING : NudgeStatus.SENT;
      nudgeMessage = `Hi ${name.split(" ")[0]}, we noticed a dip in your practice submissions. Let us know if you need mentor assistance.`;
      sentAt = nudgeStatus === NudgeStatus.SENT ? daysAgo(2) : null;
      loginDays = [3, 7, 12];
    } else {
      explanation = "Critical disengagement alert. Extended period of inactivity with multiple missed milestones.";
      nudgeStatus = i % 2 === 0 ? NudgeStatus.SENT : NudgeStatus.PENDING;
      nudgeMessage = `Hi ${name.split(" ")[0]}, urgent check-in regarding your coursework progress and milestone completion.`;
      sentAt = nudgeStatus === NudgeStatus.SENT ? daysAgo(4) : null;
      loginDays = [14, 25];
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

    nudgesToInsert.push({
      nudgeId: crypto.randomUUID(),
      studentId,
      instructorId,
      status: nudgeStatus,
      message: nudgeMessage,
      sentAt,
    });
  }

  // 6. Execute bulk batch insertions
  console.log("💾 Inserting users in bulk...");
  await prisma.user.createMany({ data: usersToInsert });

  console.log("💾 Inserting instructor, courses, and students in bulk...");
  await prisma.instructor.create({
    data: {
      id: instructorId,
      userId: instructorUserId,
    },
  });

  await prisma.course.createMany({ data: courseData });

  await prisma.student.createMany({ data: studentsToInsert });

  console.log("💾 Inserting enrollments in bulk...");
  await prisma.enrollment.createMany({ data: enrollmentsToInsert });

  console.log("💾 Inserting risk records in bulk...");
  await prisma.studentRisk.createMany({ data: risksToInsert });

  console.log("💾 Inserting login activities in bulk...");
  await prisma.loginActivity.createMany({ data: loginsToInsert });

  console.log("💾 Inserting nudges in bulk...");
  await prisma.nudge.createMany({ data: nudgesToInsert });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⚡ Bulk seeding completed successfully in ${duration}s! (1 Instructor + ${courseData.length} Courses + ${studentNames.length} Students + ${enrollmentsToInsert.length} Enrollments)`);

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
