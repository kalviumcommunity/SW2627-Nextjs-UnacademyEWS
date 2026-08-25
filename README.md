# Unacademy Early Warning System (EWS)

An early warning system designed to help instructors identify students who may be at risk of disengaging from their learning journey.

The system monitors student engagement through activities such as login frequency and quiz completion, calculates a dynamic risk score, and helps instructors take timely action through targeted nudges.

## Problem

Instructors may not always notice when a student's engagement starts declining. By the time the problem becomes visible, it may already be difficult to intervene effectively.

The Early Warning System aims to identify these changes early and provide instructors with useful information about which students may need attention.

## MVP Features

- Student login and authentication
- Quiz completion tracking
- Dynamic student risk score and risk levels
- Automatic risk score updates after relevant student activity
- Instructor dashboard for monitoring students
- At-risk student list and details
- Contributing factors behind a student's risk level
- Instructor nudges for at-risk students
- Efficient risk score recalculation for a large number of students

## Affected Users

### Students

Students interact with the learning platform through activities such as logging in and completing quizzes. These interactions contribute to their engagement and risk score.

## Target Users

### Instructors

Instructors use the system to:

- Monitor student engagement
- Identify at-risk students
- Understand factors contributing to a student's risk
- Send targeted nudges to students who may need support

## Risk Scoring

Each student has a dynamic risk score based on relevant engagement activity.

The risk score can change when a student performs an activity such as logging in or completing a quiz.

The system should avoid unnecessarily recalculating students whose relevant activity has not changed.

## Tech Stack

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- Neon

## Project Structure

```text
unacademy-ews/
│
├── app/
│   ├── ...                    # Next.js application routes and UI
│   └── generated/
│       └── prisma/            # Generated Prisma Client
│
├── lib/
│   └── prisma.ts              # Shared Prisma Client instance
│
├── prisma/
│   └── schema.prisma          # Database schema
│
├── public/                    # Static assets
│
├── prisma.config.ts           # Prisma configuration
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/kalviumcommunity/SW2627-Nextjs-UnacademyEWS.git
cd unacademy-ews
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your-neon-database-url"
```

Do not commit `.env` to GitHub.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

### 6. Build the project

To verify the production build:

```bash
npm run build
```

## Database

The project uses PostgreSQL hosted on Neon with Prisma as the ORM.

The Prisma schema is located at:

```text
prisma/schema.prisma
```
