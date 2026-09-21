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
      <p className="kicker">Welcome back</p>
      <h1>Log in</h1>
      <label>Username or email</label>
      <input className="full" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      <label>Password</label>
      <input className="full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      {err && <p className="err">{err}</p>}
      <div className="actions">
        <button className="btn" disabled={busy}>
          {busy ? "…" : "Enter"}
        </button>
        <Link href="/register">Need an account?</Link>
      </div>
    </form>
  );
}
