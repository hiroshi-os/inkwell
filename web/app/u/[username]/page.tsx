"use client";

import { useEffect, useState } from "react";
import { api, type Story, type User } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StoryGrid } from "@/components/StoryCard";

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [following, setFollowing] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [err, setErr] = useState("");
  const { authed, user: me } = useSession();

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
  if (!user) return <p className="wrap muted">Loading profile…</p>;

  const toggle = async () => {
    if (following) await api.unfollow(user.id);
    else await api.follow(user.id);
    await load();
  };

  return (
    <div className="wrap">
      <div className="profile-head">
        <div className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</div>
        <div>
          <h1 className="page-title">{user.displayName}</h1>
          <p className="muted">
            @{user.username} · {user.followers} followers · {user.following} following
          </p>
          <p className="lede" style={{ marginTop: 8 }}>
            {user.bio || "This author has not written a bio yet."}
          </p>
          {authed && me?.id !== user.id && (
            <div className="actions">
              <button className={following ? "btn ghost" : "btn"} onClick={toggle}>
                {following ? "Following" : "Follow"}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="section-head">
        <h2>Stories</h2>
      </div>
      <StoryGrid stories={stories} empty="No published stories." />
    </div>
  );
}
