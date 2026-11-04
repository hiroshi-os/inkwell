"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Story } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryGrid } from "@/components/StoryCard";

export default function LibraryPage() {
  const { authed, ready } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !authed) return;
    api
      .library()
      .then((d) => setStories(d.stories))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load library"))
      .finally(() => setLoading(false));
  }, [ready, authed]);

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 24 }}>
        <h2>Library</h2>
        <span className="see">Saved stories</span>
      </div>
      {ready && !authed ? (
        <p>
          <Link href="/login">Log in</Link> to keep stories in your library.
        </p>
      ) : (
        <>
          {err && <p className="err">{err}</p>}
          {!err && (loading ? <p className="muted" role="status">Loading your library…</p> : <StoryGrid stories={stories} empty="Nothing saved yet. Open a story to add it to your library." />)}
        </>
      )}
    </div>
  );
}
