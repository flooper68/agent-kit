# Bulk Operations

Patterns for managing multiple tasks efficiently.

## Batch Task Creation

### Creating Multiple Tasks

```
# Create a series of related tasks
createTask --projectId "uuid" --title "Task 1" --priority "high"
createTask --projectId "uuid" --title "Task 2" --priority "high"
createTask --projectId "uuid" --title "Task 3" --priority "medium"
createTask --projectId "uuid" --title "Task 4" --priority "medium"
createTask --projectId "uuid" --title "Task 5" --priority "low"
```

### From a List

When given a list of items to track:

```
# User provides: "Track these: Login, Signup, Password Reset, Profile"

createTask --projectId "uuid" --title "Implement Login"
createTask --projectId "uuid" --title "Implement Signup"
createTask --projectId "uuid" --title "Implement Password Reset"
createTask --projectId "uuid" --title "Implement Profile"
```

## Batch Status Updates

### Sprint Completion

```
# Move all reviewed items to done
listTasks --projectId "uuid" --status "review"
# For each task in review:
moveTask --taskId "uuid-1" --status "done"
moveTask --taskId "uuid-2" --status "done"
moveTask --taskId "uuid-3" --status "done"
```

### Bulk Prioritization

```
# After triage, update priorities
updateTask --taskId "uuid-1" --priority "urgent"
updateTask --taskId "uuid-2" --priority "high"
updateTask --taskId "uuid-3" --priority "low"
```

## Reordering Strategies

### Prioritize Within Column

```
# Move most important to top
reorderTask --taskId "important-uuid" --position 0

# Move second priority to position 1
reorderTask --taskId "second-uuid" --position 1
```

### Full Reorder

```
# Reorder entire todo column by priority
# 1. Identify desired order
# 2. Set positions from top
reorderTask --taskId "first-uuid" --position 0
reorderTask --taskId "second-uuid" --position 1
reorderTask --taskId "third-uuid" --position 2
```

## Finding and Filtering

### Find All High Priority

```
# List and filter manually
listTasks --projectId "uuid"
# Look for priority: "high" or "urgent" in results
```

### Search Across Projects

```
# Find all tasks mentioning "authentication"
searchTasks --query "authentication"
```

### Status-Specific Lists

```
# What's blocked in review?
listTasks --projectId "uuid" --status "review"

# What's available to pick up?
listTasks --projectId "uuid" --status "todo"

# What's actively being worked on?
listTasks --projectId "uuid" --status "in_progress"
```

## Bulk Cleanup

### Archive Completed

```
# List done tasks
listTasks --projectId "uuid" --status "done"

# Delete old completed tasks if needed
deleteTask --taskId "old-done-uuid-1"
deleteTask --taskId "old-done-uuid-2"
```

### Groom Backlog

```
# Review backlog
listTasks --projectId "uuid" --status "backlog"

# Delete obsolete items
deleteTask --taskId "obsolete-uuid"

# Promote relevant items
moveTask --taskId "now-relevant-uuid" --status "todo"
```

## Workflow: Weekly Review

```
# 1. Check completed work
listTasks --projectId "uuid" --status "done"

# 2. Review in-progress (should be empty or minimal)
listTasks --projectId "uuid" --status "in_progress"

# 3. Check what's stuck in review
listTasks --projectId "uuid" --status "review"

# 4. Plan next week from todo/backlog
listTasks --projectId "uuid" --status "todo"
listTasks --projectId "uuid" --status "backlog"

# 5. Promote backlog items to todo
moveTask --taskId "uuid" --status "todo"

# 6. Reorder todo by priority
reorderTask --taskId "most-important" --position 0
```

## Performance Tips

### Efficient Patterns

- Use `listTasks` with `--status` filter to get specific views
- Use `searchTasks` for cross-project queries
- Get project overview with `getProject` for task counts

### Avoid

- Repeatedly listing all tasks without filters
- Getting full project details when only counts needed
- Creating tasks one-by-one when batch is possible
