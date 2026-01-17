---
name: web-research
description: Search the web and extract content from URLs. Use for research tasks, finding documentation, or gathering information from websites.
allowed-tools:
  - webSearch
  - extractContent
  - fetch
---

# Web Research Skill

Use this skill to research topics on the web by searching and extracting content from URLs.

## Available Tools

- **webSearch**: Search the web for information on any topic
- **extractContent**: Extract readable content from a web page URL
- **fetch**: Fetch raw content from a URL (for APIs, data files, etc.)

## Workflow

1. **Search**: Use `webSearch` to find relevant sources

   ```
   webSearch --query "your search terms"
   ```

2. **Extract**: Use `extractContent` to read full articles

   ```
   extractContent --url "https://example.com/article"
   ```

3. **Synthesize**: Combine information from multiple sources

## Best Practices

- Use specific, targeted search queries
- Cross-reference information from multiple sources
- Cite your sources when presenting findings
- Use extractContent for articles, fetch for raw data/APIs
