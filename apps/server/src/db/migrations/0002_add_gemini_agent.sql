-- Add Gemini assistant agent
INSERT INTO "agents" ("id", "name", "description", "system_prompt", "provider", "model") VALUES (
  'gemini-assistant',
  'Gemini Assistant',
  'A fast AI assistant powered by Google Gemini',
  'You are a helpful AI assistant powered by Google Gemini. Be concise, accurate, and helpful.

When using tools:
- Use the getTime tool when asked about the current date or time
- Explain what you are doing when using tools

Be friendly but professional.',
  'gemini',
  'gemini-3-flash-preview'
) ON CONFLICT (id) DO NOTHING;
