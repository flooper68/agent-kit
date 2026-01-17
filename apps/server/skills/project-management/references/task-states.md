# Task States and Priorities

Complete reference for task status values, priorities, and state transitions.

## Status Values

| Status | Description | When to Use |
|--------|-------------|-------------|
| `backlog` | Not yet scheduled | Ideas, future work, unplanned items |
| `todo` | Ready to start | Planned work, ready for someone to pick up |
| `in_progress` | Currently being worked on | Active work, someone is on it |
| `review` | Ready for review/feedback | Work complete, needs verification |
| `done` | Completed | Finished, verified, shipped |

## Priority Values

| Priority | Description | When to Use |
|----------|-------------|-------------|
| `low` | Nice to have | No deadline, do when convenient |
| `medium` | Standard | Normal work items, default priority |
| `high` | Important | Needs attention soon, impacts others |
| `urgent` | Critical | Immediate attention, blocking issues |

## State Transitions

### Standard Flow
```
backlog -> todo -> in_progress -> review -> done
```

### Common Transitions

| From | To | Reason |
|------|-----|--------|
| backlog | todo | Work scheduled for current cycle |
| todo | in_progress | Starting work |
| in_progress | review | Work complete, needs review |
| review | done | Review passed |
| review | in_progress | Review feedback, needs changes |
| done | in_progress | Reopened due to issue |
| any | backlog | Deprioritized, deferred |

### Moving Tasks

```
# Start working on a task
moveTask --taskId "uuid" --status "in_progress"

# Submit for review
moveTask --taskId "uuid" --status "review"

# Mark complete
moveTask --taskId "uuid" --status "done"

# Send back for changes
moveTask --taskId "uuid" --status "in_progress"
```

## Priority Guidelines

### Setting Initial Priority

```
# Urgent: Production bugs, security issues
createTask --projectId "uuid" --title "Fix login crash" --priority "urgent"

# High: Blocking work, deadline-driven
createTask --projectId "uuid" --title "Complete API for launch" --priority "high"

# Medium: Standard features (default)
createTask --projectId "uuid" --title "Add user preferences"

# Low: Nice-to-have, tech debt
createTask --projectId "uuid" --title "Refactor legacy module" --priority "low"
```

### Changing Priority

```
# Escalate
updateTask --taskId "uuid" --priority "urgent"

# De-escalate
updateTask --taskId "uuid" --priority "low"
```

## Work In Progress (WIP) Limits

Best practice: Limit tasks in `in_progress` status.

**Why:**
- Focus on finishing over starting
- Reduces context switching
- Improves flow and delivery

**Recommended:**
- Individual: 1-3 tasks in progress
- Team: Number of team members + buffer

## Status Column Best Practices

### Backlog
- Capture all ideas here
- Groom regularly (delete or promote)
- Don't let it grow unbounded

### Todo
- Only planned, ready work
- Should have clear acceptance criteria
- Prioritized (most important at top)

### In Progress
- Actively being worked
- Limit WIP
- Update daily

### Review
- Clear about what needs review
- Don't let items stagnate
- Reviewers should check regularly

### Done
- Celebrate completions
- Archive or clean up periodically
- Reference for what was accomplished
