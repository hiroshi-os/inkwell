"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Story } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryCover } from "@/components/StoryCard";
import { compact, storyStats } from "@/lib/format";

export default function StoryPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { user: me, authed } = useSession();

  const load = async () => {
    try {
      setStory(await api.story(params.id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Not found");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (err) return <p className="wrap err">{err}</p>;
  if (!story) return <p className="wrap muted">Loading story…</p>;

  const first = story.chapters?.find((c) => c.published) || story.chapters?.[0];
  const isAuthor = Boolean(me && me.id === story.author.id);
  const stats = storyStats(story);

  const toggleLibrary = async () => {
    if (!authed) return;
    setBusy(true);
    try {
      if (story.inLibrary) await api.removeLibrary(story.id);
      else await api.addLibrary(story.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const toggleFollow = async () => {
    if (!authed) return;
    setBusy(true);
    try {
      if (story.followingAuthor) await api.unfollow(story.author.id);
      else await api.follow(story.author.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap">
      <div className="story-hero">
        <StoryCover story={story} />
        <div>
          <h1>{story.title}</h1>
          <p className="byline">
            by <Link href={`/u/${story.author.username}`}>{story.author.displayName}</Link>
          </p>
          <div className="chips" style={{ marginTop: 8 }}>
            <span className="chip on">{story.genre || "Story"}</span>
            <span className="chip">{story.status === "published" ? "Ongoing" : "Draft"}</span>
          </div>
          <p className="story-meta">
            <span>👁 {compact(stats.reads)} Reads</span>
            <span>★ {compact(stats.votes)} Votes</span>
            <span>☰ {stats.parts} Parts</span>
          </p>
          <p className="lede">{story.synopsis}</p>
          <div className="actions">
            {first && (
              <Link className="btn" href={`/stories/${story.id}/read/${first.id}`}>
                Start reading
              </Link>
            )}
            {isAuthor && (
              <Link className="btn ghost" href={`/write/${story.id}`}>
                Edit
              </Link>
            )}
            {authed ? (
              <>
                <button className="btn ghost" disabled={busy} onClick={toggleLibrary}>
                  {story.inLibrary ? "Added" : "+ Add"}
                </button>
                {!isAuthor && (
                  <button className="btn ghost" disabled={busy} onClick={toggleFollow}>
                    {story.followingAuthor ? "Following" : "Follow"}
                  </button>
                )}
              </>
            ) : (
              <Link href="/login">Log in to follow or add</Link>
            )}
          </div>
        </div>
      </div>
      <h2 className="toc-title">Table of Contents</h2>
      <ul className="chapter-list">
        {(story.chapters || []).map((c) => (
          <li key={c.id}>
            {c.published ? (
              <Link href={`/stories/${story.id}/read/${c.id}`}>
                <span>
                  {c.position}. {c.title}
                </span>
                <span className="muted">{c.wordCount} words</span>
              </Link>
            ) : (
              <div className="rowish">
                <span>
                  {c.position}. {c.title} (draft)
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
