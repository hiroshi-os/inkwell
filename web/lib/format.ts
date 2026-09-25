import type { Story } from "./api";

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** Deterministic display stats so cards look like a live catalog. */
export function storyStats(story: Story) {
  const reads = 18_420 + story.chapterCount * 12_847 + story.coverHue * 73;
  const votes = 412 + story.chapterCount * 287 + (story.coverHue % 90);
  return { reads, votes, parts: story.chapterCount };
}
