import { z } from 'zod';

export const TimeRangeSchema = z.enum(['today', 'week', 'month', 'all']);
export const GranularitySchema = z.enum(['hour', 'day', 'week']);

// Tag validation schema - trims whitespace and requires minimum 2 characters
export const tagSchema = z
  .string()
  .max(50, 'Tag must be 50 characters or less')
  .transform((val) => val.trim())
  .refine((val) => val.length >= 2, 'Tag must be at least 2 characters');

export const tagsSchema = z.array(tagSchema).max(20).optional();

// Normalize and deduplicate tags - stores in lowercase for consistent filtering
export function deduplicateTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}
