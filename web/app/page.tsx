"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api, type Story } from "@/lib/api";
import { StoryRail, StoryCover } from "@/components/StoryCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";

const GENRES = ["All", "Fantasy", "Contemporary", "Mystery"];

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("All");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(true);
  const [filtered, setFiltered] = useState(false);
  const latestRequest = useRef(0);

  const load = useCallback(async (query: string, g: string) => {
    const requestId = ++latestRequest.current;
    setBusy(true);
    setErr("");
    setFiltered(Boolean(query.trim()) || g !== "All");
    try {
      const data = await api.stories(query, g === "All" ? "" : g);
      if (requestId !== latestRequest.current) return;
      setStories(data.stories);
    } catch (e) {
      if (requestId !== latestRequest.current) return;
      setErr(e instanceof Error ? e.message : "Could not load stories");
    } finally {
      if (requestId === latestRequest.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    const initialQ = new URLSearchParams(window.location.search).get("q") || "";
    setQ(initialQ);
    load(initialQ, "All");
    return () => {
      latestRequest.current += 1;
    };
  }, [load]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    load(q, genre);
  };

  const countLabel = `${stories.length} published ${stories.length === 1 ? "story" : "stories"}`;

  return (
    <div className="wrap">
      <section className="hero discover-hero">
        <div className="hero-header">
          <p className="kicker">Serialized fiction</p>
          <h1>Stories that linger after the lamp is out.</h1>
          <p className="lede">
            Inkwell is a serialized reading room for chaptered fiction — browse original stories, follow authors, curate your library, or start writing.
          </p>
        </div>

        {stories[0] && !filtered && (
          <aside className="featured">
            <StoryCover story={stories[0]} />
            <div>
              <p className="kicker">
                <Sparkles size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Featured Story
              </p>
              <h2>{stories[0].title}</h2>
              <p>{stories[0].synopsis}</p>
              <Link className="btn" href={`/stories/${stories[0].id}`}>
                <BookOpen size={16} aria-hidden="true" />
                <span>View story</span>
              </Link>
            </div>
          </aside>
        )}

        <aside className="hero-aside">
          <h2>Demo shelf</h2>
          <p>
            Try accounts <strong>iris</strong>, <strong>niko</strong>, or <strong>reader</strong> with demo password <code>password123</code>.
          </p>
        </aside>
      </section>

      <form className="toolbar" role="search" aria-label="Story search" onSubmit={onSearch}>
        <label htmlFor="story-search" className="sr-only">
          Search stories
        </label>
        <input
          id="story-search"
          name="q"
          type="search"
          className="search"
          placeholder="Search titles, synopses, authors…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit">
          Search
        </Button>
        <div className="chips" role="group" aria-label="Genres">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${genre === g ? "on" : ""}`}
              aria-pressed={genre === g}
              onClick={() => {
                setGenre(g);
                load(q, g);
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </form>

      <p className="muted" role="status" aria-atomic="true">
        {busy ? "Loading stories…" : err ? "Stories could not be loaded." : countLabel}
      </p>

      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}

      <div aria-busy={busy}>
        {!busy && !err && (
          stories.length > 0 ? (
            <StoryRail title={genre === "All" ? "Browse stories" : genre} stories={stories} />
          ) : (
            <p className="muted empty">
              {filtered
                ? "No stories match your search. Try another title or genre."
                : "No published stories yet. Start writing to share one."}
            </p>
          )
        )}
      </div>
    </div>
  );
}
