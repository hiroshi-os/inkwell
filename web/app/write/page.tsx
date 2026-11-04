"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getStoredUser, getToken, type Story } from "@/lib/api";
import { PenTool, PlusCircle, BookOpen } from "lucide-react";

export default function WriteIndexPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("Fantasy");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const me = getStoredUser();
    if (!me) return;
    api.userStories(me.id).then((d) => setStories(d.stories)).catch((e) => setErr(e.message));
  }, [router]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const st = await api.createStory({ title, synopsis, genre, status: "published" });
      router.push(`/write/${st.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create");
    }
  };

  return (
    <div className="wrap panel" style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PenTool size={22} className="kicker" aria-hidden="true" style={{ margin: 0 }} />
        <h1>Your desk</h1>
      </div>
      <p className="muted" style={{ margin: "6px 0 20px" }}>
        Create a new serialized story, then write and publish chapters. Public browse only displays published work.
      </p>

      <form onSubmit={create} className="stack">
        <label htmlFor="new-story-title">Title</label>
        <input
          id="new-story-title"
          value={title}
          placeholder="Story title"
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label htmlFor="new-story-genre">Genre</label>
        <select
          id="new-story-genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option>Fantasy</option>
          <option>Contemporary</option>
          <option>Mystery</option>
          <option>Romance</option>
          <option>Sci-Fi</option>
        </select>

        <label htmlFor="new-story-synopsis">Synopsis</label>
        <textarea
          id="new-story-synopsis"
          style={{ minHeight: 120 }}
          placeholder="What is your story about? Introduce readers to the world and characters…"
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
        />

        {err && <p className="err" role="alert">{err}</p>}

        <div className="actions">
          <button className="btn">
            <PlusCircle size={17} aria-hidden="true" />
            <span>Start story</span>
          </button>
        </div>
      </form>

      <h2 className="page-title" style={{ marginTop: "2.5rem", fontSize: 22 }}>
        Drafts & published
      </h2>
      <ul className="chapter-list">
        {stories.map((s) => (
          <li key={s.id}>
            <Link href={`/write/${s.id}`}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BookOpen size={16} className="kicker" aria-hidden="true" style={{ margin: 0 }} />
                <span>{s.title}</span>
              </span>
              <span className="muted">
                {s.status} · {s.chapterCount} ch.
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
