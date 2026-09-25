"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getStoredUser, getToken, type Story } from "@/lib/api";

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
    <div className="wrap panel" style={{ marginTop: "1.5rem" }}>
      <h1>Your desk</h1>
      <p className="muted">Create a story, then add chapters. Public browse only shows published work.</p>
      <form onSubmit={create} className="stack">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label>Genre</label>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option>Fantasy</option>
          <option>Contemporary</option>
          <option>Mystery</option>
          <option>Romance</option>
          <option>Sci-Fi</option>
        </select>
        <label>Synopsis</label>
        <textarea style={{ minHeight: 120 }} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <div className="actions">
          <button className="btn">Start story</button>
        </div>
      </form>
      <h2 className="page-title" style={{ marginTop: "2rem" }}>
        Drafts & published
      </h2>
      <ul className="chapter-list">
        {stories.map((s) => (
          <li key={s.id}>
            <Link href={`/write/${s.id}`}>
              <span>{s.title}</span>
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
