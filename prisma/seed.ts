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
  console.log("⚡ Starting ultra-fast bulk seeding for 20 instructors, 20 courses, and 50 students...");
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

  // 2. Prepare 20 Instructors
  const instructorProfiles = [
    { name: "Dr. Rajesh Sharma", email: "rajesh.sharma@unacademy.com" },
    { name: "Prof. Ananya Iyer", email: "ananya.iyer@unacademy.com" },
    { name: "Dr. Vikram Malhotra", email: "vikram.malhotra@unacademy.com" },
    { name: "Prof. Priya Sen", email: "priya.sen@unacademy.com" },
    { name: "Dr. Rohan Verma", email: "rohan.verma@unacademy.com" },
    { name: "Prof. Sneha Kulkarni", email: "sneha.kulkarni@unacademy.com" },
    { name: "Dr. Amit Patel", email: "amit.patel@unacademy.com" },
    { name: "Prof. Kavita Nair", email: "kavita.nair@unacademy.com" },
    { name: "Dr. Manish Joshi", email: "manish.joshi@unacademy.com" },
    { name: "Prof. Pooja Hegde", email: "pooja.hegde@unacademy.com" },
    { name: "Dr. Siddharth Rao", email: "siddharth.rao@unacademy.com" },
    { name: "Prof. Sunita Deshmukh", email: "sunita.deshmukh@unacademy.com" },
    { name: "Dr. Arjun Kapoor", email: "arjun.kapoor@unacademy.com" },
    { name: "Prof. Neha Gupta", email: "neha.gupta@unacademy.com" },
    { name: "Dr. Vivek Agnihotri", email: "vivek.agnihotri@unacademy.com" },
    { name: "Prof. Radhika Merchant", email: "radhika.merchant@unacademy.com" },
    { name: "Dr. Sanjay Mehta", email: "sanjay.mehta@unacademy.com" },
    { name: "Prof. Shilpa Shetty", email: "shilpa.shetty@unacademy.com" },
    { name: "Dr. Harsh Vardhan", email: "harsh.vardhan@unacademy.com" },
    { name: "Prof. Tanvi Bhatia", email: "tanvi.bhatia@unacademy.com" },
  ];

  const instructorsToInsert: Array<{ id: string; userId: string }> = [];
  const instructorUsers: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }> = [];

  for (const prof of instructorProfiles) {
    const userId = crypto.randomUUID();
    const instructorId = crypto.randomUUID();

    instructorUsers.push({
      id: userId,
      name: prof.name,
      email: prof.email,
      passwordHash: defaultPasswordHash,
      role: Role.INSTRUCTOR,
    });

    instructorsToInsert.push({
      id: instructorId,
      userId,
    });
  }

  // 3. Prepare exactly 20 Courses (assigned exactly 1 course per instructor)
  const courseTitles = [
    "Full Stack Web Development",
    "Data Structures & Algorithms",
    "System Design & Architecture",
    "Machine Learning & AI Foundations",
    "Database Systems & Query Optimization",
    "Cloud Computing with AWS & Docker",
    "Cyber Security & Ethical Hacking",
    "DevOps & CI/CD Engineering",
    "Mobile App Development with Flutter",
    "Natural Language Processing & LLMs",
    "Computer Networks & Distributed Systems",
    "Operating Systems & Low-Level Design",
    "Data Engineering & Big Data Pipelines",
    "Microservices Architecture & Kubernetes",
    "Competitive Programming & Math",
    "Advanced Frontend Engineering & Next.js",
    "Deep Learning & Neural Networks",
    "Information Security & Cryptography",
    "Blockchain & Smart Contract Development",
    "Site Reliability Engineering & Monitoring",
  ];

  const courseData = courseTitles.map((title, idx) => ({
    id: crypto.randomUUID(),
    courseName: title,
    instructorId: instructorsToInsert[idx].id,
  }));

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
  }> = [...instructorUsers];
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

    // Randomly enroll student in 1 to 3 distinct courses across the 20 courses
    const numCourses = 1 + ((i * 3 + 1) % 3); // 1, 2, or 3 courses deterministically spread
    const chosenCourseIndices = new Set<number>();
    for (let c = 0; c < numCourses; c++) {
      chosenCourseIndices.add((i * 7 + c * 5) % courseData.length);
    }

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

    // Add enrollments and nudges for each enrolled course
    for (const courseIdx of chosenCourseIndices) {
      const assignedCourse = courseData[courseIdx];

      enrollmentsToInsert.push({
        id: crypto.randomUUID(),
        studentId,
        courseId: assignedCourse.id,
        enrollmentDate: daysAgo(30 + ((i + courseIdx) % 60)),
      });

      nudgesToInsert.push({
        nudgeId: crypto.randomUUID(),
        studentId,
        instructorId: assignedCourse.instructorId,
        status: nudgeStatus,
        message: nudgeMessage,
        sentAt,
      });
    }
  }

  // 6. Execute bulk batch insertions
  console.log("💾 Inserting users in bulk...");
  await prisma.user.createMany({ data: usersToInsert });

  console.log("💾 Inserting instructors, courses, and students in bulk...");
  await prisma.instructor.createMany({ data: instructorsToInsert });

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
  console.log(`\n⚡ Bulk seeding completed successfully in ${duration}s! (${instructorProfiles.length} Instructors (1 course each) + ${courseData.length} Courses + ${studentNames.length} Students + ${enrollmentsToInsert.length} Multi-Course Enrollments)`);
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
