-- Add tools and released_at columns to agents table
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "tools" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "released_at" timestamp with time zone;

-- Standard system prompt for all assistants
DO $$
DECLARE
  standard_prompt TEXT := 'You are a helpful AI assistant. Be concise, accurate, and helpful.

When using tools:
- Use the getTime tool when asked about the current date or time
- Explain what you are doing when using tools

Be friendly but professional.';
BEGIN

-- Delete old agents that are being replaced
DELETE FROM "agents" WHERE "id" IN ('general-assistant', 'gemini-assistant');

-- Insert all agents ordered by release date (newest first)
-- November 2025
INSERT INTO "agents" ("id", "name", "description", "system_prompt", "provider", "model", "tools", "released_at") VALUES
  ('assistant-gpt-5.2', 'Assistant - GPT-5.2', 'Most capable OpenAI model with advanced reasoning', standard_prompt, 'openai', 'gpt-5.2', '["getTime"]', '2025-11-15'),
  ('assistant-gpt-5.2-codex', 'Assistant - GPT-5.2 Codex', 'Specialized for code generation and analysis', standard_prompt, 'openai', 'gpt-5.2-codex', '["getTime"]', '2025-11-15'),
  ('assistant-opus-4.5', 'Assistant - Opus 4.5', 'Most capable Anthropic model for complex tasks', standard_prompt, 'anthropic', 'claude-opus-4-5-20251101', '["getTime"]', '2025-11-01'),
  -- October 2025
  ('assistant-gemini-3-pro', 'Assistant - Gemini 3 Pro', 'Most capable Google model for complex reasoning', standard_prompt, 'gemini', 'gemini-3-pro-preview', '["getTime"]', '2025-10-20'),
  ('assistant-gemini-3-flash', 'Assistant - Gemini 3 Flash', 'Fast and efficient Google assistant', standard_prompt, 'gemini', 'gemini-3-flash-preview', '["getTime"]', '2025-10-20'),
  ('assistant-haiku-4.5', 'Assistant - Haiku 4.5', 'Fast and efficient for quick tasks', standard_prompt, 'anthropic', 'claude-haiku-4-5-20251001', '["getTime"]', '2025-10-01'),
  -- September 2025
  ('assistant-sonnet-4.5', 'Assistant - Sonnet 4.5', 'Balanced performance and intelligence', standard_prompt, 'anthropic', 'claude-sonnet-4-5-20250929', '["getTime"]', '2025-09-29'),
  ('assistant-gpt-5', 'Assistant - GPT-5', 'Powerful OpenAI model for complex tasks', standard_prompt, 'openai', 'gpt-5', '["getTime"]', '2025-09-15'),
  ('assistant-gpt-5-mini', 'Assistant - GPT-5 Mini', 'Balanced performance and cost efficiency', standard_prompt, 'openai', 'gpt-5-mini', '["getTime"]', '2025-09-15'),
  ('assistant-gpt-5-nano', 'Assistant - GPT-5 Nano', 'Ultra-fast and cost-effective for simple tasks', standard_prompt, 'openai', 'gpt-5-nano', '["getTime"]', '2025-09-15'),
  -- August 2025
  ('assistant-opus-4.1', 'Assistant - Opus 4.1', 'Premium Anthropic model for demanding tasks', standard_prompt, 'anthropic', 'claude-opus-4-1-20250805', '["getTime"]', '2025-08-05'),
  -- June 2025
  ('assistant-gemini-2.5-pro', 'Assistant - Gemini 2.5 Pro', 'Powerful model for advanced tasks', standard_prompt, 'gemini', 'gemini-2.5-pro', '["getTime"]', '2025-06-15'),
  ('assistant-gemini-2.5-flash', 'Assistant - Gemini 2.5 Flash', 'Quick responses for everyday use', standard_prompt, 'gemini', 'gemini-2.5-flash', '["getTime"]', '2025-06-15'),
  ('assistant-gemini-2.5-flash-lite', 'Assistant - Gemini 2.5 Flash-Lite', 'Ultra-lightweight and cost-effective', standard_prompt, 'gemini', 'gemini-2.5-flash-lite', '["getTime"]', '2025-06-15'),
  -- May 2025
  ('assistant-sonnet-4', 'Assistant - Sonnet 4', 'Reliable performance for everyday tasks', standard_prompt, 'anthropic', 'claude-sonnet-4-20250514', '["getTime"]', '2025-05-14'),
  -- April 2025
  ('assistant-o3', 'Assistant - o3', 'OpenAI reasoning model for complex problem solving', standard_prompt, 'openai', 'o3', '["getTime"]', '2025-04-16'),
  ('assistant-o4-mini', 'Assistant - o4-mini', 'Compact reasoning model for efficient analysis', standard_prompt, 'openai', 'o4-mini', '["getTime"]', '2025-04-16'),
  -- December 2024
  ('assistant-gemini-2.0-flash', 'Assistant - Gemini 2.0 Flash', 'Fast legacy model for simple tasks', standard_prompt, 'gemini', 'gemini-2.0-flash', '["getTime"]', '2024-12-10'),
  -- October 2024
  ('assistant-haiku-3.5', 'Assistant - Haiku 3.5', 'Quick and affordable assistant', standard_prompt, 'anthropic', 'claude-3-5-haiku-20241022', '["getTime"]', '2024-10-22'),
  -- July 2024
  ('assistant-gpt-4o-mini', 'Assistant - GPT-4o Mini', 'Fast and affordable multimodal assistant', standard_prompt, 'openai', 'gpt-4o-mini', '["getTime"]', '2024-07-18'),
  -- May 2024
  ('assistant-gpt-4o', 'Assistant - GPT-4o', 'Multimodal model with vision capabilities', standard_prompt, 'openai', 'gpt-4o', '["getTime"]', '2024-05-13')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt,
  provider = EXCLUDED.provider,
  model = EXCLUDED.model,
  tools = EXCLUDED.tools,
  released_at = EXCLUDED.released_at,
  updated_at = NOW();

END $$;
