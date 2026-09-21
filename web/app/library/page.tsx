"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getToken, type Story } from "@/lib/api";
import { StoryGrid } from "@/components/StoryCard";

export default function LibraryPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!getToken()) {
      setStories([]);
      return;
    }
    api
      .library()
      .then((d) => setStories(d.stories))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load library"));
  }, []);

  return (
    <div className="wrap">
      <h1 className="page-title" style={{ marginTop: "1.6rem" }}>
        Library
      </h1>
      <p className="muted">Stories you save show up here. This is the MVP stand-in for a reading list — no offline downloads yet.</p>
      {!getToken() ? (
        <p>
          <Link href="/login">Log in</Link> to keep a shelf.
        </p>
      ) : (
        <>
          {err && <p className="err">{err}</p>}
          <StoryGrid stories={stories || []} empty="Nothing saved yet. Open a story and choose Save to library." />
        </>
      )}
    </div>
  );
}
