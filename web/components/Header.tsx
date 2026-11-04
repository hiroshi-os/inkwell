"use client";

import Link from "next/link";
import { Compass, Bookmark, PenSquare, User as UserIcon } from "lucide-react";
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
          <span className="nib" aria-hidden="true">
            <span className="dots-trio">
              <span className="dot-item dot-amber" />
              <span className="dot-item dot-green" />
              <span className="dot-item dot-cyan" />
            </span>
          </span>
          <span className="wordmark-text">inkwell</span>
        </Link>

        <form className="header-search" action="/" method="get" role="search" aria-label="Site search">
          <label className="sr-only" htmlFor="header-search">
            Search site
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="Search stories, genres, authors…"
          />
        </form>

        <nav className="header-nav" aria-label="Primary">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={pathname === "/" ? "active" : ""}
          >
            <Compass size={15} aria-hidden="true" />
            <span>Browse</span>
          </Link>

          {ready && user && (
            <Link
              href="/feed"
              aria-current={pathname === "/feed" ? "page" : undefined}
              className={pathname === "/feed" ? "active" : ""}
            >
              <span>Following</span>
            </Link>
          )}

          <Link
            href="/library"
            aria-current={pathname === "/library" ? "page" : undefined}
            className={pathname === "/library" ? "active" : ""}
          >
            <Bookmark size={15} aria-hidden="true" />
            <span>Library</span>
          </Link>

          {ready && user ? (
            <>
              <Link
                href="/write"
                aria-current={pathname?.startsWith("/write") ? "page" : undefined}
                className={pathname?.startsWith("/write") ? "active" : ""}
              >
                <PenSquare size={15} aria-hidden="true" />
                <span>Write</span>
              </Link>
              <Link
                href="/me"
                aria-current={pathname === "/me" ? "page" : undefined}
                className={pathname === "/me" ? "active" : ""}
              >
                <UserIcon size={15} aria-hidden="true" />
                <span>{user.displayName}</span>
              </Link>
              <button type="button" className="linkish" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                aria-current={pathname === "/login" ? "page" : undefined}
              >
                Log in
              </Link>
              <Link
                href="/register"
                aria-current={pathname === "/register" ? "page" : undefined}
                className="btn btn-small"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
