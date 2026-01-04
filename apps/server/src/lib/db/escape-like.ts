/**
 * Escape special characters in LIKE/ILIKE patterns.
 * PostgreSQL LIKE special characters: % (any sequence), _ (single char), \ (escape)
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
