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

  useEffect(() => {
    if (!ready || !authed) return;
    api
      .library()
      .then((d) => setStories(d.stories))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load library"));
  }, [ready, authed]);

  return (
    <div className="wrap">
      <h1 className="page-title" style={{ marginTop: "1.6rem" }}>
        Library
      </h1>
      <p className="muted">Stories you save show up here. This is the MVP stand-in for a reading list — no offline downloads yet.</p>
      {ready && !authed ? (
        <p>
          <Link href="/login">Log in</Link> to keep a shelf.
        </p>
      ) : (
        <>
          {err && <p className="err">{err}</p>}
          <StoryGrid stories={stories} empty={ready ? "Nothing saved yet. Open a story and choose Save to library." : "Loading…"} />
        </>
      )}
    </div>
  );
}
