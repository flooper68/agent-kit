# Project Workflows

Patterns for managing projects through their lifecycle.

## Project Lifecycle

```
Create -> Plan -> Execute -> Review -> Complete/Archive
```

## Starting a New Project

### 1. Create Project
```
createProject
  --title "[Clear Project Name]"
  --summary "[Goal and scope description]"
```

### 2. Initial Planning
```
# Add high-level tasks to backlog
createTask --projectId "uuid" --title "Define requirements" --status "todo"
createTask --projectId "uuid" --title "Design architecture"
createTask --projectId "uuid" --title "Implement core features"
createTask --projectId "uuid" --title "Testing and QA"
createTask --projectId "uuid" --title "Documentation"
createTask --projectId "uuid" --title "Launch preparation"
```

### 3. Prioritize
```
# Set priorities
updateTask --taskId "uuid" --priority "high"
updateTask --taskId "uuid" --priority "urgent"
```

## Sprint/Iteration Pattern

### Sprint Start
```
# Review backlog
listTasks --projectId "uuid" --status "backlog"

# Move selected items to todo
moveTask --taskId "uuid" --status "todo"
moveTask --taskId "uuid" --status "todo"
```

### Daily Work
```
# Check what's in progress
listTasks --projectId "uuid" --status "in_progress"

# Start new task
moveTask --taskId "uuid" --status "in_progress"

# Complete tasks
moveTask --taskId "uuid" --status "review"
moveTask --taskId "uuid" --status "done"
```

### Sprint End
```
# Review completed work
listTasks --projectId "uuid" --status "done"

# Move incomplete back to backlog or keep in todo
moveTask --taskId "uuid" --status "backlog"
```

## Progress Tracking

### Check Project Status
```
# Get full project view
getProject --projectId "uuid"

# Returns task counts by status:
# - backlog: X tasks
# - todo: Y tasks
# - in_progress: Z tasks
# - review: W tasks
# - done: V tasks
```

### Calculate Progress
```
# Total tasks = backlog + todo + in_progress + review + done
# Progress = done / total * 100%
# Remaining = backlog + todo
# Active = in_progress + review
```

## Project Completion

### Completion Checklist
1. All tasks in `done` status
2. No tasks in `review` (all reviewed)
3. Update project summary with outcome
4. Consider archiving (if feature available)

### Final Update
```
updateProject
  --projectId "uuid"
  --summary "COMPLETED: [Original summary]. Outcome: [What was achieved]"
```

## Project Templates

### Feature Development
```
createProject --title "Feature: [Name]" --summary "Implement [feature description]"
createTask --projectId "uuid" --title "Requirements gathering"
createTask --projectId "uuid" --title "Technical design"
createTask --projectId "uuid" --title "Implementation"
createTask --projectId "uuid" --title "Code review"
createTask --projectId "uuid" --title "Testing"
createTask --projectId "uuid" --title "Documentation"
createTask --projectId "uuid" --title "Deployment"
```

### Bug Fix Sprint
```
createProject --title "Bug Fix: [Period]" --summary "Address reported bugs"
# Add bugs as tasks with priority based on severity
createTask --projectId "uuid" --title "[Bug description]" --priority "urgent"
```

### Research Project
```
createProject --title "Research: [Topic]" --summary "Investigate [topic] for [purpose]"
createTask --projectId "uuid" --title "Define research questions"
createTask --projectId "uuid" --title "Literature review"
createTask --projectId "uuid" --title "Data gathering"
createTask --projectId "uuid" --title "Analysis"
createTask --projectId "uuid" --title "Report findings"
```

## Multi-Project Management

### Overview
```
# List all projects
listProjects

# Search for specific project
searchProjects --query "[project name]"
```

### Cross-Project Tasks
```
# Search tasks across all projects
searchTasks --query "authentication"
```
