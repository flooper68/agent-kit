# Multi-Agent System Implementation Plan

## Philosophy

Each phase delivers a **working system** with concrete use cases you can test end-to-end. Later phases extend rather than rewrite. Complexity grows gradually — you can stop at any phase and have something useful.

---

## Core Concepts

### Task

The fundamental unit of work. Everything flows from tasks.

```typescript
interface Task {
  id: string;
  mode: 'conversation' | 'task' | 'hybrid';
  status: 'pending' | 'running' | 'awaiting_interaction' | 'completed' | 'failed' | 'canceled';

  // Hierarchy
  parent_id?: string;
  subtasks: string[];

  // Definition
  goal: string;
  trigger: Trigger;

  // Output
  result?: Artifact;
  summary?: string;

  // Full trace
  events: Event[];
  interactions: Interaction[];

  // Configuration
  visibility: VisibilitySettings;
  policies: PolicySet;
}
```

### Event

Append-only log of everything that happens. Enables replay, debugging, auditing.

```typescript
interface Event {
  id: string;
  task_id: string;
  timestamp: DateTime;
  type: 'started' | 'progress' | 'tool_call' | 'tool_result' | 'message' |
        'state_change' | 'subtask_spawned' | 'subtask_completed' |
        'interaction_requested' | 'interaction_resolved' | 'completed' | 'failed';
  payload: any;
  agent_id: string;
}
```

### Session

Container for execution context. Can be per-task or shared.

```typescript
interface Session {
  id: string;
  task_id: string;

  // Context
  messages: Message[];
  state: Record<string, any>;      // mutable shared state (for workflows)

  // Linking
  parent_session_id?: string;
  child_session_ids: string[];
}
```

### Agent

The executor. Can be LLM-powered or workflow-based.

```typescript
interface Agent {
  id: string;
  type: 'llm' | 'sequential' | 'parallel' | 'loop' | 'custom';

  // Capabilities
  tools: Tool[];
  permissions: Permission[];

  // For orchestrator agents
  subagents?: Agent[];

  // Identity (for A2A)
  card?: AgentCard;
}
```

### Interaction

Any point where an agent needs input — approvals, clarifications, decisions, errors.

```typescript
interface Interaction {
  id: string;
  task_id: string;
  originated_from: TaskId;        // which subtask raised it

  type: 'approval' | 'clarification' | 'decision' | 'error' | 'checkpoint';
  status: 'pending' | 'resolved' | 'timeout' | 'escalated';

  // Content
  prompt: string;
  options?: Option[];
  context?: string;

  // Resolution
  response?: any;
  resolved_by?: 'self' | 'parent' | 'user' | AgentId;
  resolved_at?: DateTime;
  justification?: string;

  // Routing metadata
  routing: RoutingInfo;

  // Agent's assessment
  metadata: {
    risk: 'low' | 'medium' | 'high';
    reversible: boolean;
    category: string;
    requires_user_intent: boolean;
    confidence: number;
  };
}
```

### Trigger

What initiates a task.

```typescript
type Trigger =
  | { type: 'user_message'; channel: string; content: string }
  | { type: 'schedule'; cron: string; schedule_id: string }
  | { type: 'webhook'; source: string; payload: any }
  | { type: 'agent'; parent_task_id: string; agent_id: string }
  | { type: 'event'; event_type: string; event_id: string }
  | { type: 'approval_response'; interaction_id: string };
```

### Artifact

Output produced by tasks.

```typescript
interface Artifact {
  id: string;
  task_id: string;
  type: 'file' | 'code' | 'report' | 'data' | 'link' | 'message';
  content: any;
  metadata: Record<string, any>;
}
```

---

## Strategy/Policy Systems

### Approval Strategy

```typescript
type ApprovalStrategy =
  | { type: 'auto' }                                              // no human needed
  | { type: 'notify' }                                            // inform, don't block
  | { type: 'timeout'; duration: Duration; fallback: Fallback }   // wait then fallback
  | { type: 'require' }                                           // block until resolved
  | { type: 'escalate'; chain: Target[]; timeout_per_level: Duration }
  | { type: 'batch'; window: Duration };                          // collect and approve together
```

### Decision Strategy

```typescript
interface DecisionStrategy {
  authority: 'self' | 'parent' | 'user' | 'cascade';
  fallback: 'fail' | 'escalate' | 'default' | 'infer' | 'defer';
  constraints?: {
    must_match_options?: boolean;
    requires_justification?: boolean;
    reversible?: boolean;
  };
  timeout?: Duration;
}
```

### Routing Strategy

```typescript
type RoutingStrategy =
  | { type: 'self' }
  | { type: 'parent' }
  | { type: 'root' }
  | { type: 'user' }
  | { type: 'cascade'; chain: Target[] }
  | { type: 'delegate'; to: AgentId }
  | { type: 'broadcast'; to: Target[] }
  | { type: 'quorum'; targets: Target[]; min: number };
```

### Presentation Strategy

```typescript
type PresentationStrategy =
  | 'buttons'          // [Yes] [No] [Maybe]
  | 'select'           // dropdown for many options
  | 'input'            // free text
  | 'diff'             // before/after comparison
  | 'full_context'     // show reasoning and implications
  | 'conversational';  // open thread for discussion
```

### Visibility Settings

```typescript
interface VisibilitySettings {
  progress: 'hidden' | 'summary' | 'streaming';
  reasoning: 'hidden' | 'on_demand' | 'visible';
  clarifications: 'inline' | 'interrupt' | 'block';
  approvals: 'auto' | 'batched' | 'immediate';
}
```

### Permission Model

```typescript
interface Permission {
  resource: string;           // glob pattern: "/src/**", "database:*"
  actions: string[];          // ["read", "write", "delete"]
  scope: 'task' | 'session' | 'permanent';
  granted_by?: string;
  expires_at?: DateTime;
}

interface PermissionPolicy {
  inherit_from_parent: boolean;
  default_permissions: Permission[];
  require_approval_for: string[];    // actions that need approval
  auto_approve: string[];            // actions that don't
}
```

---

## Risk Assessment

### Risk Model

```typescript
interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  reversible: boolean;
  affects: string[];              // ['production', 'database', 'billing']
  blast_radius: 'local' | 'task' | 'system' | 'external';
}

interface RiskRule {
  match: MatchCriteria;
  risk: RiskAssessment;
}
```

---

## Workflow Concepts

### Workflow Types

```typescript
type WorkflowAgent =
  | { type: 'sequential'; steps: Agent[] }
  | { type: 'parallel'; branches: Agent[]; join: 'all' | 'any' | 'n_of_m' }
  | { type: 'loop'; body: Agent; condition: Condition; max_iterations?: number }
  | { type: 'conditional'; branches: ConditionalBranch[] };
```

### Checkpoints

```typescript
interface Checkpoint {
  name: string;
  type: 'approval' | 'review' | 'inform';
  trigger: 'before_step' | 'after_step' | 'on_condition';
  condition?: Condition;
  presentation: PresentationStrategy;
}
```

---

## Multi-Agent Communication

### Session Models

| Model | Description |
|-------|-------------|
| **Single session** | All agents share one context, state mutations visible to all |
| **Linked sessions** | Separate sessions per agent, connected via task references |
| **Hybrid** | Separate sessions with summarized handoffs |

### Agent Card (A2A)

```typescript
interface AgentCard {
  name: string;
  description: string;
  capabilities: string[];
  authentication: AuthMethod;
  scopes_required: string[];
  endpoint?: string;
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Triggers                                │
│         User │ Cron │ Webhook │ Agent │ Event                   │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Task Manager                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Create  │ │ Execute │ │ Monitor │ │ Complete│               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Executor                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  LLM Agent   │  │   Workflow   │  │   Custom     │          │
│  │              │  │   Agent      │  │   Agent      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Interaction Router                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  Risk   │ │ Policy  │ │ Routing │ │ Present │               │
│  │ Assess  │ │ Match   │ │ Decide  │ │ Format  │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└──────────────┬──────────────────────────────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│    Self     │ │   Surface   │
│   Resolve   │ │   to User   │
└─────────────┘ └──────┬──────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │  Slack  │  │   Web   │  │   API   │
    └─────────┘  └─────────┘  └─────────┘
```

---

## Feature Requirements Summary

### Task Management
- [ ] Create, read, update, cancel tasks
- [ ] Hierarchical task relationships (parent/child)
- [ ] Task status lifecycle and state machine
- [ ] Multiple trigger types (user, cron, webhook, agent, event)
- [ ] Task templates/definitions for reusable patterns

### Session & State
- [ ] Session creation and management
- [ ] Shared mutable state for workflow agents
- [ ] Session linking across task hierarchy
- [ ] Context window management
- [ ] Session persistence and resumability

### Event System
- [ ] Append-only event log per task
- [ ] Event sourcing — derive state from events
- [ ] Event streaming for real-time updates
- [ ] Event replay for debugging
- [ ] Event filtering and querying

### Interaction System
- [ ] Unified interaction model (approvals, clarifications, decisions, errors)
- [ ] Strategy-based routing (self, parent, user, cascade)
- [ ] Risk assessment integration
- [ ] Timeout handling with configurable fallbacks
- [ ] Batching for high-volume interactions
- [ ] Escalation chains

### Policy Engine
- [ ] Approval policies with matching rules
- [ ] Decision policies with authority chains
- [ ] Routing policies
- [ ] Presentation policies
- [ ] Risk rules and automatic assessment
- [ ] Policy inheritance and override

### Permission System
- [ ] Per-agent permission definitions
- [ ] Permission inheritance options
- [ ] Runtime permission requests
- [ ] Scoped/temporary permissions
- [ ] Permission audit trail

### Agent Orchestration
- [ ] LLM agent support
- [ ] Workflow agents (sequential, parallel, loop)
- [ ] Custom agent types
- [ ] Agent composition and nesting
- [ ] Agent capability declaration

### Visibility & UX
- [ ] Configurable visibility levels
- [ ] Progress streaming
- [ ] Summary generation
- [ ] Result/artifact presentation
- [ ] Drill-down from summary to full trace

### User Interface Requirements
- [ ] Task list view (all triggers unified)
- [ ] Task detail view (result + summary)
- [ ] Interaction inbox (pending approvals/clarifications)
- [ ] Event timeline (expandable detail)
- [ ] Subtask navigation (linked but not cluttered)

### Slack Integration
- [ ] Task notifications
- [ ] Interaction buttons (approve/reject/options)
- [ ] Thread-based mini-conversations
- [ ] Status updates
- [ ] Deep links to web UI

### Web UI
- [ ] Full conversation mode
- [ ] Task management dashboard
- [ ] Event log explorer
- [ ] Policy configuration
- [ ] Agent configuration

### API Requirements
- [ ] Task CRUD
- [ ] Event streaming (WebSocket/SSE)
- [ ] Interaction resolution endpoint
- [ ] Policy management
- [ ] Agent registration (A2A compatible)

### Observability
- [ ] Full event audit trail
- [ ] Interaction resolution logging
- [ ] Permission grant/deny logging
- [ ] Performance metrics (task duration, interaction wait times)
- [ ] Error tracking and alerting

### Reliability
- [ ] Task resumability after failures
- [ ] Checkpoint/restart support
- [ ] Idempotent operations
- [ ] Graceful degradation when user unavailable

---

## Implementation Phases

### Phase 1: Single Agent Task Execution

**Goal:** One agent, triggered manually, executes tasks and reports results via Slack.

#### Data Model

```typescript
interface Task {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  trigger: { type: 'manual'; user_id: string };
  goal: string;
  result?: string;
  error?: string;
  events: Event[];
  created_at: DateTime;
  updated_at: DateTime;
}

interface Event {
  id: string;
  task_id: string;
  timestamp: DateTime;
  type: 'started' | 'progress' | 'completed' | 'failed';
  message: string;
}
```

#### Components to Build

1. **Task Store** — CRUD for tasks (start with SQLite or Postgres)
2. **Agent Executor** — Wraps Claude Code SDK, runs task, emits events
3. **Slack Bot** — Receives commands, posts updates
4. **Event Logger** — Appends events to task

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 1.1 | Trigger task from Slack | `/agent run "list files in /src"` → task created, status posted |
| 1.2 | See task progress | Agent emits progress events → Slack updates message |
| 1.3 | Get task result | Task completes → result posted to Slack |
| 1.4 | Handle failure | Agent throws error → failure posted with error message |
| 1.5 | List recent tasks | `/agent list` → shows last 5 tasks with status |
| 1.6 | Get task details | `/agent status <id>` → shows full event log |

#### Slack UX

```
You: /agent run "check for npm vulnerabilities"

Agent: 🚀 Task #1 started: check for npm vulnerabilities
       Status: Running...

Agent: ✅ Task #1 completed
       Found 2 low-severity vulnerabilities in devDependencies.
       [View details]
```

#### Definition of Done

- [ ] Can trigger task from Slack
- [ ] Can see real-time status updates
- [ ] Can view completed result
- [ ] Events persisted and queryable
- [ ] Errors handled gracefully

---

### Phase 2: Approvals (Human-in-the-Loop)

**Goal:** Agent can request approval before dangerous operations. User approves/rejects via Slack.

#### Data Model Extensions

```typescript
interface Task {
  // ... existing fields
  status: 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed';
  interactions: Interaction[];
}

interface Interaction {
  id: string;
  task_id: string;
  type: 'approval';
  status: 'pending' | 'approved' | 'rejected';
  prompt: string;
  context?: string;
  options: ['approve', 'reject'];
  response?: 'approved' | 'rejected';
  resolved_at?: DateTime;
}

interface ApprovalPolicy {
  action_pattern: string;      // glob: "file:write:*", "npm:*"
  strategy: 'auto' | 'require';
}
```

#### Components to Build

1. **Interaction Store** — CRUD for interactions
2. **Approval Checker** — Intercepts tool calls, checks policy, creates interaction if needed
3. **Slack Interaction Handler** — Renders buttons, handles callbacks
4. **Task Resumption** — Resumes agent after approval

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 2.1 | Auto-approve safe actions | Agent reads file → no approval needed, proceeds |
| 2.2 | Require approval for writes | Agent wants to write file → approval requested |
| 2.3 | Approve via Slack | Click [Approve] → agent continues |
| 2.4 | Reject via Slack | Click [Reject] → task fails with rejection reason |
| 2.5 | Multiple approvals in one task | Agent needs 2 approvals → each surfaced sequentially |
| 2.6 | Approval timeout | No response in 30m → task fails (configurable) |

#### Slack UX

```
Agent: ⏸ Task #2 needs approval

       Action: Write to /src/config.ts
       Context: Updating API endpoint configuration

       [Approve] [Reject]

You: [clicks Approve]

Agent: ✅ Approved. Continuing task #2...
```

#### Definition of Done

- [ ] Policy engine matches actions to strategies
- [ ] Approval requests surface in Slack with context
- [ ] Approve/reject buttons work
- [ ] Agent resumes correctly after approval
- [ ] Timeout handling works
- [ ] Rejection stops task cleanly

---

### Phase 3: Clarifications & Decisions

**Goal:** Agent can ask clarifying questions. User responds via buttons or text.

#### Data Model Extensions

```typescript
interface Interaction {
  // ... existing fields
  type: 'approval' | 'clarification' | 'decision';
  options?: Option[];           // for decision/clarification with choices
  free_text_allowed: boolean;   // can user type custom response
  response?: string;            // the actual answer
}

interface Option {
  value: string;
  label: string;
  description?: string;
}
```

#### Components to Build

1. **Clarification Handler** — Agent can emit clarification requests
2. **Option Renderer** — Slack buttons/select menus for options
3. **Free Text Handler** — Slack thread replies for open-ended responses
4. **Response Injector** — Feeds response back into agent context

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 3.1 | Binary clarification | "Run tests: unit or integration?" → [Unit] [Integration] |
| 3.2 | Multi-option decision | "Which environment?" → [dev] [staging] [prod] |
| 3.3 | Free text clarification | "What should the commit message be?" → user types in thread |
| 3.4 | Clarification with default | No response in 5m → use default option |
| 3.5 | Follow-up clarification | Agent asks second question based on first answer |

#### Slack UX

```
Agent: ❓ Task #3 needs input

       Which database should I run migrations on?

       [dev-db] [staging-db] [prod-db]

       Or reply in thread with a custom value.

You: [clicks staging-db]

Agent: Got it, using staging-db. Continuing...
```

#### Definition of Done

- [ ] Clarifications render correctly in Slack
- [ ] Button responses work
- [ ] Thread replies captured as responses
- [ ] Default/timeout behavior works
- [ ] Agent context updated with response

---

### Phase 4: Multiple Triggers

**Goal:** Tasks can be triggered by cron schedules and webhooks, not just manual commands.

#### Data Model Extensions

```typescript
type Trigger =
  | { type: 'manual'; user_id: string; channel: string }
  | { type: 'schedule'; schedule_id: string; cron: string }
  | { type: 'webhook'; source: string; payload: any };

interface Schedule {
  id: string;
  name: string;
  cron: string;
  task_template: TaskTemplate;
  enabled: boolean;
  last_run?: DateTime;
  next_run: DateTime;
}

interface TaskTemplate {
  goal: string;
  agent_id?: string;
  policies?: PolicySet;
}
```

#### Components to Build

1. **Scheduler** — Cron-based task triggering (node-cron or similar)
2. **Webhook Endpoint** — HTTP endpoint that creates tasks
3. **Schedule Manager** — CRUD for schedules via Slack
4. **Trigger Normalizer** — Unified handling regardless of trigger source

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 4.1 | Create scheduled task | `/agent schedule "0 9 * * MON" "weekly security scan"` |
| 4.2 | Scheduled task runs | Monday 9am → task auto-created and executed |
| 4.3 | Scheduled task with approval | Scheduled task hits approval → Slack notification |
| 4.4 | Webhook triggers task | POST /webhook/github → task created from PR event |
| 4.5 | List schedules | `/agent schedules` → shows all scheduled tasks |
| 4.6 | Disable schedule | `/agent schedule disable <id>` |

#### Slack UX

```
[9:00 AM Monday]
Agent: 🕐 Scheduled task started: Weekly security scan
       Trigger: weekly-security (cron)

       [View details]

Agent: ⏸ Task #10 needs approval
       ... (same approval flow as manual tasks)
```

#### Definition of Done

- [ ] Schedules persist and survive restarts
- [ ] Cron triggers tasks at correct times
- [ ] Webhooks create tasks with payload context
- [ ] All trigger types flow through same execution path
- [ ] Scheduled tasks can require approval

---

### Phase 5: Subtasks (Hierarchical Tasks)

**Goal:** Tasks can spawn subtasks. Parent waits for children. Simple sequential orchestration.

#### Data Model Extensions

```typescript
interface Task {
  // ... existing fields
  parent_id?: string;
  subtask_ids: string[];
  depth: number;              // 0 = root, 1 = child, etc.
}

interface Event {
  // ... existing fields
  type: 'started' | 'progress' | 'completed' | 'failed' |
        'subtask_spawned' | 'subtask_completed' | 'subtask_failed';
  subtask_id?: string;
}
```

#### Components to Build

1. **Subtask Spawner** — Agent can create child tasks
2. **Parent-Child Linker** — Bidirectional references
3. **Completion Waiter** — Parent blocks until child completes
4. **Result Propagator** — Child result available to parent

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 5.1 | Spawn single subtask | Parent spawns child → child runs → parent continues |
| 5.2 | Access subtask result | Parent uses child's output in subsequent work |
| 5.3 | Subtask failure | Child fails → parent can handle or fail |
| 5.4 | Nested subtasks | Child spawns grandchild → all complete in order |
| 5.5 | View task hierarchy | `/agent status <id>` shows tree of subtasks |
| 5.6 | Subtask approval | Child needs approval → surfaces to user |

#### Slack UX

```
Agent: 🚀 Task #15 started: Deploy application
       └── Subtask #16: Run tests

Agent: ✅ Subtask #16 completed: All tests pass

Agent: 🚀 Task #15 continuing
       └── Subtask #17: Build docker image

Agent: ✅ Task #15 completed
       Deployed version 2.3.1 to staging

       [View subtasks]
```

#### Definition of Done

- [ ] Tasks can spawn subtasks
- [ ] Parent waits for child completion
- [ ] Child results available to parent
- [ ] Failure propagation works
- [ ] UI shows hierarchy
- [ ] Approvals bubble up correctly

---

### Phase 6: Interaction Routing & Bubbling

**Goal:** Interactions from subtasks can be resolved by parent agent or bubbled to user based on policy.

#### Data Model Extensions

```typescript
interface Interaction {
  // ... existing fields
  originated_from: string;      // task_id where interaction was raised
  surfaced_at: string;          // task_id where it's being handled
  routing: {
    strategy: 'self' | 'parent' | 'user' | 'cascade';
    cascade_path?: string[];    // [subtask, parent, root, user]
    resolved_by?: 'self' | 'parent' | 'user';
  };
  metadata: {
    risk: 'low' | 'medium' | 'high';
    requires_user_intent: boolean;
    context_sufficient: boolean;
  };
}

interface RoutingPolicy {
  match: {
    type?: InteractionType[];
    risk?: RiskLevel[];
    category?: string[];
  };
  strategy: RoutingStrategy;
  fallback: 'fail' | 'bubble' | 'default';
  timeout?: Duration;
}
```

#### Components to Build

1. **Routing Engine** — Evaluates policies, decides where interaction goes
2. **Parent Resolution** — Parent agent attempts to answer child's question
3. **Bubble Mechanism** — Escalates to next level if unresolved
4. **Resolution Propagator** — Sends answer back down to originating task

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 6.1 | Parent resolves clarification | Child asks "which format?" → Parent knows from context → resolved |
| 6.2 | Parent can't resolve, bubbles | Child asks "which environment?" → Parent doesn't know → user asked |
| 6.3 | User intent required | Child asks "delete this?" → Always bubbles regardless of parent |
| 6.4 | Cascade timeout | Parent doesn't respond in 2m → auto-bubbles to user |
| 6.5 | Resolution flows back | User answers → response propagates to waiting subtask |
| 6.6 | Audit trail | Can see: asked at subtask → bubbled to root → user answered |

#### Slack UX

```
Agent: ❓ Task #20 needs input

       Task: Deploy application
       From: Subtask "Configure environment"

       Which AWS region should I use?
       (Parent task couldn't determine from context)

       [us-east-1] [eu-west-1] [ap-southeast-1]
```

#### Definition of Done

- [ ] Routing policies configurable
- [ ] Parent agent can resolve child interactions
- [ ] Unresolved interactions bubble up
- [ ] User sees origin context when bubbled
- [ ] Responses propagate back correctly
- [ ] Full audit trail of routing decisions

---

### Phase 7: Workflow Agents

**Goal:** Define deterministic workflows (sequential, parallel) that orchestrate multiple agents.

#### Data Model Extensions

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  type: 'sequential' | 'parallel' | 'conditional';
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  agent_id?: string;           // which agent runs this step
  task_template: TaskTemplate;

  // For conditional workflows
  condition?: string;          // expression to evaluate

  // For checkpoints
  checkpoint?: {
    type: 'approval' | 'review';
    presentation: 'summary' | 'diff' | 'full';
  };
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  task_id: string;             // root task for this execution
  current_step: string;
  step_results: Map<string, any>;
  status: 'running' | 'paused' | 'completed' | 'failed';
}
```

#### Components to Build

1. **Workflow Parser** — Validates and stores workflow definitions
2. **Sequential Executor** — Runs steps in order
3. **Parallel Executor** — Runs steps concurrently, waits for all
4. **Checkpoint Handler** — Pauses workflow for review/approval
5. **Workflow State Manager** — Tracks progress, enables resume

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 7.1 | Define sequential workflow | Create: test → build → deploy |
| 7.2 | Run sequential workflow | Each step runs in order, uses previous results |
| 7.3 | Workflow checkpoint | After "build" step, pause for approval before deploy |
| 7.4 | Define parallel workflow | Create: run unit tests + integration tests in parallel |
| 7.5 | Run parallel workflow | Both branches run, workflow continues when both done |
| 7.6 | Partial failure | One parallel branch fails → configurable: fail all or continue |
| 7.7 | Resume workflow | System restarts → workflow resumes from last checkpoint |

#### Slack UX

```
You: /agent workflow run deploy-pipeline

Agent: 🔄 Workflow "deploy-pipeline" started

       Step 1/4: Run tests ✅
       Step 2/4: Build image ✅
       Step 3/4: Review changes ⏸ [Awaiting approval]
       Step 4/4: Deploy [Pending]

       Changes to deploy:
       • Updated auth module
       • Added rate limiting

       [Approve & Continue] [View diff] [Cancel]
```

#### Definition of Done

- [ ] Can define workflows via config/API
- [ ] Sequential execution works
- [ ] Parallel execution works
- [ ] Checkpoints pause workflow
- [ ] State persists for resume
- [ ] Step results available to subsequent steps

---

### Phase 8: Visibility & Presentation Modes

**Goal:** Users can choose how much detail they see. Tasks have configurable verbosity.

#### Data Model Extensions

```typescript
interface VisibilitySettings {
  progress: 'hidden' | 'summary' | 'streaming';
  reasoning: 'hidden' | 'on_demand' | 'visible';
  subtasks: 'hidden' | 'summary' | 'expanded';
  interactions: 'immediate' | 'batched';
}

interface VisibilityPreset {
  id: string;
  name: string;
  settings: VisibilitySettings;
}

// Built-in presets
const PRESETS = {
  silent: { progress: 'hidden', reasoning: 'hidden', subtasks: 'hidden' },
  minimal: { progress: 'summary', reasoning: 'hidden', subtasks: 'summary' },
  normal: { progress: 'summary', reasoning: 'on_demand', subtasks: 'summary' },
  verbose: { progress: 'streaming', reasoning: 'visible', subtasks: 'expanded' },
};
```

#### Components to Build

1. **Visibility Controller** — Filters events based on settings
2. **Summary Generator** — Condenses verbose output to summaries
3. **Batch Collector** — Groups interactions for batched presentation
4. **Drill-Down Handler** — Expands details on demand

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 8.1 | Silent mode | Task runs, only final result posted |
| 8.2 | Minimal mode | Start + end + errors only |
| 8.3 | Normal mode | Progress summaries, details on request |
| 8.4 | Verbose mode | Full streaming output |
| 8.5 | Expand details | Click "View details" → see full event log |
| 8.6 | Batched interactions | 5 approvals collected → single message with "Approve all" |
| 8.7 | Per-task override | `/agent run --verbose "complex task"` |

#### Slack UX

**Silent:**
```
Agent: ✅ Task #30 completed: Dependencies updated
       [View details]
```

**Verbose:**
```
Agent: 🚀 Task #30 started: Update dependencies
Agent: 📋 Checking npm audit...
Agent: 📋 Found 3 outdated packages
Agent: 📋 Updating react...
Agent: 📋 Updating typescript...
Agent: 📋 Updating vite...
Agent: 📋 Running tests...
Agent: ✅ Task #30 completed
       Updated 3 packages, all tests pass.
```

#### Definition of Done

- [ ] Presets configurable
- [ ] Visibility affects Slack output
- [ ] Summaries generated for condensed modes
- [ ] Drill-down reveals full details
- [ ] Batching works for interactions
- [ ] Per-task override works

---

### Phase 9: Advanced Policies & Risk Assessment

**Goal:** Sophisticated policy engine with automatic risk assessment and complex routing rules.

#### Data Model Extensions

```typescript
interface Policy {
  id: string;
  name: string;
  priority: number;            // lower = higher priority

  match: {
    trigger_type?: TriggerType[];
    agent_id?: string[];
    action_pattern?: string;
    resource_pattern?: string;
    risk_level?: RiskLevel[];
    task_depth?: { min?: number; max?: number };
    time_range?: { start: string; end: string };  // "09:00-17:00"
  };

  actions: {
    approval?: ApprovalStrategy;
    routing?: RoutingStrategy;
    visibility?: VisibilitySettings;
    permissions?: Permission[];
  };
}

interface RiskRule {
  match: {
    action?: string;
    resource_pattern?: string;
    affects?: string[];
  };
  risk: RiskLevel;
  reversible: boolean;
  justification: string;
}
```

#### Components to Build

1. **Policy Matcher** — Evaluates policies in priority order
2. **Risk Assessor** — Automatically tags interactions with risk level
3. **Time-Based Rules** — Different policies for business hours vs. off-hours
4. **Policy Simulator** — Test what policy would apply to hypothetical action

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 9.1 | Risk auto-assessment | Delete production file → auto-tagged as high risk |
| 9.2 | Time-based policy | Deploy during business hours → approval required; after hours → blocked |
| 9.3 | Trigger-based policy | Cron tasks → stricter approval than manual |
| 9.4 | Compound matching | High risk + production + off-hours → escalate to on-call |
| 9.5 | Policy simulation | `/agent policy-check "delete /prod/db"` → shows what would happen |
| 9.6 | Policy override | Admin can override policy for specific task |

#### Slack UX

```
Agent: 🔴 High-risk action detected

       Task: #40 Database cleanup
       Action: DROP TABLE users_backup
       Risk: HIGH (destructive, affects production)

       Policy "prod-protection" requires:
       • Explicit approval
       • 2-hour delay before execution

       [Approve with delay] [Reject] [Override (admin)]
```

#### Definition of Done

- [ ] Policy matching works with priorities
- [ ] Risk auto-assessment accurate
- [ ] Time-based rules work
- [ ] Complex compound rules work
- [ ] Policy simulation available
- [ ] Override mechanism with audit trail

---

### Phase 10: Multi-Agent & A2A Compatibility

**Goal:** Support multiple specialized agents that can delegate to each other. A2A protocol compatibility.

#### Data Model Extensions

```typescript
interface Agent {
  id: string;
  name: string;
  type: 'llm' | 'workflow' | 'remote';

  // For LLM agents
  model?: string;
  system_prompt?: string;
  tools?: Tool[];

  // For remote agents (A2A)
  endpoint?: string;
  card?: AgentCard;

  // Capabilities
  capabilities: string[];
  permissions: Permission[];
}

interface AgentCard {
  name: string;
  description: string;
  capabilities: string[];
  skills: Skill[];
  authentication: AuthMethod;
  endpoint: string;
}

interface Delegation {
  id: string;
  from_task_id: string;
  to_agent_id: string;
  child_task_id: string;
  status: 'pending' | 'accepted' | 'completed' | 'failed';
}
```

#### Components to Build

1. **Agent Registry** — Manages available agents and their capabilities
2. **Capability Matcher** — Finds best agent for a task
3. **A2A Client** — Sends tasks to remote agents, handles SSE responses
4. **A2A Server** — Exposes local agents via A2A protocol
5. **Delegation Manager** — Tracks cross-agent task delegation

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 10.1 | Register agent | Add new agent with capabilities to registry |
| 10.2 | Capability-based routing | "Research X" → routed to research-agent |
| 10.3 | Local agent delegation | Orchestrator delegates to local code-agent |
| 10.4 | Remote agent delegation | Orchestrator delegates to remote A2A agent |
| 10.5 | A2A task lifecycle | Send task → receive SSE events → get result |
| 10.6 | Remote agent approval | Remote agent needs approval → bubbles through A2A |
| 10.7 | Agent discovery | Query agent card → see capabilities |

#### Slack UX

```
Agent: 🚀 Task #50 started: Research and implement caching

       Orchestrator delegating to specialized agents:
       └── 🔍 research-agent: Investigating caching strategies
       └── ⏳ code-agent: Waiting for research

Agent: 🔍 research-agent completed
       Recommendation: Use Redis with 5-minute TTL

       └── 💻 code-agent: Implementing caching layer

Agent: ✅ Task #50 completed
       Implemented Redis caching per research recommendations.

       [View research] [View code changes]
```

#### Definition of Done

- [ ] Agent registry works
- [ ] Local delegation works
- [ ] A2A client can send tasks and receive events
- [ ] A2A server exposes agents correctly
- [ ] Interactions route across agent boundaries
- [ ] Agent cards queryable

---

### Phase 11: Web UI

**Goal:** Full web interface for task management, monitoring, and configuration.

#### Pages to Build

1. **Dashboard** — Active tasks, recent completions, pending interactions
2. **Task List** — Filterable list of all tasks
3. **Task Detail** — Full event log, subtask tree, interactions
4. **Interaction Inbox** — All pending approvals/clarifications
5. **Workflow Editor** — Visual workflow builder
6. **Policy Manager** — CRUD for policies
7. **Agent Manager** — CRUD for agents
8. **Schedule Manager** — CRUD for schedules

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 11.1 | View dashboard | See active tasks, pending count, recent activity |
| 11.2 | Filter tasks | Filter by status, trigger, agent, date range |
| 11.3 | Task drill-down | Click task → see full timeline with expandable events |
| 11.4 | Approve via web | Resolve interaction from web UI |
| 11.5 | Create workflow | Visual builder → save → run |
| 11.6 | Edit policy | Change approval strategy → see effect immediately |
| 11.7 | Real-time updates | Task progresses → UI updates without refresh |

#### Definition of Done

- [ ] All pages functional
- [ ] Real-time updates via WebSocket
- [ ] Mobile-responsive
- [ ] Matches Slack functionality
- [ ] Deep links from Slack work

---

### Phase 12: Observability & Reliability

**Goal:** Production-ready system with monitoring, alerting, and reliability features.

#### Components to Build

1. **Metrics Collector** — Task duration, success rate, interaction wait time
2. **Alert Manager** — Notify on failures, stuck tasks, SLA breaches
3. **Checkpoint System** — Automatic state persistence for resume
4. **Retry Handler** — Configurable retry for transient failures
5. **Dead Letter Queue** — Capture failed tasks for investigation
6. **Audit Log** — Immutable record of all actions

#### Use Cases to Test

| # | Use Case | Test |
|---|----------|------|
| 12.1 | Task metrics | Dashboard shows avg duration, success rate |
| 12.2 | Stuck task alert | Task running >1 hour → alert fired |
| 12.3 | Failure alert | 3 consecutive failures → alert fired |
| 12.4 | Resume after crash | Kill process → restart → tasks resume |
| 12.5 | Retry transient failure | API timeout → auto-retry 3x → succeed |
| 12.6 | Audit query | "Show all production deploys last week" → results |
| 12.7 | SLA tracking | "95% of tasks complete <5min" → report |

#### Definition of Done

- [ ] Key metrics tracked
- [ ] Alerts configurable and firing
- [ ] Tasks survive process restart
- [ ] Retries work correctly
- [ ] Full audit trail queryable
- [ ] SLA reporting available

---

## Phase Dependencies

```
Phase 1: Single Agent          (foundation)
    │
    ▼
Phase 2: Approvals             (human-in-loop)
    │
    ▼
Phase 3: Clarifications        (richer interactions)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 4: Triggers      Phase 5: Subtasks
    │                  │
    └────────┬─────────┘
             ▼
Phase 6: Interaction Routing   (policy-based bubbling)
    │
    ▼
Phase 7: Workflows             (deterministic orchestration)
    │
    ▼
Phase 8: Visibility            (UX polish)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 9: Policies      Phase 10: Multi-Agent
    │                  │
    └────────┬─────────┘
             ▼
Phase 11: Web UI               (full interface)
    │
    ▼
Phase 12: Observability        (production-ready)
```

---

## Recommended Stopping Points

| After Phase | You Have |
|-------------|----------|
| 2 | Useful single-agent with safety controls |
| 4 | Automated tasks with scheduling |
| 6 | Hierarchical tasks with smart routing |
| 8 | Polished UX with visibility controls |
| 10 | Full multi-agent system |
| 12 | Production-ready platform |