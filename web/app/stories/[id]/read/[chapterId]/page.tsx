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
  if (!ch) return <p className="wrap muted">Turning the page…</p>;

  return (
    <article className="reader">
      <p className="kicker">
        <Link href={`/stories/${ch.storyId}`}>{ch.storyTitle}</Link>
        {" · "}Chapter {ch.position}
      </p>
      <h1>{ch.title}</h1>
      <div className="prose">{ch.body}</div>
      <nav className="pager">
        {ch.prevId ? (
          <Link href={`/stories/${ch.storyId}/read/${ch.prevId}`}>← Previous</Link>
        ) : (
          <span className="muted">Beginning</span>
        )}
        {ch.nextId ? (
          <Link href={`/stories/${ch.storyId}/read/${ch.nextId}`}>Next →</Link>
        ) : (
          <span className="muted">End of published chapters</span>
        )}
      </nav>
    </article>
  );
}
