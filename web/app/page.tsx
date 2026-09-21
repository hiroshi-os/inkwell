"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, type Story } from "@/lib/api";
import { StoryGrid } from "@/components/StoryCard";

const GENRES = ["All", "Fantasy", "Contemporary", "Mystery"];

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [q, setQ] = useState("");
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
    load("", "All");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    load();
  };

  const countLabel = useMemo(() => `${stories.length} published ${stories.length === 1 ? "story" : "stories"}`, [stories.length]);

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <p className="kicker">Serialized fiction</p>
          <h1>Stories that linger after the lamp is out.</h1>
          <p className="lede">
            Inkwell is a small reading room for chaptered fiction — browse public stories, follow authors, keep a library, or write your own.
          </p>
        </div>
        <aside className="hero-aside">
          <h2>Demo shelf</h2>
          <p>
            Seeded as <strong>iris</strong> / <strong>niko</strong> / <strong>reader</strong> — password <code>password123</code>. API on :8080, this app on :3000.
          </p>
        </aside>
      </section>
      <form className="toolbar" onSubmit={onSearch}>
        <input className="search" placeholder="Search titles, synopses, authors" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" type="submit">
          Search
        </button>
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
      </form>
      <p className="muted">{countLabel}</p>
      {err && <p className="err">{err}</p>}
      <StoryGrid stories={stories} empty="No published stories yet. Start the API and refresh, or write one." />
    </div>
  );
}
