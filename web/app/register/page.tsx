"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { token, user } = await api.register({ username, email, password, displayName });
      setSession(token, user);
      window.dispatchEvent(new Event("inkwell-auth"));
      router.push("/write");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not register");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <div className="wordmark" style={{ marginBottom: 12 }}>
        <span className="wp-mark">i</span>
        <span className="wordmark-text">inkwell</span>
      </div>
      <h1>Sign up</h1>
      <label>Username</label>
      <input className="full" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="lowercase, 3–24 chars" />
      <label>Email</label>
      <input className="full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label>Display name</label>
      <input className="full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <label>Password</label>
      <input className="full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p className="err">{err}</p>}
      <div className="actions">
        <button className="btn full" disabled={busy}>
          {busy ? "…" : "Sign up"}
        </button>
      </div>
      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
