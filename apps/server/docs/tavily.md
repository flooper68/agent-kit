# Tavily Setup

[Tavily](https://tavily.com) provides web search and content extraction APIs for the `webSearch` and `extractContent` tools.

## Getting an API Key

1. Sign up at [tavily.com](https://tavily.com)
2. Navigate to your dashboard
3. Copy your API key (starts with `tvly-`)

## Configuration

Add your API key to `.env`:

```bash
TAVILY_API_KEY=tvly-your-api-key-here
```

## API Reference

The Tavily client is located in `src/lib/tavily/`:

- **Search**: Find current information from the web
  - Topics: `general`, `news`, `finance`
  - Up to 10 results per query

- **Extract**: Get full article content from URLs
  - Formats: `markdown`, `text`
  - Up to 5 URLs per request

## Pricing

See [tavily.com/pricing](https://tavily.com/pricing) for current API limits and pricing.
