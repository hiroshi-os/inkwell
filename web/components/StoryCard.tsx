import Link from "next/link";
import type { CSSProperties } from "react";
import type { Story } from "@/lib/api";
import { compact, storyStats } from "@/lib/format";

export function coverStyle(hue: number): CSSProperties {
  return {
    background: `linear-gradient(165deg, hsl(${hue} 62% 42%), hsl(${(hue + 28) % 360} 48% 18%))`,
  };
}

export function StoryCover({ story, className = "" }: { story: Pick<Story, "title" | "genre" | "coverHue">; className?: string }) {
  return (
    <div className={`cover ${className}`} style={coverStyle(story.coverHue)}>
      <span className="genre-pill">{story.genre || "Story"}</span>
      <span className="cover-title">{story.title}</span>
    </div>
  );
}

export function StoryCard({ story }: { story: Story }) {
  const stats = storyStats(story);
  return (
    <Link href={`/stories/${story.id}`} className="story-card portrait">
      <StoryCover story={story} />
      <div className="card-body">
        <h3>{story.title}</h3>
        <p className="byline">{story.author.displayName}</p>
        <p className="stats">
          <span>👁 {compact(stats.reads)}</span>
          <span>★ {compact(stats.votes)}</span>
        </p>
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

export function StoryRail({ title, stories }: { title: string; stories: Story[] }) {
  if (!stories.length) return null;
  return (
    <section>
      <div className="section-head">
        <h2>{title}</h2>
        <span className="see">{stories.length} stories</span>
      </div>
      <div className="rail">
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </section>
  );
}
