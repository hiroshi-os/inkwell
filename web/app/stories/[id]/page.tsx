"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getToken, type Story } from "@/lib/api";
import { coverStyle } from "@/components/StoryCard";

export default function StoryPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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
  if (!story) return <p className="wrap muted">Setting type…</p>;

  const first = story.chapters?.find((c) => c.published) || story.chapters?.[0];
  const authed = Boolean(getToken());

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
        <div className="cover" style={coverStyle(story.coverHue)} />
        <div>
          <p className="kicker">{story.genre || "Story"}</p>
          <h1>{story.title}</h1>
          <p className="byline">
            by <Link href={`/u/${story.author.username}`}>{story.author.displayName}</Link> · {story.chapterCount} published chapters
          </p>
          <p className="lede" style={{ marginTop: "0.8rem" }}>
            {story.synopsis}
          </p>
          <div className="actions">
            {first && (
              <Link className="btn" href={`/stories/${story.id}/read/${first.id}`}>
                Start reading
              </Link>
            )}
            {authed ? (
              <>
                <button className="btn ghost" disabled={busy} onClick={toggleLibrary}>
                  {story.inLibrary ? "In library" : "Save to library"}
                </button>
                <button className="btn ghost" disabled={busy} onClick={toggleFollow}>
                  {story.followingAuthor ? "Following" : "Follow author"}
                </button>
              </>
            ) : (
              <Link href="/login">Log in to follow or save</Link>
            )}
          </div>
        </div>
      </div>
      <h2 className="page-title">Chapters</h2>
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
