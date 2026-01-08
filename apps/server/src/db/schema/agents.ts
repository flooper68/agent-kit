import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  jsonb,
  real,
  integer,
} from 'drizzle-orm/pg-core';

// Thinking configuration - provider-specific settings
export interface ThinkingConfig {
  enabled: boolean;
  // Anthropic: budget tokens (1024-32768)
  budgetTokens?: number;
  // OpenAI: reasoning effort
  reasoningEffort?: 'low' | 'medium' | 'high';
  // Gemini 3: thinking level
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  // Gemini 2.5: thinking budget (0-32768, -1 for dynamic)
  thinkingBudget?: number;
}

/**
 * External agents - WebSocket-based agents that connect from external processes
 * These need authentication via secret keys
 */
export const externalAgents = pgTable(
  'external_agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Ownership - per-user (not shared with org)
    userId: varchar('user_id', { length: 255 }).notNull(),

    // Agent identity
    key: varchar('key', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Secret key hash (SHA256) - the actual key is only returned on create/regenerate
    secretKey: varchar('secret_key', { length: 255 }).notNull().unique(),

    // Display prefix for identification (e.g., "ak_ext_abc1...")
    // Unique to ensure reliable lookup during HMAC auth
    secretKeyPrefix: varchar('secret_key_prefix', { length: 32 })
      .notNull()
      .unique(),

    // Soft delete - disabled agents are hidden from agent selector
    disabled: boolean('disabled').notNull().default(false),

    // User preferences
    isFavorite: boolean('is_favorite').notNull().default(false),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Soft delete timestamp - when set, agent is hidden from all lists
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('external_agents_user_id_idx').on(table.userId),
    index('external_agents_secret_key_idx').on(table.secretKey),
    // Per-user unique key for spawning
    uniqueIndex('external_agents_user_key_idx').on(table.userId, table.key),
    index('external_agents_deleted_at_idx').on(table.deletedAt),
  ]
);

export type ExternalAgent = typeof externalAgents.$inferSelect;
export type NewExternalAgent = typeof externalAgents.$inferInsert;

/**
 * Server agents - LLM agents that run on the server
 * These have model configuration but no external authentication
 */
export const serverAgents = pgTable(
  'server_agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Ownership - per-user (not shared with org)
    userId: varchar('user_id', { length: 255 }).notNull(),

    // Agent identity
    key: varchar('key', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Agent configuration
    provider: varchar('provider', { length: 64 })
      .notNull()
      .default('anthropic'),
    model: varchar('model', { length: 128 })
      .notNull()
      .default('claude-sonnet-4-5-20250929'),
    systemPrompt: text('system_prompt')
      .notNull()
      .default('You are a helpful AI assistant.'),
    tools: jsonb('tools').$type<string[]>().notNull().default([]),

    // Model settings (null = use provider defaults)
    temperature: real('temperature'),
    maxOutputTokens: integer('max_output_tokens'),
    maxContextTokens: integer('max_context_tokens'), // null = use model's default contextWindow
    thinkingConfig: jsonb('thinking_config').$type<ThinkingConfig | null>(),

    // Soft delete - disabled agents are hidden from agent selector
    disabled: boolean('disabled').notNull().default(false),

    // User preferences
    isFavorite: boolean('is_favorite').notNull().default(false),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Soft delete timestamp - when set, agent is hidden from all lists
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('server_agents_user_id_idx').on(table.userId),
    // Per-user unique key for spawning
    uniqueIndex('server_agents_user_key_idx').on(table.userId, table.key),
    index('server_agents_deleted_at_idx').on(table.deletedAt),
  ]
);

export type ServerAgent = typeof serverAgents.$inferSelect;
export type NewServerAgent = typeof serverAgents.$inferInsert;

// Legacy type aliases for backwards compatibility with analytics/artifacts features
// These features query across both agent types using a union
export type Agent = ServerAgent | ExternalAgent;
