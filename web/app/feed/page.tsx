"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Story } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryRail } from "@/components/StoryCard";

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
      <div className="section-head" style={{ marginTop: 24 }}>
        <h2>Following</h2>
      </div>
      {ready && !authed ? (
        <p>
          <Link href="/login">Log in</Link> to see updates from people you follow.
        </p>
      ) : (
        <>
          {err && <p className="err">{err}</p>}
          <StoryRail title="From authors you follow" stories={stories} />
          {!stories.length && ready && <p className="muted empty">Follow an author from a story page.</p>}
        </>
      )}
    </div>
  );
}
