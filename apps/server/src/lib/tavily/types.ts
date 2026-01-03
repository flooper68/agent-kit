import { z } from 'zod';

// Shared enums - Tavily API supported values
export const TavilyTopicSchema = z.enum(['general', 'news', 'finance']);
export const TavilySearchDepthSchema = z.enum(['basic', 'advanced']);
export const TavilyFormatSchema = z.enum(['markdown', 'text']);

// Search endpoint schemas
export const TavilySearchInputSchema = z.object({
  query: z.string(),
  search_depth: TavilySearchDepthSchema.optional(),
  max_results: z.number().min(1).max(20).optional(),
  include_answer: z.boolean().optional(),
  topic: TavilyTopicSchema.optional(),
});

export const TavilySearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string(),
  score: z.number(),
});

export const TavilySearchResponseSchema = z.object({
  query: z.string(),
  answer: z.string().optional(),
  results: z.array(TavilySearchResultSchema),
  response_time: z.number(),
});

// Extract endpoint schemas
export const TavilyExtractInputSchema = z.object({
  urls: z.union([z.string(), z.array(z.string())]),
  format: TavilyFormatSchema.optional(),
});

export const TavilyExtractResultSchema = z.object({
  url: z.string(),
  raw_content: z.string(),
});

export const TavilyExtractFailedResultSchema = z.object({
  url: z.string(),
  error: z.string(),
});

export const TavilyExtractResponseSchema = z.object({
  results: z.array(TavilyExtractResultSchema),
  failed_results: z.array(TavilyExtractFailedResultSchema).optional(),
});

// Inferred types
export type TavilySearchInput = z.infer<typeof TavilySearchInputSchema>;
export type TavilySearchResult = z.infer<typeof TavilySearchResultSchema>;
export type TavilySearchResponse = z.infer<typeof TavilySearchResponseSchema>;
export type TavilyExtractInput = z.infer<typeof TavilyExtractInputSchema>;
export type TavilyExtractResult = z.infer<typeof TavilyExtractResultSchema>;
export type TavilyExtractResponse = z.infer<typeof TavilyExtractResponseSchema>;
