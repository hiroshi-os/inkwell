"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, type ChapterMeta, type Story } from "@/lib/api";
import { Plus, Trash2, Save, FileText, Clock, PenTool } from "lucide-react";

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
  const [busy, setBusy] = useState(false);

  const runAction = async (action: () => Promise<void>) => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The change could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

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
    await runAction(async () => {
      await api.updateStory(params.id, { title, synopsis, genre, status });
      setMsg("Story details saved.");
      await load();
    });
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

  if (!story) return <p className={err ? "wrap err" : "wrap muted"} role={err ? "alert" : "status"}>{err || "Opening the manuscript…"}</p>;

  const currentWords = chBody.split(/\s+/).filter(Boolean).length;
  const currentReadMins = Math.max(1, Math.round(currentWords / 200));

  return (
    <div className="wrap" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PenTool size={22} className="kicker" aria-hidden="true" style={{ margin: 0 }} />
        <h1 className="page-title">Edit story</h1>
      </div>

      <form onSubmit={saveMeta} className="stack" style={{ marginBottom: "2rem" }}>
        <label htmlFor="story-title">Title</label>
        <input id="story-title" required value={title} onChange={(e) => setTitle(e.target.value)} />

        <label htmlFor="story-genre">Genre</label>
        <input id="story-genre" value={genre} onChange={(e) => setGenre(e.target.value)} />

        <label htmlFor="story-synopsis">Synopsis</label>
        <textarea id="story-synopsis" style={{ minHeight: 90 }} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />

        <label htmlFor="story-status">Status</label>
        <select id="story-status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="published">published</option>
          <option value="draft">draft</option>
        </select>

        <div className="actions">
          <button className="btn" disabled={busy}>
            <Save size={16} aria-hidden="true" />
            <span>Save details</span>
          </button>
          <button type="button" className="btn danger" disabled={busy} onClick={() => runAction(removeStory)}>
            <Trash2 size={16} aria-hidden="true" />
            <span>Delete story</span>
          </button>
        </div>
      </form>

      <div className="editor-grid">
        <aside className="chapter-nav" aria-label="Story chapters">
          <button className="btn ghost full" type="button" disabled={busy} onClick={() => runAction(newChapter)}>
            <Plus size={16} aria-hidden="true" />
            <span>+ Chapter</span>
          </button>
          {(story.chapters || []).map((c) => (
            <button key={c.id} type="button" aria-pressed={active?.id === c.id} disabled={busy} onClick={() => runAction(() => selectChapter(c))}>
              {c.position}. {c.title}
            </button>
          ))}
        </aside>

        <section>
          {active ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                <label htmlFor="chapter-title">Chapter title</label>
                <span className="muted" style={{ fontSize: 13, display: "inline-flex", gap: 10, alignItems: "center" }}>
                  <span><FileText size={13} style={{ display: "inline", verticalAlign: "middle" }} /> {currentWords} words</span>
                  <span><Clock size={13} style={{ display: "inline", verticalAlign: "middle" }} /> ~{currentReadMins} min read</span>
                </span>
              </div>
              <input id="chapter-title" className="full" value={chTitle} onChange={(e) => setChTitle(e.target.value)} />

              <label htmlFor="chapter-body">Body</label>
              <textarea id="chapter-body" value={chBody} onChange={(e) => setChBody(e.target.value)} style={{ minHeight: 340 }} />

              <div className="actions">
                <button className="btn" type="button" disabled={busy} onClick={() => runAction(saveChapter)}>
                  <Save size={16} aria-hidden="true" />
                  <span>Save chapter</span>
                </button>
              </div>
            </>
          ) : (
            <div className="panel" style={{ textAlign: "center", margin: "20px 0" }}>
              <FileText size={32} className="kicker" aria-hidden="true" style={{ margin: "0 auto 8px" }} />
              <p className="muted">Select a chapter from the list or click &quot;+ Chapter&quot; to begin writing.</p>
            </div>
          )}
          <p className="muted" role="status" style={{ marginTop: 12 }}>{busy ? "Saving…" : msg}</p>
          {err && <p className="err" role="alert">{err}</p>}
        </section>
      </div>
    </div>
  );
}
