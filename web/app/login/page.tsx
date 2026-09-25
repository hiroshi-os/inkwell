"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("iris");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { token, user } = await api.login({ username, password });
      setSession(token, user);
      window.dispatchEvent(new Event("inkwell-auth"));
      router.push("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
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
      <h1>Log in</h1>
      <label>Username or email</label>
      <input className="full" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      <label>Password</label>
      <input className="full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      {err && <p className="err">{err}</p>}
      <div className="actions">
        <button className="btn full" disabled={busy}>
          {busy ? "…" : "Log in"}
        </button>
      </div>
      <p className="muted" style={{ marginTop: 16 }}>
        Don&apos;t have an account? <Link href="/register">Sign up</Link>
      </p>
    </form>
  );
}
