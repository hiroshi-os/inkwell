import Link from "next/link";
import type { CSSProperties } from "react";
import type { Story } from "@/lib/api";

export function coverStyle(hue: number): CSSProperties {
  return {
    background: `linear-gradient(145deg, hsl(${hue} 32% 26%), hsl(${(hue + 46) % 360} 38% 14%))`,
  };
}

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/stories/${story.id}`} className="story-card">
      <div className="cover" style={coverStyle(story.coverHue)}>
        <span className="genre-pill">{story.genre || "Story"}</span>
      </div>
      <div className="card-body">
        <h3>{story.title}</h3>
        <p className="byline">
          {story.author.displayName} · {story.chapterCount} ch.
        </p>
        <p className="synopsis">{story.synopsis}</p>
      </div>
    </Link>
  );
}

export function StoryGrid({ stories, empty }: { stories: Story[]; empty: string }) {
  if (!stories.length) return <p className="muted empty">{empty}</p>;
  return (
    <div className="grid">
      {stories.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
    </div>
  );
}
