"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Story } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryRail } from "@/components/StoryCard";
import { Users } from "lucide-react";

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
      <div className="section-head" style={{ marginTop: 28, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={22} className="kicker" aria-hidden="true" style={{ margin: 0 }} />
          <h2>Following</h2>
        </div>
      </div>

      {ready && !authed ? (
        <div className="panel" style={{ textAlign: "center", margin: "40px auto" }}>
          <Users size={36} className="kicker" aria-hidden="true" style={{ margin: "0 auto 12px" }} />
          <h2>Follow Your Favorite Authors</h2>
          <p className="muted" style={{ margin: "8px 0 20px" }}>
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 700 }}>Log in</Link> to see updates from people you follow.
          </p>
        </div>
      ) : (
        <>
          {err && <p className="err" role="alert">{err}</p>}
          <StoryRail title="From authors you follow" stories={stories} />
          {!stories.length && ready && (
            <p className="muted empty">Follow an author from a story page.</p>
          )}
        </>
      )}
    </div>
  );
}
