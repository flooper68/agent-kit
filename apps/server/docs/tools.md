# Tools Architecture

Agent tools are located in `src/agent/tools/`. Tools use the Vercel AI SDK `tool()` helper.

## Available Tools

| Tool             | Description                                 |
| ---------------- | ------------------------------------------- |
| `getTime`        | Get current date and time                   |
| `webSearch`      | Search the web using Tavily API             |
| `extractContent` | Extract full content from URLs using Tavily |

## How It Works

1. **Tool Registry**: Tools are registered in `src/agent/tools/index.ts`:

   ```typescript
   export const TOOLS: Record<string, Tool> = {
     getTime: getTimeTool,
     webSearch: webSearchTool,
     extractContent: extractContentTool,
   };
   ```

2. **Agent Definition**: Agents specify which tools they can use via the `tools` array:

   ```typescript
   {
     id: 'assistant-opus-4.5',
     name: 'Assistant - Opus 4.5',
     tools: ['getTime', 'webSearch', 'extractContent'],
     // ...
   }
   ```

3. **Tool Loading**: Use `getToolsById()` to get tool instances for an agent:

   ```typescript
   const tools = getToolsById(['getTime', 'webSearch']);
   ```

## Adding a New Tool

1. Create a tool file in `src/agent/tools/`:

   ```typescript
   // src/agent/tools/my-tool.ts
   import { tool } from 'ai';
   import { z } from 'zod';
   import type { Tool } from '../types';

   export const myTool: Tool = tool({
     description: 'What this tool does',
     inputSchema: z.object({
       param: z.string().describe('Parameter description'),
     }),
     execute: async ({ param }) => {
       // Implementation
       return { result: 'value' };
     },
   });
   ```

2. Register in `src/agent/tools/index.ts`:

   ```typescript
   import { myTool } from './my-tool';

   export const TOOLS: Record<string, Tool> = {
     // ...existing tools
     myTool: myTool,
   };
   ```

3. Add to agent definitions (in `src/features/agents/agents-feature.ts` and `scripts/seed.ts`):

   ```typescript
   tools: ['getTime', 'webSearch', 'extractContent', 'myTool'],
   ```
