"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/api";
import { useSession } from "@/lib/session";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useSession();

  const logout = () => {
    clearSession();
    window.dispatchEvent(new Event("inkwell-auth"));
    router.push("/");
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
        <nav aria-label="Primary">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={pathname === "/" ? "active" : ""}>
            Browse
          </Link>
          {ready && user && (
            <Link href="/feed" aria-current={pathname === "/feed" ? "page" : undefined} className={pathname === "/feed" ? "active" : ""}>
              Following
            </Link>
          )}
          <Link href="/library" aria-current={pathname === "/library" ? "page" : undefined} className={pathname === "/library" ? "active" : ""}>
            Library
          </Link>
          {ready && user ? (
            <>
              <Link href="/write" aria-current={pathname?.startsWith("/write") ? "page" : undefined} className={pathname?.startsWith("/write") ? "active" : ""}>
                Write
              </Link>
              <Link href="/me" aria-current={pathname === "/me" ? "page" : undefined} className={pathname === "/me" ? "active" : ""}>
                {user.displayName}
              </Link>
              <button className="linkish" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" aria-current={pathname === "/login" ? "page" : undefined}>Log in</Link>
              <Link href="/register" aria-current={pathname === "/register" ? "page" : undefined} className="btn btn-small">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
