"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Chapter } from "@/lib/api";

export default function ReaderPage({ params }: { params: { id: string; chapterId: string } }) {
  const [ch, setCh] = useState<Chapter | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .chapter(params.id, params.chapterId)
      .then(setCh)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load chapter"));
  }, [params.id, params.chapterId]);

  if (err) return <p className="wrap err">{err}</p>;
  if (!ch) return <p className="wrap muted">Loading part…</p>;

  return (
    <div className="reader-shell">
      <article className="reader">
        <Link className="story-link" href={`/stories/${ch.storyId}`}>
          {ch.storyTitle}
        </Link>
        <p className="muted">Part {ch.position}</p>
        <h1>{ch.title}</h1>
        <div className="prose">{ch.body}</div>
        <nav className="pager">
          {ch.prevId ? (
            <Link href={`/stories/${ch.storyId}/read/${ch.prevId}`}>← Previous Part</Link>
          ) : (
            <span className="muted">Beginning</span>
          )}
          {ch.nextId ? (
            <Link href={`/stories/${ch.storyId}/read/${ch.nextId}`}>Next Part →</Link>
          ) : (
            <span className="muted">End of published parts</span>
          )}
        </nav>
      </article>
    </div>
  );
}
