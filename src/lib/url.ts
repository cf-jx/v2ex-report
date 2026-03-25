/**
 * Extract V2EX post ID from various URL formats or bare IDs.
 *
 * Supported formats:
 *  - https://www.v2ex.com/t/1200385
 *  - https://v2ex.com/t/1200385#reply123
 *  - v2ex.com/t/1200385?p=2
 *  - 1200385 (bare numeric ID)
 */
export function parseV2EXUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare numeric ID
  if (/^\d+$/.test(trimmed)) return trimmed;

  // URL with /t/{id} pattern
  const match = trimmed.match(/v2ex\.com\/t\/(\d+)/i);
  return match?.[1] ?? null;
}
