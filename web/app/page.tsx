"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, type Story } from "@/lib/api";
import { StoryCover, StoryRail } from "@/components/StoryCard";
import { compact, storyStats } from "@/lib/format";
import { Suspense } from "react";

const GENRES = ["All", "Fantasy", "Contemporary", "Mystery", "Romance", "Sci-Fi"];

function HomeInner() {
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const [stories, setStories] = useState<Story[]>([]);
  const [q, setQ] = useState(initialQ);
  const [genre, setGenre] = useState("All");
  const [err, setErr] = useState("");

  const load = async (query = q, g = genre) => {
    try {
      setErr("");
      const data = await api.stories(query, g === "All" ? "" : g);
      setStories(data.stories);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load stories");
    }
  };

  useEffect(() => {
    setQ(initialQ);
    load(initialQ, "All");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  const featured = stories[0];
  const featuredStats = featured ? storyStats(featured) : null;
  const byGenre = useMemo(() => {
    const groups: Record<string, Story[]> = {};
    for (const s of stories) {
      const g = s.genre || "Other";
      (groups[g] ||= []).push(s);
    }
    return groups;
  }, [stories]);

  return (
    <div className="wrap">
      {featured && !q && genre === "All" && (
        <section className="discover-hero">
          <p className="kicker">Featured</p>
          <div className="featured">
            <StoryCover story={featured} />
            <div>
              <h1>{featured.title}</h1>
              <p className="byline">
                by <Link href={`/u/${featured.author.username}`}>{featured.author.displayName}</Link>
              </p>
              <p className="muted">
                {compact(featuredStats!.reads)} Reads · {compact(featuredStats!.votes)} Votes · {featuredStats!.parts} Parts
              </p>
              <p className="synopsis">{featured.synopsis}</p>
              <Link className="btn" href={`/stories/${featured.id}`}>
                Start reading
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="chips">
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            className={`chip ${genre === g ? "on" : ""}`}
            onClick={() => {
              setGenre(g);
              load(q, g);
            }}
          >
            {g}
          </button>
        ))}
      </div>
      {err && <p className="err">{err}</p>}
      {q && <p className="muted">Results for “{q}”</p>}

      {!q && genre === "All" ? (
        <>
          <StoryRail title="Trending" stories={stories} />
          {Object.entries(byGenre).map(([g, list]) => (
            <StoryRail key={g} title={g} stories={list} />
          ))}
        </>
      ) : (
        <StoryRail title={genre === "All" ? "Stories" : genre} stories={stories} />
      )}
      {!stories.length && <p className="muted empty">No stories yet. Start the API or write one.</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<p className="wrap muted">Loading…</p>}>
      <HomeInner />
    </Suspense>
  );
}
