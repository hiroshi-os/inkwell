"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";
import { UserPlus } from "lucide-react";

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
      <p className="kicker">New desk</p>
      <h1>Create an account</h1>
      <label htmlFor="register-username">Username</label>
      <input
        id="register-username"
        name="username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={24}
        aria-describedby="username-hint"
        className="full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <p id="username-hint" className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Use 3–24 lowercase letters, numbers, or underscores.
      </p>

      <label htmlFor="register-email">Email</label>
      <input
        id="register-email"
        name="email"
        autoComplete="email"
        required
        className="full"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="register-name">Display name</label>
      <input
        id="register-name"
        name="displayName"
        autoComplete="nickname"
        className="full"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <label htmlFor="register-password">Password</label>
      <input
        id="register-password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        aria-describedby="password-hint"
        className="full"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <p id="password-hint" className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Use at least 8 characters.
      </p>

      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}

      <div className="actions">
        <button className="btn" disabled={busy}>
          <UserPlus size={16} aria-hidden="true" />
          <span>{busy ? "Creating account…" : "Join Inkwell"}</span>
        </button>
        <Link href="/login" className="ghost" style={{ fontSize: 13.5, padding: "8px 16px", borderRadius: "9999px" }}>
          Already writing?
        </Link>
      </div>
    </form>
  );
}
