import type { SpanKey } from '@/content/types';

/**
 * Tessellating span cycle — SPEC §6.6.
 *
 * Pairs sum to 12 columns and share the same row span, so two adjacent
 * tiles always close flush. If the final tile is odd, return 's-fill' so
 * the bottom row stretches full-width.
 */
const CYCLE: SpanKey[] = ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6', 's-7', 's-8'];

export function spanFor(idx: number, total: number): SpanKey {
  if (idx === total - 1 && total % 2 === 1) return 's-fill';
  return CYCLE[idx % CYCLE.length] ?? 's-1';
}
