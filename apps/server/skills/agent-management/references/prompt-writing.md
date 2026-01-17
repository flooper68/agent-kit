# Writing Effective Agent Prompts

Guide to writing system prompts that create capable, focused agents.

## System Prompt Structure

Recommended sections:

```
1. Role Definition (who the agent is)
2. Core Capabilities (what it can do)
3. Available Tools (which tools to use when)
4. Output Format (how to structure responses)
5. Constraints (what to avoid)
6. Examples (concrete demonstrations)
```

## Role Definition

Be specific about the agent's purpose:

**Good:**

```
You are a technical documentation specialist. Your role is to help users create, organize, and improve technical documentation for software projects.
```

**Bad:**

```
You are a helpful assistant.
```

## Tool Usage Instructions

Guide when to use which tools:

**Good:**

```
When asked to research a topic:
1. Use webSearch to find relevant sources
2. Use extractContent to read full articles
3. Use writeArtifact to save findings

When asked about existing documents:
1. Use searchArtifacts to find relevant docs
2. Use readArtifact to get full content
```

**Bad:**

```
You have access to various tools.
```

## Output Format

Specify structure expectations:

**Good:**

```
When summarizing research:
- Start with a 2-3 sentence executive summary
- Use bullet points for key findings
- Include source URLs at the end
- Keep total response under 500 words
```

## Constraints

Set clear boundaries:

**Good:**

```
Constraints:
- Never make up information; use tools to verify facts
- Always cite sources when providing external information
- Ask for clarification if the request is ambiguous
- Stay focused on technical documentation tasks
```

## Example Template

```
You are a [specific role]. Your purpose is to [primary function].

## Capabilities
- [Capability 1]
- [Capability 2]
- [Capability 3]

## Tool Usage
When [scenario 1]:
1. Use [tool A] to [action]
2. Use [tool B] to [action]

When [scenario 2]:
1. Use [tool C] to [action]

## Output Format
[Specify structure and length expectations]

## Constraints
- [Constraint 1]
- [Constraint 2]
```

## Common Mistakes to Avoid

| Mistake             | Why It's Bad                 | Fix                           |
| ------------------- | ---------------------------- | ----------------------------- |
| Vague role          | Agent doesn't know its focus | Be specific about purpose     |
| No tool guidance    | Random tool usage            | Specify when to use each tool |
| No output format    | Inconsistent responses       | Define structure expectations |
| Too long            | Wastes context tokens        | Keep prompts concise          |
| Contradictory rules | Confuses the agent           | Review for consistency        |
| No constraints      | Agent goes off-topic         | Set clear boundaries          |

## Prompt Length Guidelines

| Agent Complexity | Recommended Length |
| ---------------- | ------------------ |
| Simple, focused  | 100-300 words      |
| Multi-capability | 300-500 words      |
| Complex workflow | 500-1000 words     |

Remember: Every token in the system prompt uses context. Be concise.

## Testing Your Prompt

1. **Try edge cases** - What happens with unusual requests?
2. **Check tool usage** - Does it use the right tools?
3. **Verify constraints** - Does it respect boundaries?
4. **Test consistency** - Do similar prompts get similar results?
5. **Iterate** - Refine based on observed behavior
