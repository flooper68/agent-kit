# Project Integration

Using projects and tasks with other features.

## With Documents (Artifacts)

### Attach Documents to Projects
Link documents directly to a project for project-level reference materials.

```
# Create project documentation
writeArtifact
  --title "Project Charter: Website Redesign"
  --content "[charter content]"
  --summary "Project goals and scope"
# Returns artifact-uuid

# Attach to project
attachArtifactToProject --projectId "project-uuid" --artifactId "artifact-uuid"
```

### Attach Documents to Tasks
Link documents to specific tasks for task-level context.

```
# Create spec document
writeArtifact
  --title "Feature Spec: User Auth"
  --content "[specification content]"
  --summary "Auth feature specification"
# Returns artifact-uuid

# Attach to implementation task
attachArtifactToTask --taskId "impl-task-uuid" --artifactId "artifact-uuid"
```

### Project vs Task Attachments

| Use Project Attachment | Use Task Attachment |
|------------------------|---------------------|
| Project charter/overview | Task-specific specs |
| Overall requirements doc | Implementation details |
| Team agreements | Bug reproduction steps |
| Architecture diagrams | Code review notes |
| Meeting notes (project-wide) | Task research findings |

### Attach Research to Projects
```
# Research document from web research
writeArtifact
  --title "Research: OAuth Providers"
  --content "[research findings]"
  --summary "Comparison of OAuth providers"

# Attach to project for team reference
attachArtifactToProject --projectId "project-uuid" --artifactId "research-uuid"

# Also attach to specific decision task
attachArtifactToTask --taskId "decision-task-uuid" --artifactId "research-uuid"
```

### Attach Meeting Notes
```
# Meeting notes document
writeArtifact
  --title "Meeting: Sprint Planning"
  --content "[meeting notes]"
  --summary "Sprint planning decisions"

# Attach to project for visibility
attachArtifactToProject --projectId "project-uuid" --artifactId "meeting-uuid"

# Attach to relevant tasks created from meeting
attachArtifactToTask --taskId "task-from-meeting-1" --artifactId "meeting-uuid"
attachArtifactToTask --taskId "task-from-meeting-2" --artifactId "meeting-uuid"
```

### View Attached Documents
```
# Get project details shows attached artifacts
getProject --projectId "uuid"
# Returns: { ..., attachedArtifacts: [{id, title, summary}] }

# Get task details shows attached artifacts
getTask --taskId "uuid"
# Returns: { ..., attachedArtifacts: [{id, title, summary}] }

# Read the attached document
getArtifact --artifactId "attached-artifact-id"
```

### Remove Attachments
```
# Remove from project
detachArtifactFromProject --projectId "project-uuid" --artifactId "artifact-uuid"

# Remove from task
detachArtifactFromTask --taskId "task-uuid" --artifactId "artifact-uuid"
```

## With Agents

### Delegate Task Research
```
# Have research agent investigate for a task
spawnAgent
  --agentId "researcher"
  --message "Research best practices for [task topic]. Save findings to a document."

# Researcher creates document, returns artifact-uuid
# Attach to project and task
attachArtifactToProject --projectId "project-uuid" --artifactId "research-artifact-uuid"
attachArtifactToTask --taskId "task-uuid" --artifactId "research-artifact-uuid"
```

### Project Status Reports
```
# Agent generates status report
getProject --projectId "uuid"
# Agent analyzes and creates report document
writeArtifact
  --title "Project Status: [Name]"
  --content "[status analysis]"
  --summary "Weekly status update"

# Attach report to project
attachArtifactToProject --projectId "uuid" --artifactId "report-uuid"
```

## Workflow Patterns

### Feature Development Flow
```
# 1. Create project
createProject --title "Feature: User Dashboard" --summary "New user dashboard"

# 2. Create and attach project charter
writeArtifact --title "Dashboard Charter" --content "..." --summary "Goals and scope"
attachArtifactToProject --projectId "uuid" --artifactId "charter-uuid"

# 3. Create planning tasks
createTask --projectId "uuid" --title "Write requirements" --status "todo"
createTask --projectId "uuid" --title "Create design doc"
createTask --projectId "uuid" --title "Implement backend"
createTask --projectId "uuid" --title "Implement frontend"
createTask --projectId "uuid" --title "Write tests"
createTask --projectId "uuid" --title "Deploy"

# 4. Start requirements task
moveTask --taskId "req-task" --status "in_progress"

# 5. Create requirements document
writeArtifact --title "Requirements: User Dashboard" --content "..." --summary "Feature requirements"

# 6. Attach to task and complete
attachArtifactToTask --taskId "req-task" --artifactId "req-doc"
moveTask --taskId "req-task" --status "done"

# 7. Continue with design, implementation...
```

### Bug Tracking Flow
```
# 1. Create bug task
createTask
  --projectId "uuid"
  --title "Bug: Login fails on mobile"
  --description "Steps to reproduce..."
  --priority "urgent"

# 2. Research the bug
# Agent investigates, creates findings document
writeArtifact --title "Bug Analysis: Login Mobile" --content "..." --summary "Root cause analysis"

# 3. Attach analysis
attachArtifactToTask --taskId "bug-task" --artifactId "analysis-uuid"

# 4. Fix and document
# After fix, update task
updateTask --taskId "bug-task" --description "[original]\n\nFix: [description of fix]"
moveTask --taskId "bug-task" --status "review"
```

### Research-Driven Development
```
# 1. Create research task
createTask --projectId "uuid" --title "Research: State management options"
moveTask --taskId "research-task" --status "in_progress"

# 2. Do research (web research skill)
webSearch --query "React state management comparison 2024"
extractContent --url "..."

# 3. Document findings
writeArtifact --title "Research: State Management" --content "..." --summary "Redux vs Zustand vs Jotai"

# 4. Attach to project and complete task
attachArtifactToProject --projectId "uuid" --artifactId "research-uuid"
attachArtifactToTask --taskId "research-task" --artifactId "research-uuid"
moveTask --taskId "research-task" --status "done"

# 5. Create decision task
createTask --projectId "uuid" --title "Decide: State management approach"
attachArtifactToTask --taskId "decision-task" --artifactId "research-uuid"
```

## Navigation Integration

### Navigate to Project
```
# Direct user to project board
navigateToProjectBoard --projectId "uuid"

# Or use navigateTo
navigateTo --path "/app/projects/[project-uuid]"
```

### Current Context
```
# Check what project user is viewing
getCurrentUIState
# If on project page, can get projectId from route params
```
