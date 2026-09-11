export interface CourseTopicContent {
    description: string;
    syllabus: string[];
}

// Curated static content repository structured by course topics
const COURSE_TOPICS: Record<string, CourseTopicContent> = {
    dsa: {
        description:
            "Master the core concepts of memory allocation, sorting algorithms, and standard linear/nonlinear data structures to design highly optimal software architectures.",
        syllabus: [
            "Arrays & Strings",
            "Linked Lists",
            "Trees & Graphs",
            "Sorting Algorithms",
            "Dynamic Programming",
            "Graph Algorithms",
        ],
    },
    web: {
        description:
            "Build modern, scalable web applications with responsive user interfaces, robust full-stack architectures, and state management techniques.",
        syllabus: [
            "HTML5, CSS3 & Responsive Design",
            "JavaScript ES6+ & TypeScript Essentials",
            "React & Component Architecture",
            "State Management & Custom Hooks",
            "RESTful APIs & Asynchronous Data Fetching",
            "Full-Stack Deployment & CI/CD",
        ],
    },
    backend: {
        description:
            "Master scalable server-side architectures, RESTful API design, microservices communication, message queues, and distributed data caching.",
        syllabus: [
            "RESTful & gRPC API Architecture",
            "Microservices Patterns & Service Mesh",
            "Distributed Caching with Redis",
            "Message Brokers (Kafka & RabbitMQ)",
            "Authentication, Rate Limiting & API Gateways",
            "High-Throughput Database Connection Pooling",
        ],
    },
    frontend: {
        description:
            "Architect high-performance frontend applications with modern React, TypeScript type safety, design systems, and state synchronization.",
        syllabus: [
            "Advanced TypeScript & Type Inference",
            "React Server Components & Next.js App Router",
            "State Management (Zustand, Redux Toolkit)",
            "Component Design Systems & Accessibility",
            "Web Performance & Core Web Vitals",
            "End-to-End Testing with Playwright",
        ],
    },
    ml: {
        description:
            "Explore predictive modeling, neural networks, supervised and unsupervised learning algorithms to solve complex data-driven problems.",
        syllabus: [
            "Supervised Learning & Regression Models",
            "Classification & Logistic Regression",
            "Decision Trees & Random Forests",
            "Neural Networks & Deep Learning",
            "Model Evaluation & Hyperparameter Tuning",
            "Natural Language Processing Basics",
        ],
    },
    deeplearning: {
        description:
            "Master deep neural network architectures, computer vision, convolutional networks, transformers, and large language model fine-tuning.",
        syllabus: [
            "Deep Neural Networks & Backpropagation",
            "Convolutional Neural Networks (CNNs)",
            "Recurrent Networks & Attention Mechanisms",
            "Transformers & BERT / GPT Architectures",
            "Generative AI & Diffusion Models",
            "Model Optimization & GPU Acceleration",
        ],
    },
    datascience: {
        description:
            "Analyze large datasets, engineer statistical features, build predictive pipelines, and communicate insights with interactive visual dashboards.",
        syllabus: [
            "Exploratory Data Analysis with Pandas & NumPy",
            "Statistical Hypothesis Testing & Probability",
            "Feature Engineering & Dimensionality Reduction",
            "Predictive Modeling & Time-Series Forecasting",
            "Data Visualization with Seaborn & Plotly",
            "Big Data Processing with PySpark",
        ],
    },
    db: {
        description:
            "Understand relational schema design, query optimization, indexing strategies, and transaction isolation levels in modern databases.",
        syllabus: [
            "Relational Model & Database Normalization",
            "Advanced SQL & Aggregation Techniques",
            "B-Tree Indexing & Query Optimization",
            "ACID Transactions & Concurrency Control",
            "NoSQL Data Modeling & Document Stores",
            "Database Sharding & Replication",
        ],
    },
    networks: {
        description:
            "Deep dive into network architectures, OSI and TCP/IP stack layers, routing protocols, and modern communication mechanisms.",
        syllabus: [
            "OSI & TCP/IP Model Layers",
            "Data Link Layer & Framing",
            "Network Layer, IP Addressing & Subnetting",
            "Transport Layer (TCP vs UDP)",
            "Application Layer Protocols (HTTP, DNS, TLS)",
            "Network Security & Firewalls",
        ],
    },
    os: {
        description:
            "Learn core operating system principles including process scheduling, inter-process communication, memory virtualization, and file systems.",
        syllabus: [
            "Process Management & Multi-Threading",
            "CPU Scheduling Algorithms",
            "Process Synchronization & Mutexes",
            "Virtual Memory & Paging Mechanisms",
            "File System Architecture & Inodes",
            "Low-Level I/O & System Calls",
        ],
    },
    system: {
        description:
            "Design resilient, distributed systems handling high throughput with load balancing, caching, and microservices design patterns.",
        syllabus: [
            "Scalability & Load Balancing Strategies",
            "Distributed Caching & CDN Architectures",
            "Microservices vs Monoliths",
            "Message Queues & Event-Driven Systems",
            "Database Partitioning & CAP Theorem",
            "System Reliability & Fault Tolerance",
        ],
    },
    cloud: {
        description:
            "Master container orchestration, automated pipelines, cloud resource provisioning, and infrastructure as code.",
        syllabus: [
            "Cloud Infrastructure Fundamentals",
            "Docker & Containerization",
            "Kubernetes Cluster Orchestration",
            "CI/CD Pipeline Automation",
            "Infrastructure as Code with Terraform",
            "Cloud Monitoring & Observability",
        ],
    },
    sre: {
        description:
            "Ensure high availability, incident response readiness, observability, SLIs/SLOs, and automated disaster recovery for mission-critical infrastructure.",
        syllabus: [
            "Service Level Objectives (SLOs) & Error Budgets",
            "Distributed Tracing & Metrics with Prometheus",
            "Automated Alerting & Incident Management",
            "Chaos Engineering & Fault Injection",
            "Capacity Planning & Load Testing",
            "Disaster Recovery & High Availability Multi-Region Setup",
        ],
    },
    security: {
        description:
            "Implement defense-in-depth security strategies, authentication workflows, vulnerability management, and threat modeling.",
        syllabus: [
            "Information Security Principles",
            "Cryptography & Public Key Infrastructure",
            "Authentication & Authorization (OAuth, JWT)",
            "Web Application Security & OWASP Top 10",
            "Network Penetration Testing",
            "Security Operations & Incident Response",
        ],
    },
    mobile: {
        description:
            "Develop cross-platform mobile applications with native device integrations, responsive gestures, and offline data synchronization.",
        syllabus: [
            "Mobile Architecture & UI Components",
            "Navigation & Route Management",
            "State Management in Mobile Apps",
            "Native Device APIs & Permissions",
            "Offline Storage & Synchronization",
            "App Store Deployment & Performance",
        ],
    },
    blockchain: {
        description:
            "Design decentralized applications, smart contracts, cryptographic consensus mechanisms, and secure Web3 protocols.",
        syllabus: [
            "Cryptography & Consensus Mechanisms (PoW, PoS)",
            "Smart Contract Development with Solidity",
            "EVM Architecture & Gas Optimization",
            "DeFi Protocols & Token Standards (ERC-20, ERC-721)",
            "Smart Contract Security & Auditing",
            "Web3 Frontend Integration with Ethers.js",
        ],
    },
    compilers: {
        description:
            "Explore compiler construction, lexical analysis, AST generation, intermediate code representation, and code generation optimizations.",
        syllabus: [
            "Lexical Analysis & Regular Expressions",
            "Context-Free Grammars & Parsing (LL, LR)",
            "Abstract Syntax Trees (AST) & Semantic Analysis",
            "Intermediate Representation & Bytecode",
            "Code Generation & Register Allocation",
            "Compiler Optimizations & LLVM Infrastructure",
        ],
    },
};

/**
 * Retrieves topic-based course descriptions and module outlines based on the course name.
 */
export function getCourseContent(courseName: string = ""): CourseTopicContent {
    const normalized = courseName.toLowerCase();

    // 1. Data Structures & Algorithms
    if (
        normalized.includes("data structure") ||
        normalized.includes("algorithm") ||
        normalized.includes("dsa")
    ) {
        return COURSE_TOPICS.dsa;
    }

    // 2. Backend Engineering & Microservices
    if (
        normalized.includes("backend") ||
        normalized.includes("microservice") ||
        normalized.includes("rest api") ||
        normalized.includes("graphql")
    ) {
        return COURSE_TOPICS.backend;
    }

    // 3. Frontend Engineering
    if (
        normalized.includes("frontend") ||
        normalized.includes("react native") === false && (normalized.includes("react") || normalized.includes("typescript"))
    ) {
        return COURSE_TOPICS.frontend;
    }

    // 4. Web Development (Full-Stack)
    if (
        normalized.includes("web development") ||
        normalized.includes("full-stack") ||
        normalized.includes("javascript")
    ) {
        return COURSE_TOPICS.web;
    }

    // 5. Deep Learning & Neural Networks
    if (
        normalized.includes("deep learning") ||
        normalized.includes("neural") ||
        normalized.includes("transformer") ||
        normalized.includes("llm")
    ) {
        return COURSE_TOPICS.deeplearning;
    }

    // 6. Data Science & Analytics
    if (
        normalized.includes("data science") ||
        normalized.includes("predictive") ||
        normalized.includes("analytics")
    ) {
        return COURSE_TOPICS.datascience;
    }

    // 7. Machine Learning & AI
    if (
        normalized.includes("machine learning") ||
        normalized.includes("ai engineering") ||
        normalized.includes("artificial intelligence")
    ) {
        return COURSE_TOPICS.ml;
    }

    // 8. Database Systems
    if (
        normalized.includes("database") ||
        normalized.includes("sql") ||
        normalized.includes("query tuning") ||
        normalized.includes("dbms")
    ) {
        return COURSE_TOPICS.db;
    }

    // 9. Operating Systems (Note: using whole-word/exact phrase checks so 'microservices' does not match)
    if (
        normalized.includes("operating system") ||
        normalized.includes("low-level") ||
        normalized.includes("c++") ||
        /\boperating systems?\b/.test(normalized) ||
        /\bos\b/.test(normalized)
    ) {
        return COURSE_TOPICS.os;
    }

    // 10. Computer Networks
    if (
        normalized.includes("computer network") ||
        normalized.includes("network defense") === false && normalized.includes("network") ||
        normalized.includes("protocol")
    ) {
        return COURSE_TOPICS.networks;
    }

    // 11. System Design
    if (
        normalized.includes("system design") ||
        normalized.includes("system architecture") ||
        normalized.includes("distributed system")
    ) {
        return COURSE_TOPICS.system;
    }

    // 12. Site Reliability Engineering (SRE)
    if (
        normalized.includes("site reliability") ||
        normalized.includes("sre")
    ) {
        return COURSE_TOPICS.sre;
    }

    // 13. Cloud Computing & DevOps / Kubernetes
    if (
        normalized.includes("cloud") ||
        normalized.includes("devops") ||
        normalized.includes("aws") ||
        normalized.includes("kubernetes") ||
        normalized.includes("container") ||
        normalized.includes("ci/cd") ||
        normalized.includes("agile")
    ) {
        return COURSE_TOPICS.cloud;
    }

    // 14. Cybersecurity
    if (
        normalized.includes("security") ||
        normalized.includes("cyber") ||
        normalized.includes("defense") ||
        normalized.includes("crypt")
    ) {
        return COURSE_TOPICS.security;
    }

    // 15. Mobile Development
    if (
        normalized.includes("mobile") ||
        normalized.includes("react native") ||
        normalized.includes("android") ||
        normalized.includes("ios")
    ) {
        return COURSE_TOPICS.mobile;
    }

    // 16. Blockchain
    if (
        normalized.includes("blockchain") ||
        normalized.includes("smart contract")
    ) {
        return COURSE_TOPICS.blockchain;
    }

    // 17. Compilers
    if (
        normalized.includes("compiler") ||
        normalized.includes("language design")
    ) {
        return COURSE_TOPICS.compilers;
    }

    // Default Fallback
    return {
        description: `Comprehensive curriculum covering foundational principles, core implementation techniques, and industry-standard best practices in ${courseName}.`,
        syllabus: [
            "Module 1: Foundations & Architecture Overview",
            "Module 2: Core Concepts & Principles",
            "Module 3: Advanced Implementation Techniques",
            "Module 4: Practical Design Patterns",
            "Module 5: Performance Optimization & Testing",
            "Module 6: Capstone Project & Evaluation",
        ],
    };
}
