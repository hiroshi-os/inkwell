"use client";

import { useEffect, useState } from "react";
import { getStoredUser, getToken, type User } from "./api";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("inkwell-auth", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("inkwell-auth", sync);
    };
  }, []);
  return {
    user,
    ready,
    authed: ready && Boolean(getToken()),
    token: ready ? getToken() : null,
  };
}
