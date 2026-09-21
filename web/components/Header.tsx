"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getStoredUser, type User } from "@/lib/api";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", onStorage);
    window.addEventListener("inkwell-auth", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("inkwell-auth", onStorage);
    };
  }, [pathname]);

  const logout = () => {
    clearSession();
    window.dispatchEvent(new Event("inkwell-auth"));
    router.push("/");
    setUser(null);
  };

  return (
    <header className="site-header">
      <div className="row">
        <Link href="/" className="wordmark">
          <span className="nib" aria-hidden>
            ✎
          </span>
          inkwell
        </Link>
        <nav>
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            Browse
          </Link>
          {user && (
            <Link href="/feed" className={pathname === "/feed" ? "active" : ""}>
              Following
            </Link>
          )}
          <Link href="/library" className={pathname === "/library" ? "active" : ""}>
            Library
          </Link>
          {user ? (
            <>
              <Link href="/write" className={pathname?.startsWith("/write") ? "active" : ""}>
                Write
              </Link>
              <Link href="/me" className={pathname === "/me" ? "active" : ""}>
                {user.displayName}
              </Link>
              <button className="linkish" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn btn-small">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
