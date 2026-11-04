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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h2a5 5 0 0 1 5 4 5 5 0 0 1 5-4h2a2 2 0 0 1 2 2v13h-4a5 5 0 0 0-5 3 5 5 0 0 0-5-3z" /></svg>
          </span>
          inkwell
        </Link>
        <form className="header-search" action="/" method="get" role="search" aria-label="Site search"><label className="sr-only" htmlFor="header-search">Search site</label><input id="header-search" name="q" type="search" placeholder="Search" /></form>
        <nav className="header-nav" aria-label="Primary">
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
