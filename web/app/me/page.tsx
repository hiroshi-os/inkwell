"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setSession, type User } from "@/lib/api";

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api.me().then((u) => {
      setUser(u);
      setDisplayName(u.displayName);
      setBio(u.bio);
    });
  }, [router]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const u = await api.patchMe({ displayName, bio });
    const token = getToken();
    if (token) setSession(token, u);
    window.dispatchEvent(new Event("inkwell-auth"));
    setUser(u);
    setMsg("Profile saved.");
  };

  if (!user) return <p className="wrap muted">Loading desk…</p>;

  return (
    <form className="panel" onSubmit={save}>
      <p className="kicker">@{user.username}</p>
      <h1>Profile</h1>
      <p className="muted">
        {user.followers} followers · {user.following} following
      </p>
      <label>Display name</label>
      <input className="full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <label>Bio</label>
      <textarea style={{ minHeight: 120 }} value={bio} onChange={(e) => setBio(e.target.value)} />
      {msg && <p className="muted">{msg}</p>}
      <div className="actions">
        <button className="btn">Save</button>
      </div>
      <p className="muted" style={{ marginTop: "1.2rem" }}>
        Auth is JWT in localStorage — fine for the demo, not a hardened session design. See SYSTEM_DESIGN.md.
      </p>
    </form>
  );
}
