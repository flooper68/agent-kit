# System Skills

System skills are read-only, platform-provided skills that teach agents how to use related tools.

## Available System Skills (6)

### web-research
**Description:** Search the web and extract content from URLs. Use for research tasks, finding documentation, or gathering information.

**Tools:** webSearch, extractContent, fetch

**Use when:** User needs current information, web research, or content extraction.

### document-management
**Description:** Create, read, update, and search documents/artifacts. Use for saving notes, reports, or any persistent content.

**Tools:** writeArtifact, readArtifact, searchArtifacts, updateArtifact

**Use when:** User wants to save, find, or modify documents.

### project-management
**Description:** Create and manage projects with Kanban-style task boards. Use for organizing work, tracking tasks, and project planning.

**Tools:** All project tools (6) + All task tools (10)

**Use when:** User needs to manage projects, create tasks, or track work.

### agent-management
**Description:** Manage agents and understand the platform. List, configure, spawn agents.

**Tools:** listAgents, getAgent, updateAgent, setAgentEnabled, toggleAgentFavorite, spawnAgent

**Use when:** User wants to manage agents, spawn subtasks, or configure agent settings.

### utilities
**Description:** General utilities for time and UI navigation.

**Tools:** getTime, navigateTo, getCurrentUIState

**Use when:** User needs current time or navigation assistance.

### skill-management
**Description:** Author and manage custom skills. Use when creating, updating, or organizing skills.

**Tools:** listSkills, getSkill, createSkill, updateSkill, deleteSkill

**Use when:** User wants to create or manage custom skills.

## Skill Discovery

To see available skills:
```
listSkills
```

To read a skill's documentation:
```
readSkillFile --path "skill-key/SKILL.md"
```

To list files in a skill:
```
listSkillFiles --skillKey "skill-key"
```

## System vs User Skills

| Aspect | System Skills | User Skills |
|--------|---------------|-------------|
| Editable | No (read-only) | Yes |
| Created by | Platform | Users |
| Deletable | No | Yes |
| Available to | All users | Creator only |
