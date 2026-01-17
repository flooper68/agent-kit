# Task Management

Best practices for creating and managing tasks.

## Task Creation Best Practices

### Clear Titles

Titles should describe **what** needs to be done:

| Good                           | Bad      |
| ------------------------------ | -------- |
| "Implement user login form"    | "Login"  |
| "Fix null pointer in checkout" | "Bug"    |
| "Write API documentation"      | "Docs"   |
| "Review PR #123"               | "Review" |

### Effective Descriptions

Descriptions should include:

- Context/background
- Acceptance criteria
- Links to relevant resources
- Notes on approach (if known)

```
createTask
  --projectId "uuid"
  --title "Implement password reset flow"
  --description "Users need ability to reset forgotten passwords.\n\nAcceptance criteria:\n- Email with reset link sent\n- Link expires after 24 hours\n- User can set new password\n\nSee design: [link]"
  --priority "high"
```

### Appropriate Granularity

| Too Big             | Right Size                 | Too Small             |
| ------------------- | -------------------------- | --------------------- |
| "Build auth system" | "Implement login endpoint" | "Add semicolon"       |
| "Redesign app"      | "Update header component"  | "Change button color" |
| "Fix all bugs"      | "Fix cart calculation bug" | "Add console.log"     |

**Rule of thumb:** A task should be completable in a few hours to a few days.

## Breaking Down Large Tasks

### Example: "Implement Authentication"

Break into:

```
createTask --projectId "uuid" --title "Design auth database schema"
createTask --projectId "uuid" --title "Implement user registration endpoint"
createTask --projectId "uuid" --title "Implement login endpoint"
createTask --projectId "uuid" --title "Implement password reset"
createTask --projectId "uuid" --title "Add session management"
createTask --projectId "uuid" --title "Write auth tests"
createTask --projectId "uuid" --title "Document auth API"
```

### Decomposition Questions

- Can this be done in one sitting?
- Does this have multiple distinct steps?
- Would someone need to context-switch during this?
- Can progress be shown incrementally?

## Task Updates

### When to Update

- Scope changes
- Priority changes
- New information discovered
- Blockers identified

```
# Add blocker info to description
getTask --taskId "uuid"
updateTask --taskId "uuid" --description "[existing description]\n\nBLOCKED: Waiting on API access"
```

### Tracking Progress in Description

```
updateTask
  --taskId "uuid"
  --description "[original description]\n\n## Progress\n- [x] Step 1 complete\n- [x] Step 2 complete\n- [ ] Step 3 in progress\n- [ ] Step 4 pending"
```

## Task Relationships

### Using Descriptions

Note dependencies in task descriptions:

```
createTask
  --projectId "uuid"
  --title "Deploy to production"
  --description "Depends on: Integration tests (task-uuid-1), Security review (task-uuid-2)"
```

### Using Artifacts

Link related documents:

```
# Create spec
writeArtifact --title "Feature Spec" --content "..."

# Attach to implementation tasks
attachArtifactToTask --taskId "impl-task-uuid" --artifactId "spec-uuid"
attachArtifactToTask --taskId "test-task-uuid" --artifactId "spec-uuid"
```

## Common Task Types

### Feature Tasks

```
createTask
  --projectId "uuid"
  --title "[Feature]: [Specific functionality]"
  --description "As a [user], I want [feature] so that [benefit]"
  --priority "medium"
```

### Bug Fix Tasks

```
createTask
  --projectId "uuid"
  --title "Fix: [Bug description]"
  --description "Steps to reproduce:\n1. ...\n\nExpected: ...\nActual: ..."
  --priority "high"
```

### Tech Debt Tasks

```
createTask
  --projectId "uuid"
  --title "Refactor: [Component/Area]"
  --description "Current issues: ...\nProposed changes: ..."
  --priority "low"
```

### Documentation Tasks

```
createTask
  --projectId "uuid"
  --title "Document: [What to document]"
  --description "Audience: ...\nScope: ...\nFormat: ..."
  --priority "medium"
```
