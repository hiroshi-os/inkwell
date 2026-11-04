"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Story } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryCover } from "@/components/StoryCard";
import { BookOpen, Bookmark, BookmarkCheck, UserCheck, UserPlus, Clock, ListOrdered, Edit3 } from "lucide-react";

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

  if (err) return <p className="wrap err" role="alert">{err}</p>;
  if (!story) return <p className="wrap muted" role="status">Loading story…</p>;

  const first = story.chapters?.find((c) => c.published) || story.chapters?.[0];
  const isAuthor = Boolean(me && me.id === story.author.id);

  const totalWords = (story.chapters || []).reduce((acc, c) => acc + (c.wordCount || 0), 0);
  const estimatedMins = Math.max(1, Math.round(totalWords / 200));

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
          <p className="kicker">{story.genre || "Serialized Novel"}</p>
          <h1>{story.title}</h1>
          <p className="byline">
            by <Link href={`/u/${story.author.username}`}>{story.author.displayName}</Link>
          </p>

          <div className="chips" style={{ marginTop: 8 }}>
            <span className="chip on">{story.genre || "Story"}</span>
            <span className="chip">{story.status === "published" ? "Ongoing" : "Draft"}</span>
          </div>

          <div className="story-meta">
            <span>
              <BookOpen size={15} aria-hidden="true" />
              <span>{story.chapterCount} chapters</span>
            </span>
            {totalWords > 0 && (
              <span>
                <Clock size={15} aria-hidden="true" />
                <span>~{estimatedMins} min read</span>
              </span>
            )}
          </div>

          <p className="lede">{story.synopsis}</p>

          <div className="actions">
            {first && (
              <Link className="btn" href={`/stories/${story.id}/read/${first.id}`}>
                <BookOpen size={17} aria-hidden="true" />
                <span>Start reading</span>
              </Link>
            )}
            {isAuthor && (
              <Link className="btn ghost" href={`/write/${story.id}`}>
                <Edit3 size={15} aria-hidden="true" />
                <span>Edit</span>
              </Link>
            )}
            {authed ? (
              <>
                <button
                  type="button"
                  className={story.inLibrary ? "btn" : "btn ghost"}
                  disabled={busy}
                  onClick={toggleLibrary}
                >
                  {story.inLibrary ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                  <span>{story.inLibrary ? "In library" : "Save to library"}</span>
                </button>
                {!isAuthor && (
                  <button
                    type="button"
                    className={story.followingAuthor ? "btn" : "btn ghost"}
                    disabled={busy}
                    onClick={toggleFollow}
                  >
                    {story.followingAuthor ? <UserCheck size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
                    <span>{story.followingAuthor ? "Following" : "Follow author"}</span>
                  </button>
                )}
              </>
            ) : (
              <Link className="btn ghost" href="/login">
                Log in to follow or add
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 32 }}>
        <ListOrdered size={20} className="kicker" aria-hidden="true" />
        <h2 className="toc-title" style={{ margin: 0 }}>Table of Contents</h2>
      </div>

      <ul className="chapter-list">
        {(story.chapters || []).map((c) => {
          const chMins = c.wordCount ? Math.max(1, Math.round(c.wordCount / 200)) : 1;
          return (
            <li key={c.id}>
              {c.published ? (
                <Link href={`/stories/${story.id}/read/${c.id}`}>
                  <span>
                    {c.position}. {c.title}
                  </span>
                  <span className="muted" style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
                    <span>~{chMins} min read</span>
                    <span>{c.wordCount} words</span>
                  </span>
                </Link>
              ) : (
                <div className="rowish">
                  <span>
                    {c.position}. {c.title} (draft)
                  </span>
                  <span className="muted">Unpublished</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
