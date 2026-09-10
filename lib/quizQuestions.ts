export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
}

// Curated question pool organized by topics
const QUESTION_POOLS: Record<string, QuizQuestion[]> = {
    dsa: [
        {
            id: "dsa-1",
            question: "Which data structure uses LIFO principle?",
            options: ["Queue", "Stack", "Array", "Linked List"],
            correctAnswer: "Stack",
        },
        {
            id: "dsa-2",
            question: "What is the worst-case time complexity of searching an unsorted array of size N?",
            options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
            correctAnswer: "O(N)",
        },
        {
            id: "dsa-3",
            question: "Which data structure is typically used to implement Breadth-First Search (BFS)?",
            options: ["Stack", "Queue", "Priority Queue", "Binary Search Tree"],
            correctAnswer: "Queue",
        },
        {
            id: "dsa-4",
            question: "What is the average-case time complexity of lookup in a standard Hash Table?",
            options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
            correctAnswer: "O(1)",
        },
        {
            id: "dsa-5",
            question: "Which algorithmic technique is commonly used to find contiguous sub-arrays with maximum sum?",
            options: ["Sliding Window / Kadane's Algorithm", "Dijkstra's Algorithm", "Kruskal's Algorithm", "Floyd-Warshall"],
            correctAnswer: "Sliding Window / Kadane's Algorithm",
        },
        {
            id: "dsa-6",
            question: "In a balanced Binary Search Tree (such as AVL or Red-Black), what is the time complexity of insertion?",
            options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
            correctAnswer: "O(log N)",
        },
        {
            id: "dsa-7",
            question: "Which sorting algorithm has a guaranteed worst-case time complexity of O(N log N)?",
            options: ["Quick Sort", "Merge Sort", "Bubble Sort", "Insertion Sort"],
            correctAnswer: "Merge Sort",
        },
        {
            id: "dsa-8",
            question: "What type of graph traversal uses recursion or an explicit stack?",
            options: ["Breadth-First Search", "Depth-First Search", "Topological Sort", "Kahn's Algorithm"],
            correctAnswer: "Depth-First Search",
        },
        {
            id: "dsa-9",
            question: "Which string operation is typically immutable in languages like Java and JavaScript?",
            options: ["Concatenation returning new string", "In-place mutation", "Buffer byte swapping", "Pointer arithmetic"],
            correctAnswer: "Concatenation returning new string",
        },
        {
            id: "dsa-10",
            question: "What is the space complexity of a recursive Fibonacci calculation without memoization?",
            options: ["O(1)", "O(N)", "O(2^N)", "O(log N)"],
            correctAnswer: "O(N)",
        },
    ],
    web: [
        {
            id: "web-1",
            question: "Which HTTP status code signifies that a requested resource was successfully created?",
            options: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
            correctAnswer: "201 Created",
        },
        {
            id: "web-2",
            question: "In React, what hook is used to perform side effects in functional components?",
            options: ["useState", "useEffect", "useContext", "useReducer"],
            correctAnswer: "useEffect",
        },
        {
            id: "web-3",
            question: "Which header is essential for preventing Cross-Site Scripting (XSS) attacks?",
            options: ["Content-Security-Policy", "Access-Control-Allow-Origin", "Cache-Control", "Accept-Encoding"],
            correctAnswer: "Content-Security-Policy",
        },
        {
            id: "web-4",
            question: "What is the primary benefit of Server-Side Rendering (SSR) in Next.js?",
            options: ["Reduced server cost", "Faster initial page load and improved SEO", "No JavaScript needed on client", "Automatic database indexing"],
            correctAnswer: "Faster initial page load and improved SEO",
        },
        {
            id: "web-5",
            question: "Which mechanism allows secure cross-origin communication between web browsers and servers?",
            options: ["CORS", "WebSockets", "JSONP", "HTTP/2 PUSH"],
            correctAnswer: "CORS",
        },
        {
            id: "web-6",
            question: "What does the 'key' prop in React lists help the reconciliation engine do?",
            options: ["Apply CSS classes", "Identify which items have changed, added, or removed", "Bind event listeners", "Encrypt DOM state"],
            correctAnswer: "Identify which items have changed, added, or removed",
        },
        {
            id: "web-7",
            question: "Which HTTP method is idempotent and used to replace an entire resource representation?",
            options: ["POST", "PUT", "PATCH", "DELETE"],
            correctAnswer: "PUT",
        },
        {
            id: "web-8",
            question: "What is the primary purpose of a Web Worker in modern browsers?",
            options: ["Manipulating the DOM directly", "Running CPU-intensive tasks in a background thread", "Handling HTTP cookies", "Rendering CSS stylesheets"],
            correctAnswer: "Running CPU-intensive tasks in a background thread",
        },
        {
            id: "web-9",
            question: "What is the role of an ORM (Object-Relational Mapping) like Prisma in backend development?",
            options: ["Serve static assets", "Map database tables to typed objects/models in application code", "Manage client-side routing", "Compress video streams"],
            correctAnswer: "Map database tables to typed objects/models in application code",
        },
        {
            id: "web-10",
            question: "Which of the following is a non-blocking asynchronous I/O runtime for JavaScript?",
            options: ["Node.js", "Apache HTTP Server", "Nginx", "PostgreSQL"],
            correctAnswer: "Node.js",
        },
    ],
    db: [
        {
            id: "db-1",
            question: "Which SQL clause is used to filter aggregated group records?",
            options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
            correctAnswer: "HAVING",
        },
        {
            id: "db-2",
            question: "What does the 'A' stand for in ACID properties of database transactions?",
            options: ["Atomicity", "Availability", "Accuracy", "Asynchrony"],
            correctAnswer: "Atomicity",
        },
        {
            id: "db-3",
            question: "Which index structure is most widely used by relational databases for range queries?",
            options: ["Hash Index", "B-Tree / B+ Tree", "Bitmap Index", "Inverted Index"],
            correctAnswer: "B-Tree / B+ Tree",
        },
        {
            id: "db-4",
            question: "In database normalization, which normal form eliminates transitive functional dependencies?",
            options: ["1NF", "2NF", "3NF", "BCNF"],
            correctAnswer: "3NF",
        },
        {
            id: "db-5",
            question: "What is the main purpose of database sharding?",
            options: ["Vertical scaling", "Horizontally partitioning data across multiple machines", "Encrypting database logs", "Creating foreign key constraints"],
            correctAnswer: "Horizontally partitioning data across multiple machines",
        },
    ],
    system: [
        {
            id: "sys-1",
            question: "According to the CAP theorem, which property must a distributed system sacrifice during network partitions?",
            options: ["Latency", "Either Consistency or Availability", "Durability", "Scalability"],
            correctAnswer: "Either Consistency or Availability",
        },
        {
            id: "sys-2",
            question: "What caching strategy updates the cache and database simultaneously when writing data?",
            options: ["Write-Through", "Write-Back", "Cache-Aside", "Read-Through"],
            correctAnswer: "Write-Through",
        },
        {
            id: "sys-3",
            question: "Which load-balancing algorithm distributes requests evenly in cyclical sequential order?",
            options: ["Least Connections", "Round Robin", "Consistent Hashing", "IP Hash"],
            correctAnswer: "Round Robin",
        },
        {
            id: "sys-4",
            question: "Which protocol is connection-oriented and provides reliable, ordered byte-stream transmission?",
            options: ["UDP", "TCP", "ICMP", "IP"],
            correctAnswer: "TCP",
        },
        {
            id: "sys-5",
            question: "What is the primary benefit of deploying services in Docker containers?",
            options: ["Hardware acceleration", "Consistent, isolated execution environments across environments", "Automatic SQL query optimization", "Replacing DNS servers"],
            correctAnswer: "Consistent, isolated execution environments across environments",
        },
    ],
};

/**
 * Retrieves multiple-choice questions (with 4 choices and correct answer key)
 * corresponding to the quiz topic and requested question count.
 */
export function getQuizQuestions(
    quizTitle: string = "",
    courseName: string = "",
    count: number = 5
): QuizQuestion[] {
    const combined = `${quizTitle} ${courseName}`.toLowerCase();

    let primaryPool: QuizQuestion[];

    if (
        combined.includes("array") ||
        combined.includes("string") ||
        combined.includes("data structure") ||
        combined.includes("algorithm") ||
        combined.includes("dsa")
    ) {
        primaryPool = QUESTION_POOLS.dsa;
    } else if (
        combined.includes("web") ||
        combined.includes("frontend") ||
        combined.includes("react") ||
        combined.includes("typescript") ||
        combined.includes("full-stack")
    ) {
        primaryPool = QUESTION_POOLS.web;
    } else if (
        combined.includes("database") ||
        combined.includes("sql") ||
        combined.includes("query")
    ) {
        primaryPool = QUESTION_POOLS.db;
    } else if (
        combined.includes("system") ||
        combined.includes("cloud") ||
        combined.includes("architecture") ||
        combined.includes("devops") ||
        combined.includes("network")
    ) {
        primaryPool = QUESTION_POOLS.system;
    } else {
        // Default to DSA pool
        primaryPool = QUESTION_POOLS.dsa;
    }

    // Combine with all pools to ensure sufficient question count if count > primaryPool.length
    const fullFallbackPool = [
        ...primaryPool,
        ...QUESTION_POOLS.dsa.filter((q) => !primaryPool.includes(q)),
        ...QUESTION_POOLS.web,
        ...QUESTION_POOLS.system,
        ...QUESTION_POOLS.db,
    ];

    const targetCount = Math.max(1, count);
    const selected: QuizQuestion[] = [];

    for (let i = 0; i < targetCount; i++) {
        const question = fullFallbackPool[i % fullFallbackPool.length];
        // Create an indexed instance so each question ID is unique in this quiz
        selected.push({
            id: `q-${i + 1}-${question.id}`,
            question: question.question,
            options: [...question.options],
            correctAnswer: question.correctAnswer,
        });
    }

    return selected;
}
