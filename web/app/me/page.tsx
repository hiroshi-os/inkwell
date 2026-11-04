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
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api.me().then((u) => {
      setUser(u);
      setDisplayName(u.displayName);
      setBio(u.bio);
    }).catch((e) => setErr(e instanceof Error ? e.message : "Could not load profile."));
  }, [router]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const u = await api.patchMe({ displayName, bio });
      const token = getToken();
      if (token) setSession(token, u);
      window.dispatchEvent(new Event("inkwell-auth"));
      setUser(u);
      setMsg("Profile saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save profile. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <p className={err ? "wrap err" : "wrap muted"} role={err ? "alert" : "status"}>{err || "Loading desk…"}</p>;

  return (
    <form className="panel" onSubmit={save}>
      <p className="kicker">@{user.username}</p>
      <h1>Profile</h1>
      <p className="muted">
        {user.followers} followers · {user.following} following
      </p>
      <label htmlFor="profile-name">Display name</label>
      <input id="profile-name" className="full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <label htmlFor="profile-bio">Bio</label>
      <textarea id="profile-bio" style={{ minHeight: 120 }} value={bio} onChange={(e) => setBio(e.target.value)} />
      <p className="muted" role="status">{busy ? "Saving profile…" : msg}</p>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions">
        <button className="btn" disabled={busy}>Save</button>
      </div>
      <p className="muted" style={{ marginTop: "1.2rem" }}>
        Auth is JWT in localStorage — fine for the demo, not a hardened session design. See SYSTEM_DESIGN.md.
      </p>
    </form>
  );
}
