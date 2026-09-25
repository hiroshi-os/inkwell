"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, type ChapterMeta, type Story } from "@/lib/api";

export default function WriteStoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("");
  const [status, setStatus] = useState("published");
  const [chTitle, setChTitle] = useState("");
  const [chBody, setChBody] = useState("");
  const [active, setActive] = useState<ChapterMeta | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const st = await api.story(params.id);
    setStory(st);
    setTitle(st.title);
    setSynopsis(st.synopsis);
    setGenre(st.genre);
    setStatus(st.status);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    load().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const saveMeta = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.updateStory(params.id, { title, synopsis, genre, status });
      setMsg("Story details saved.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  };

  const selectChapter = async (c: ChapterMeta) => {
    const full = await api.chapter(params.id, c.id);
    setActive(c);
    setChTitle(full.title);
    setChBody(full.body);
    setMsg("");
  };

  const newChapter = async () => {
    const ch = await api.createChapter(params.id, { title: "Untitled chapter", body: "", published: true });
    await load();
    await selectChapter({ id: ch.id, title: ch.title, position: ch.position, published: ch.published, updatedAt: ch.updatedAt });
  };

  const saveChapter = async () => {
    if (!active) return;
    await api.updateChapter(params.id, active.id, { title: chTitle, body: chBody, published: true });
    setMsg("Chapter saved.");
    await load();
  };

  const removeStory = async () => {
    if (!confirm("Delete this story and its chapters?")) return;
    await api.deleteStory(params.id);
    router.push("/write");
  };

  if (!story) return <p className="wrap muted">Opening the manuscript…</p>;

  return (
    <div className="wrap" style={{ paddingTop: "1.4rem", paddingBottom: "3rem" }}>
      <div className="section-head">
        <h2>Edit story</h2>
      </div>
      <form onSubmit={saveMeta} className="stack" style={{ marginBottom: "1.4rem" }}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Genre</label>
        <input value={genre} onChange={(e) => setGenre(e.target.value)} />
        <label>Synopsis</label>
        <textarea style={{ minHeight: 90 }} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="published">published</option>
          <option value="draft">draft</option>
        </select>
        <div className="actions">
          <button className="btn">Save details</button>
          <button type="button" className="btn danger" onClick={removeStory}>
            Delete story
          </button>
        </div>
      </form>
      <div className="editor-grid">
        <aside className="chapter-nav">
          <button className="btn ghost full" type="button" onClick={newChapter}>
            + Chapter
          </button>
          {(story.chapters || []).map((c) => (
            <button key={c.id} type="button" onClick={() => selectChapter(c)}>
              {c.position}. {c.title}
            </button>
          ))}
        </aside>
        <section>
          {active ? (
            <>
              <label>Chapter title</label>
              <input className="full" value={chTitle} onChange={(e) => setChTitle(e.target.value)} />
              <label>Body</label>
              <textarea value={chBody} onChange={(e) => setChBody(e.target.value)} />
              <div className="actions">
                <button className="btn" type="button" onClick={saveChapter}>
                  Save chapter
                </button>
              </div>
            </>
          ) : (
            <p className="muted">Select a chapter or add one.</p>
          )}
          {msg && <p className="muted">{msg}</p>}
          {err && <p className="err">{err}</p>}
        </section>
      </div>
    </div>
  );
}
