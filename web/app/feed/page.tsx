"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Story } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryGrid } from "@/components/StoryCard";

export default function FeedPage() {
  const { authed, ready } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready || !authed) return;
    api
      .feed()
      .then((d) => setStories(d.stories))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load feed"));
  }, [ready, authed]);

  return (
    <div className="wrap">
      <h1 className="page-title" style={{ marginTop: "1.6rem" }}>
        Following
      </h1>
      <p className="muted">Recent published work from authors you follow. Ranked newest-first — no ML ranking in the MVP.</p>
      {ready && !authed ? (
        <p>
          <Link href="/login">Log in</Link> to assemble a feed.
        </p>
      ) : (
        <>
          {err && <p className="err">{err}</p>}
          <StoryGrid stories={stories} empty={ready ? "Follow an author from a story page. Seed user reader already follows iris." : "Loading…"} />
        </>
      )}
    </div>
  );
}
