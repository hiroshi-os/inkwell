"use client";

import { useEffect, useState } from "react";
import { api, getToken, type Story, type User } from "@/lib/api";
import { StoryGrid } from "@/components/StoryCard";

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [following, setFollowing] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [err, setErr] = useState("");
  const authed = typeof window !== "undefined" && Boolean(getToken());

  const load = async () => {
    try {
      const u = await api.user(params.username);
      setUser(u.user);
      setFollowing(u.following);
      const s = await api.userStories(u.user.id);
      setStories(s.stories);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Not found");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username]);

  if (err) return <p className="wrap err">{err}</p>;
  if (!user) return <p className="wrap muted">Looking up the byline…</p>;

  const toggle = async () => {
    if (following) await api.unfollow(user.id);
    else await api.follow(user.id);
    await load();
  };

  return (
    <div className="wrap">
      <p className="kicker" style={{ marginTop: "1.6rem" }}>
        Author
      </p>
      <h1 className="page-title">{user.displayName}</h1>
      <p className="muted">
        @{user.username} · {user.followers} followers · {user.following} following
      </p>
      <p className="lede">{user.bio || "This author has not written a bio yet."}</p>
      {authed && (
        <div className="actions">
          <button className="btn ghost" onClick={toggle}>
            {following ? "Following" : "Follow"}
          </button>
        </div>
      )}
      <h2 className="page-title">Stories</h2>
      <StoryGrid stories={stories} empty="No published stories." />
    </div>
  );
}
