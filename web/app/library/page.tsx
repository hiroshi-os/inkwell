"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Story } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryGrid } from "@/components/StoryCard";
import { Bookmark, Sparkles } from "lucide-react";

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
      <div className="section-head" style={{ marginTop: 28, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bookmark size={22} className="kicker" aria-hidden="true" style={{ margin: 0 }} />
          <h2>Library</h2>
        </div>
        <span className="see">Saved stories</span>
      </div>

      {ready && !authed ? (
        <div className="panel" style={{ textAlign: "center", margin: "40px auto" }}>
          <Bookmark size={36} className="kicker" aria-hidden="true" style={{ margin: "0 auto 12px" }} />
          <h2>Your Personal Bookshelf</h2>
          <p className="muted" style={{ margin: "8px 0 20px" }}>
            Keep track of your favorite stories, save chapters for later, and follow ongoing series.
          </p>
          <Link className="btn" href="/login">
            Log in to your library
          </Link>
        </div>
      ) : (
        <>
          {err && <p className="err" role="alert">{err}</p>}
          {!err && (
            loading ? (
              <p className="muted" role="status">Loading your library…</p>
            ) : (
              <StoryGrid
                stories={stories}
                empty="Nothing saved yet. Open a story to add it to your library."
              />
            )
          )}
        </>
      )}
    </div>
  );
}
