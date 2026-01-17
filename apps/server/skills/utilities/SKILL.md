---
name: utilities
description: General utilities for time and UI navigation. Use for getting current time or navigating the user to specific pages.
allowed-tools:
  - getTime
  - navigateTo
  - getCurrentUIState
---

# Utilities Skill

General-purpose utilities for time and UI interaction.

## Available Tools

- **getTime**: Get current date and time
- **navigateTo**: Navigate the user's browser to a path
- **getCurrentUIState**: Get current page info

## Time Operations
```
getTime
getTime --timezone "America/New_York"
```

## Navigation

Navigate the user to specific pages:
```
navigateTo --path "/app/projects"
navigateTo --path "/app/artifacts"
navigateTo --path "/app/agents"
```

## UI State

Check what page the user is currently viewing:
```
getCurrentUIState
```

Returns current path, page title, and route parameters.
