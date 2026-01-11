import { db } from '../index';
import {
  projects,
  tasks,
  serverAgents,
  skills,
  agentSessions,
  agentSessionMessages,
  agentSessionEvents,
  artifacts,
  taskArtifacts,
  type TaskEvent,
  type AgentSessionUsage,
  type AgentSessionMessageMetadata,
  type SkillFile,
} from '../schema';

// ============================================================================
// Demo Constants - Fixed IDs for idempotent seeding
// ============================================================================

export const DEMO_USER_ID = 'user_demo_000000000000000000000';
export const DEMO_ORG_ID = 'org_demo_0000000000000000000000';

// Project IDs
export const DEMO_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001';
const PROJECT_IDS = {
  websiteRedesign: DEMO_PROJECT_ID,
  mobileApp: 'a0000000-0000-0000-0000-000000000002',
  apiIntegration: 'a0000000-0000-0000-0000-000000000003',
};

// Task IDs
const TASK_IDS = {
  // Website Redesign tasks
  designMockups: 'b0000000-0000-0000-0000-000000000001',
  implementNav: 'b0000000-0000-0000-0000-000000000002',
  buildHomepage: 'b0000000-0000-0000-0000-000000000003',
  setupCMS: 'b0000000-0000-0000-0000-000000000004',
  seoOptimization: 'b0000000-0000-0000-0000-000000000005',
  // Mobile App tasks
  setupProject: 'b0000000-0000-0000-0000-000000000006',
  authFlow: 'b0000000-0000-0000-0000-000000000007',
  pushNotifications: 'b0000000-0000-0000-0000-000000000008',
  offlineMode: 'b0000000-0000-0000-0000-000000000009',
  // API Integration tasks
  designSchema: 'b0000000-0000-0000-0000-000000000010',
  buildEndpoints: 'b0000000-0000-0000-0000-000000000011',
  writeTests: 'b0000000-0000-0000-0000-000000000012',
  documentation: 'b0000000-0000-0000-0000-000000000013',
};

// Agent IDs
const AGENT_IDS = {
  codeReviewer: 'c0000000-0000-0000-0000-000000000001',
  docWriter: 'c0000000-0000-0000-0000-000000000002',
  researcher: 'c0000000-0000-0000-0000-000000000003',
};

// Skill IDs
const SKILL_IDS = {
  codeReview: 'd0000000-0000-0000-0000-000000000001',
  webResearch: 'd0000000-0000-0000-0000-000000000002',
};

// Session IDs
const SESSION_IDS = {
  session1: 'e0000000-0000-0000-0000-000000000001',
  session2: 'e0000000-0000-0000-0000-000000000002',
  session3: 'e0000000-0000-0000-0000-000000000003',
  session4: 'e0000000-0000-0000-0000-000000000004',
  session5: 'e0000000-0000-0000-0000-000000000005',
};

// Message IDs
const MESSAGE_IDS = {
  // Session 1 messages
  s1m1: 'f0000000-0000-0000-0000-000000000001',
  s1m2: 'f0000000-0000-0000-0000-000000000002',
  s1m3: 'f0000000-0000-0000-0000-000000000003',
  s1m4: 'f0000000-0000-0000-0000-000000000004',
  // Session 2 messages
  s2m1: 'f0000000-0000-0000-0000-000000000005',
  s2m2: 'f0000000-0000-0000-0000-000000000006',
  // Session 3 messages
  s3m1: 'f0000000-0000-0000-0000-000000000007',
  s3m2: 'f0000000-0000-0000-0000-000000000008',
  s3m3: 'f0000000-0000-0000-0000-000000000009',
  s3m4: 'f0000000-0000-0000-0000-000000000010',
};

// Artifact IDs
const ARTIFACT_IDS = {
  projectRequirements: 'g0000000-0000-0000-0000-000000000001',
  apiDesign: 'g0000000-0000-0000-0000-000000000002',
  meetingNotes: 'g0000000-0000-0000-0000-000000000003',
  codeReviewReport: 'g0000000-0000-0000-0000-000000000004',
  techSpec: 'g0000000-0000-0000-0000-000000000005',
};

// ============================================================================
// Seed Functions
// ============================================================================

async function seedDemoProjects() {
  console.log('  Seeding demo projects...');

  const demoProjects = [
    {
      id: PROJECT_IDS.websiteRedesign,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Website Redesign',
      summary:
        'Complete redesign of company website with modern UI/UX, improved accessibility, and mobile-first approach.',
    },
    {
      id: PROJECT_IDS.mobileApp,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Mobile App Development',
      summary:
        'React Native cross-platform app for iOS and Android with offline support and push notifications.',
    },
    {
      id: PROJECT_IDS.apiIntegration,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'API Integration Platform',
      summary:
        'RESTful API with GraphQL layer for third-party integrations and internal microservices.',
    },
  ];

  await db.insert(projects).values(demoProjects).onConflictDoNothing();
}

async function seedDemoTasks() {
  console.log('  Seeding demo tasks...');

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const createEvent = (
    type: TaskEvent['type'],
    from?: string,
    to?: string
  ): TaskEvent => ({
    type,
    timestamp: dayAgo.toISOString(),
    userId: DEMO_USER_ID,
    details: from && to ? { from, to } : undefined,
  });

  const demoTasks = [
    // Website Redesign tasks
    {
      id: TASK_IDS.designMockups,
      projectId: PROJECT_IDS.websiteRedesign,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Design homepage mockups',
      description:
        'Create Figma mockups for the new homepage design with hero section and feature cards.',
      status: 'done' as const,
      priority: 'high' as const,
      position: 0,
      completedAt: dayAgo,
      events: [
        createEvent('created'),
        createEvent('status_changed', 'todo', 'done'),
      ],
    },
    {
      id: TASK_IDS.implementNav,
      projectId: PROJECT_IDS.websiteRedesign,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Implement responsive navigation',
      description:
        'Build the main navigation component with mobile hamburger menu and dropdown support.',
      status: 'review' as const,
      priority: 'high' as const,
      position: 1,
      events: [
        createEvent('created'),
        createEvent('status_changed', 'todo', 'review'),
      ],
    },
    {
      id: TASK_IDS.buildHomepage,
      projectId: PROJECT_IDS.websiteRedesign,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Build homepage components',
      description:
        'Implement React components for hero, features, testimonials, and CTA sections.',
      status: 'in_progress' as const,
      priority: 'high' as const,
      position: 2,
      dueDate: weekAhead,
      events: [
        createEvent('created'),
        createEvent('status_changed', 'todo', 'in_progress'),
      ],
    },
    {
      id: TASK_IDS.setupCMS,
      projectId: PROJECT_IDS.websiteRedesign,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Set up headless CMS',
      description:
        'Configure Sanity CMS for content management with blog posts and page content.',
      status: 'todo' as const,
      priority: 'medium' as const,
      position: 3,
      events: [createEvent('created')],
    },
    {
      id: TASK_IDS.seoOptimization,
      projectId: PROJECT_IDS.websiteRedesign,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'SEO optimization',
      description:
        'Implement meta tags, structured data, sitemap, and performance optimizations.',
      status: 'backlog' as const,
      priority: 'low' as const,
      position: 4,
      events: [createEvent('created')],
    },
    // Mobile App tasks
    {
      id: TASK_IDS.setupProject,
      projectId: PROJECT_IDS.mobileApp,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Initialize React Native project',
      description:
        'Set up project with Expo, configure TypeScript, ESLint, and Prettier.',
      status: 'done' as const,
      priority: 'urgent' as const,
      position: 0,
      completedAt: weekAgo,
      events: [
        createEvent('created'),
        createEvent('status_changed', 'todo', 'done'),
      ],
    },
    {
      id: TASK_IDS.authFlow,
      projectId: PROJECT_IDS.mobileApp,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Implement authentication flow',
      description:
        'Build login, signup, and password reset screens with OAuth support.',
      status: 'in_progress' as const,
      priority: 'urgent' as const,
      position: 1,
      dueDate: weekAhead,
      events: [
        createEvent('created'),
        createEvent('status_changed', 'todo', 'in_progress'),
      ],
    },
    {
      id: TASK_IDS.pushNotifications,
      projectId: PROJECT_IDS.mobileApp,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Set up push notifications',
      description:
        'Configure Firebase Cloud Messaging for iOS and Android push notifications.',
      status: 'todo' as const,
      priority: 'medium' as const,
      position: 2,
      events: [createEvent('created')],
    },
    {
      id: TASK_IDS.offlineMode,
      projectId: PROJECT_IDS.mobileApp,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Implement offline mode',
      description:
        'Add local storage with SQLite and sync mechanism for offline-first experience.',
      status: 'backlog' as const,
      priority: 'medium' as const,
      position: 3,
      events: [createEvent('created')],
    },
    // API Integration tasks
    {
      id: TASK_IDS.designSchema,
      projectId: PROJECT_IDS.apiIntegration,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Design API schema',
      description:
        'Create OpenAPI specification for all endpoints with request/response schemas.',
      status: 'done' as const,
      priority: 'high' as const,
      position: 0,
      completedAt: weekAgo,
      events: [
        createEvent('created'),
        createEvent('status_changed', 'todo', 'done'),
      ],
    },
    {
      id: TASK_IDS.buildEndpoints,
      projectId: PROJECT_IDS.apiIntegration,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Build REST endpoints',
      description:
        'Implement CRUD operations for users, products, and orders with validation.',
      status: 'in_progress' as const,
      priority: 'high' as const,
      position: 1,
      events: [
        createEvent('created'),
        createEvent('status_changed', 'todo', 'in_progress'),
      ],
    },
    {
      id: TASK_IDS.writeTests,
      projectId: PROJECT_IDS.apiIntegration,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Write integration tests',
      description:
        'Create comprehensive test suite with Jest for all API endpoints.',
      status: 'todo' as const,
      priority: 'medium' as const,
      position: 2,
      events: [createEvent('created')],
    },
    {
      id: TASK_IDS.documentation,
      projectId: PROJECT_IDS.apiIntegration,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Write API documentation',
      description:
        'Generate API docs with examples, authentication guide, and rate limiting info.',
      status: 'backlog' as const,
      priority: 'low' as const,
      position: 3,
      events: [createEvent('created')],
    },
  ];

  await db.insert(tasks).values(demoTasks).onConflictDoNothing();
}

async function seedDemoAgents() {
  console.log('  Seeding demo agents...');

  const demoAgents = [
    {
      id: AGENT_IDS.codeReviewer,
      userId: DEMO_USER_ID,
      key: 'code-reviewer',
      name: 'Code Reviewer',
      description:
        'Specialized in reviewing code for best practices, security, and performance.',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
      systemPrompt: `You are an expert code reviewer. Analyze code for:
- Security vulnerabilities
- Performance issues
- Best practices adherence
- Code clarity and maintainability
Provide specific, actionable feedback with examples.`,
      tools: ['getTime', 'webSearch'],
      isFavorite: true,
    },
    {
      id: AGENT_IDS.docWriter,
      userId: DEMO_USER_ID,
      key: 'doc-writer',
      name: 'Documentation Writer',
      description:
        'Creates clear, comprehensive documentation for code and APIs.',
      provider: 'openai',
      model: 'gpt-5',
      systemPrompt: `You are a technical writer specializing in software documentation.
Create clear, well-structured documentation including:
- API references
- User guides
- Code comments
- README files
Use markdown formatting and include examples.`,
      tools: ['getTime', 'extractContent'],
    },
    {
      id: AGENT_IDS.researcher,
      userId: DEMO_USER_ID,
      key: 'research-agent',
      name: 'Research Agent',
      description:
        'Researches technical topics and provides detailed analysis.',
      provider: 'gemini',
      model: 'gemini-2.5-pro',
      systemPrompt: `You are a technical researcher. When given a topic:
- Search for the latest information
- Analyze multiple sources
- Provide balanced, well-cited summaries
- Highlight key findings and recommendations`,
      tools: ['getTime', 'webSearch', 'extractContent'],
    },
  ];

  await db.insert(serverAgents).values(demoAgents).onConflictDoNothing();
}

async function seedDemoSkills() {
  console.log('  Seeding demo skills...');

  const codeReviewFiles: SkillFile[] = [
    {
      path: 'SKILL.md',
      content: `# Code Review Skill

When reviewing code, follow this checklist:

## Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Proper authentication/authorization checks
- [ ] SQL injection prevention
- [ ] XSS prevention

## Performance
- [ ] No unnecessary re-renders (React)
- [ ] Efficient database queries
- [ ] Proper caching strategies
- [ ] Lazy loading where appropriate

## Best Practices
- [ ] Consistent naming conventions
- [ ] DRY principle followed
- [ ] Proper error handling
- [ ] Adequate test coverage`,
    },
  ];

  const webResearchFiles: SkillFile[] = [
    {
      path: 'SKILL.md',
      content: `# Web Research Skill

When researching topics:

1. **Search Strategy**
   - Use multiple search queries
   - Check official documentation first
   - Look for recent articles (last 6 months)

2. **Source Evaluation**
   - Prefer official docs and reputable sites
   - Cross-reference multiple sources
   - Note publication dates

3. **Summary Format**
   - Key findings at the top
   - Pros and cons where applicable
   - Links to sources`,
    },
  ];

  const demoSkills = [
    {
      id: SKILL_IDS.codeReview,
      key: 'code-review',
      name: 'Code Review',
      description: 'Comprehensive code review checklist and guidelines',
      files: codeReviewFiles,
      isSystem: false,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
    },
    {
      id: SKILL_IDS.webResearch,
      key: 'web-research',
      name: 'Web Research',
      description: 'Structured approach to researching technical topics',
      files: webResearchFiles,
      isSystem: false,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
    },
  ];

  await db.insert(skills).values(demoSkills).onConflictDoNothing();
}

async function seedDemoSessions() {
  console.log('  Seeding demo sessions...');

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const createUsage = (
    promptTokens: number,
    completionTokens: number,
    turns: number,
    model: string,
    provider: string
  ): AgentSessionUsage => ({
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCost: (promptTokens * 0.003 + completionTokens * 0.015) / 1000,
    totalLatency: turns * 1500,
    averageLatency: 1500,
    messageCount: turns * 2,
    turnCount: turns,
    lastModel: model,
    lastProvider: provider,
  });

  const demoSessions = [
    {
      id: SESSION_IDS.session1,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      agentId: 'assistant-sonnet-4.5',
      title: 'React Performance Optimization',
      description:
        'Discussion about optimizing React app performance and reducing re-renders.',
      status: 'completed' as const,
      messageCount: 4,
      usage: createUsage(
        2500,
        1200,
        2,
        'claude-sonnet-4-5-20250929',
        'anthropic'
      ),
      createdAt: weekAgo,
      updatedAt: dayAgo,
    },
    {
      id: SESSION_IDS.session2,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      agentId: 'assistant-gpt-5',
      title: 'API Design Best Practices',
      description:
        'Exploring RESTful API design patterns and versioning strategies.',
      status: 'completed' as const,
      messageCount: 2,
      usage: createUsage(1800, 900, 1, 'gpt-5', 'openai'),
      createdAt: dayAgo,
      updatedAt: dayAgo,
    },
    {
      id: SESSION_IDS.session3,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      agentId: AGENT_IDS.codeReviewer,
      title: 'Authentication Code Review',
      description:
        'Reviewing the authentication implementation for security issues.',
      status: 'active' as const,
      messageCount: 4,
      usage: createUsage(
        3200,
        1800,
        2,
        'claude-sonnet-4-5-20250929',
        'anthropic'
      ),
      createdAt: hourAgo,
      updatedAt: now,
    },
    {
      id: SESSION_IDS.session4,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      agentId: 'assistant-gemini-2.5-pro',
      title: 'Database Schema Design',
      description: 'Planning the database schema for the new feature.',
      status: 'active' as const,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: SESSION_IDS.session5,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      agentId: 'assistant-haiku-4.5',
      title: 'Quick Question',
      status: 'cancelled' as const,
      messageCount: 0,
      createdAt: weekAgo,
      updatedAt: weekAgo,
    },
  ];

  await db.insert(agentSessions).values(demoSessions).onConflictDoNothing();
}

async function seedDemoMessages() {
  console.log('  Seeding demo messages...');

  const createMetadata = (
    model: string,
    tokens: number,
    latency: number
  ): AgentSessionMessageMetadata => ({
    model,
    tokensUsed: tokens,
    latency,
    finishReason: 'stop',
    contextTokens: tokens,
  });

  const demoMessages = [
    // Session 1 messages (React Performance)
    {
      id: MESSAGE_IDS.s1m1,
      sessionId: SESSION_IDS.session1,
      role: 'user' as const,
      status: 'complete' as const,
    },
    {
      id: MESSAGE_IDS.s1m2,
      sessionId: SESSION_IDS.session1,
      role: 'assistant' as const,
      status: 'complete' as const,
      metadata: createMetadata('claude-sonnet-4-5-20250929', 800, 1200),
    },
    {
      id: MESSAGE_IDS.s1m3,
      sessionId: SESSION_IDS.session1,
      role: 'user' as const,
      status: 'complete' as const,
    },
    {
      id: MESSAGE_IDS.s1m4,
      sessionId: SESSION_IDS.session1,
      role: 'assistant' as const,
      status: 'complete' as const,
      metadata: createMetadata('claude-sonnet-4-5-20250929', 1200, 1800),
    },
    // Session 2 messages (API Design)
    {
      id: MESSAGE_IDS.s2m1,
      sessionId: SESSION_IDS.session2,
      role: 'user' as const,
      status: 'complete' as const,
    },
    {
      id: MESSAGE_IDS.s2m2,
      sessionId: SESSION_IDS.session2,
      role: 'assistant' as const,
      status: 'complete' as const,
      metadata: createMetadata('gpt-5', 900, 1500),
    },
    // Session 3 messages (Code Review - active)
    {
      id: MESSAGE_IDS.s3m1,
      sessionId: SESSION_IDS.session3,
      role: 'user' as const,
      status: 'complete' as const,
    },
    {
      id: MESSAGE_IDS.s3m2,
      sessionId: SESSION_IDS.session3,
      role: 'assistant' as const,
      status: 'complete' as const,
      metadata: createMetadata('claude-sonnet-4-5-20250929', 1000, 1400),
    },
    {
      id: MESSAGE_IDS.s3m3,
      sessionId: SESSION_IDS.session3,
      role: 'user' as const,
      status: 'complete' as const,
    },
    {
      id: MESSAGE_IDS.s3m4,
      sessionId: SESSION_IDS.session3,
      role: 'assistant' as const,
      status: 'complete' as const,
      metadata: createMetadata('claude-sonnet-4-5-20250929', 1400, 2000),
    },
  ];

  await db
    .insert(agentSessionMessages)
    .values(demoMessages)
    .onConflictDoNothing();
}

async function seedDemoEvents() {
  console.log('  Seeding demo events...');

  const demoEvents = [
    // Session 1, Message 1 (user) - text content
    {
      sessionId: SESSION_IDS.session1,
      messageId: MESSAGE_IDS.s1m1,
      sequence: 0,
      type: 'text_delta' as const,
      content:
        'My React app is getting slow with lots of components. How can I optimize performance and reduce unnecessary re-renders?',
    },
    // Session 1, Message 2 (assistant) - response with tool use
    {
      sessionId: SESSION_IDS.session1,
      messageId: MESSAGE_IDS.s1m2,
      sequence: 0,
      type: 'text_delta' as const,
      content: `Here are key strategies to optimize React performance:

**1. Use React.memo() for Pure Components**
Wrap components that only depend on props to prevent unnecessary re-renders.

**2. Optimize State Management**
- Keep state as local as possible
- Use useCallback and useMemo for expensive computations
- Consider using React Query for server state

**3. Virtualize Long Lists**
Use react-window or react-virtualized for lists with many items.

**4. Code Splitting**
Use React.lazy() and Suspense for route-based code splitting.

Would you like me to show specific examples for any of these?`,
    },
    // Session 1, Message 3 (user)
    {
      sessionId: SESSION_IDS.session1,
      messageId: MESSAGE_IDS.s1m3,
      sequence: 0,
      type: 'text_delta' as const,
      content:
        'Yes, can you show me how to properly use useMemo and useCallback?',
    },
    // Session 1, Message 4 (assistant)
    {
      sessionId: SESSION_IDS.session1,
      messageId: MESSAGE_IDS.s1m4,
      sequence: 0,
      type: 'text_delta' as const,
      content: `Here's how to use useMemo and useCallback effectively:

\`\`\`typescript
// useMemo - for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]); // Only recalculate when items change

// useCallback - for stable function references
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []); // Empty deps = function never changes

// Pass stable callback to child component
<ChildComponent onClick={handleClick} />
\`\`\`

**Key rules:**
- Only use useMemo for truly expensive operations
- useCallback is most useful when passing callbacks to optimized child components
- Always include all dependencies in the dependency array`,
    },
    // Session 2 events
    {
      sessionId: SESSION_IDS.session2,
      messageId: MESSAGE_IDS.s2m1,
      sequence: 0,
      type: 'text_delta' as const,
      content: 'What are the best practices for API versioning in a REST API?',
    },
    {
      sessionId: SESSION_IDS.session2,
      messageId: MESSAGE_IDS.s2m2,
      sequence: 0,
      type: 'text_delta' as const,
      content: `There are three main approaches to API versioning:

**1. URL Path Versioning (Recommended)**
\`\`\`
/api/v1/users
/api/v2/users
\`\`\`
- Most explicit and easy to understand
- Simple routing and documentation

**2. Header Versioning**
\`\`\`
Accept: application/vnd.myapi.v1+json
\`\`\`
- Cleaner URLs
- Harder to test in browser

**3. Query Parameter**
\`\`\`
/api/users?version=1
\`\`\`
- Easy to implement
- Can be accidentally omitted

**Best practices:**
- Support at least one version back
- Provide clear deprecation timelines
- Document breaking changes`,
    },
    // Session 3 events (code review)
    {
      sessionId: SESSION_IDS.session3,
      messageId: MESSAGE_IDS.s3m1,
      sequence: 0,
      type: 'text_delta' as const,
      content:
        'Can you review this authentication middleware for security issues?',
    },
    {
      sessionId: SESSION_IDS.session3,
      messageId: MESSAGE_IDS.s3m2,
      sequence: 0,
      type: 'tool_call' as const,
      toolCallId: 'tc_001',
      toolName: 'webSearch',
      toolArgs: { query: 'JWT authentication best practices 2025' },
    },
    {
      sessionId: SESSION_IDS.session3,
      messageId: MESSAGE_IDS.s3m2,
      sequence: 1,
      type: 'tool_result' as const,
      toolCallId: 'tc_001',
      toolResult: {
        results: [
          { title: 'OWASP JWT Guidelines', url: 'https://owasp.org/jwt' },
          { title: 'Auth0 Best Practices', url: 'https://auth0.com/docs' },
        ],
      },
      isError: false,
    },
    {
      sessionId: SESSION_IDS.session3,
      messageId: MESSAGE_IDS.s3m2,
      sequence: 2,
      type: 'text_delta' as const,
      content: `Based on current best practices, here's my review:

**Security Issues Found:**

1. **Token Storage** - Storing JWT in localStorage is vulnerable to XSS. Consider httpOnly cookies.

2. **Missing Token Rotation** - Implement refresh token rotation to limit impact of token theft.

3. **No Rate Limiting** - Add rate limiting to prevent brute force attacks.

**Recommendations:**
- Use short-lived access tokens (15 min)
- Implement refresh token rotation
- Add request signing for sensitive operations`,
    },
    {
      sessionId: SESSION_IDS.session3,
      messageId: MESSAGE_IDS.s3m3,
      sequence: 0,
      type: 'text_delta' as const,
      content: 'How should I implement the refresh token rotation?',
    },
    {
      sessionId: SESSION_IDS.session3,
      messageId: MESSAGE_IDS.s3m4,
      sequence: 0,
      type: 'text_delta' as const,
      content: `Here's a secure refresh token rotation implementation:

\`\`\`typescript
async function rotateRefreshToken(oldToken: string) {
  // 1. Validate and find token in database
  const tokenRecord = await db.refreshTokens.findOne({
    token: hashToken(oldToken),
    revoked: false
  });

  if (!tokenRecord) {
    // Potential token reuse attack - revoke all user tokens
    await db.refreshTokens.updateMany(
      { userId: tokenRecord?.userId },
      { revoked: true }
    );
    throw new Error('Invalid refresh token');
  }

  // 2. Generate new token pair
  const newAccessToken = generateAccessToken(tokenRecord.userId);
  const newRefreshToken = generateRefreshToken();

  // 3. Revoke old token and save new one
  await db.refreshTokens.update(
    { id: tokenRecord.id },
    { revoked: true }
  );

  await db.refreshTokens.create({
    userId: tokenRecord.userId,
    token: hashToken(newRefreshToken),
    expiresAt: addDays(new Date(), 30)
  });

  return { newAccessToken, newRefreshToken };
}
\`\`\``,
    },
  ];

  await db.insert(agentSessionEvents).values(demoEvents).onConflictDoNothing();
}

async function seedDemoArtifacts() {
  console.log('  Seeding demo artifacts...');

  const demoArtifacts = [
    {
      id: ARTIFACT_IDS.projectRequirements,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      sessionId: SESSION_IDS.session1,
      agentId: 'assistant-sonnet-4.5',
      title: 'Project Requirements Document',
      content: `# Website Redesign Requirements

## Overview
Complete redesign of the company website with focus on modern UI/UX and performance.

## Functional Requirements

### Homepage
- Hero section with animated background
- Feature cards with hover effects
- Customer testimonials carousel
- CTA buttons with conversion tracking

### Navigation
- Responsive hamburger menu for mobile
- Dropdown menus for desktop
- Search functionality
- User account dropdown

## Non-Functional Requirements
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- WCAG 2.1 AA compliance

## Timeline
- Phase 1: Design (2 weeks)
- Phase 2: Development (4 weeks)
- Phase 3: Testing (1 week)
- Phase 4: Launch (1 week)`,
      format: 'markdown' as const,
      summary:
        'Comprehensive requirements document for the website redesign project.',
      sizeBytes: 1024,
    },
    {
      id: ARTIFACT_IDS.apiDesign,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      sessionId: SESSION_IDS.session2,
      agentId: 'assistant-gpt-5',
      title: 'API Design Specification',
      content: `# API Design Specification

## Base URL
\`https://api.example.com/v1\`

## Authentication
All endpoints require Bearer token authentication.

## Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | List all users |
| POST | /users | Create user |
| GET | /users/:id | Get user by ID |
| PUT | /users/:id | Update user |
| DELETE | /users/:id | Delete user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List products |
| POST | /products | Create product |
| GET | /products/:id | Get product |

## Error Responses
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": []
  }
}
\`\`\``,
      format: 'markdown' as const,
      summary: 'OpenAPI-style specification for the REST API endpoints.',
      sizeBytes: 856,
    },
    {
      id: ARTIFACT_IDS.meetingNotes,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Sprint Planning Notes',
      content: `# Sprint Planning - Week 3

**Date:** ${new Date().toLocaleDateString()}
**Attendees:** Dev Team

## Completed Last Sprint
- Homepage mockups approved
- Navigation component built
- API schema finalized

## This Sprint Goals
1. Build homepage components
2. Implement authentication flow
3. Set up CI/CD pipeline

## Blockers
- Waiting for design assets for mobile views
- Need API keys for third-party integrations

## Action Items
- [ ] @john - Complete hero section by Wednesday
- [ ] @sarah - Set up staging environment
- [ ] @mike - Review authentication PR`,
      format: 'markdown' as const,
      summary: 'Sprint planning meeting notes with goals and action items.',
      sizeBytes: 642,
    },
    {
      id: ARTIFACT_IDS.codeReviewReport,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      sessionId: SESSION_IDS.session3,
      agentId: AGENT_IDS.codeReviewer,
      title: 'Authentication Code Review Report',
      content: `# Code Review Report: Authentication Module

## Summary
Reviewed authentication middleware and token management. Found 3 high-priority and 2 medium-priority issues.

## High Priority Issues

### 1. Insecure Token Storage
**Location:** \`src/auth/storage.ts:15\`
**Issue:** JWT stored in localStorage
**Fix:** Use httpOnly cookies with SameSite=Strict

### 2. Missing Rate Limiting
**Location:** \`src/auth/login.ts\`
**Issue:** No rate limiting on login endpoint
**Fix:** Add rate limiter (e.g., 5 attempts per minute)

### 3. No Token Refresh Rotation
**Location:** \`src/auth/refresh.ts\`
**Issue:** Same refresh token reused
**Fix:** Implement token rotation

## Medium Priority

### 4. Weak Password Requirements
### 5. Missing Audit Logging

## Recommendations
Implement all high-priority fixes before deployment.`,
      format: 'markdown' as const,
      summary: 'Security-focused code review of the authentication module.',
      sizeBytes: 890,
    },
    {
      id: ARTIFACT_IDS.techSpec,
      userId: DEMO_USER_ID,
      orgId: DEMO_ORG_ID,
      title: 'Technical Specification',
      content: `# Mobile App Technical Specification

## Tech Stack
- **Framework:** React Native with Expo
- **Language:** TypeScript
- **State Management:** Zustand
- **API Client:** TanStack Query
- **Local Storage:** SQLite via expo-sqlite

## Architecture

### Directory Structure
\`\`\`
src/
├── app/           # Navigation & screens
├── components/    # Shared components
├── features/      # Feature modules
├── hooks/         # Custom hooks
├── services/      # API services
├── stores/        # Zustand stores
└── utils/         # Utilities
\`\`\`

## Key Features

### Offline Support
- SQLite for local data persistence
- Background sync when online
- Conflict resolution strategy

### Push Notifications
- Firebase Cloud Messaging
- Deep linking support
- Notification preferences`,
      format: 'markdown' as const,
      summary:
        'Technical specification document for the mobile app architecture.',
      sizeBytes: 780,
    },
  ];

  await db.insert(artifacts).values(demoArtifacts).onConflictDoNothing();
}

async function seedDemoTaskArtifacts() {
  console.log('  Seeding demo task-artifact links...');

  const demoTaskArtifacts = [
    {
      taskId: TASK_IDS.designMockups,
      artifactId: ARTIFACT_IDS.projectRequirements,
    },
    {
      taskId: TASK_IDS.designSchema,
      artifactId: ARTIFACT_IDS.apiDesign,
    },
    {
      taskId: TASK_IDS.authFlow,
      artifactId: ARTIFACT_IDS.codeReviewReport,
    },
    {
      taskId: TASK_IDS.setupProject,
      artifactId: ARTIFACT_IDS.techSpec,
    },
  ];

  await db
    .insert(taskArtifacts)
    .values(demoTaskArtifacts)
    .onConflictDoNothing();
}

// ============================================================================
// Main Export
// ============================================================================

export async function seedDemoData() {
  console.log('Seeding demo data...');

  // Order matters due to foreign key relationships
  await seedDemoProjects();
  await seedDemoTasks();
  await seedDemoAgents();
  await seedDemoSkills();
  await seedDemoSessions();
  await seedDemoMessages();
  await seedDemoEvents();
  await seedDemoArtifacts();
  await seedDemoTaskArtifacts();

  console.log('Demo data seeding complete');
}
