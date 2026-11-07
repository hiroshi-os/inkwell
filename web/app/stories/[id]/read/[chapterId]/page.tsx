"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Chapter } from "@/lib/api";
import { ChevronLeft, ChevronRight, BookOpen, Sun, Moon, Type } from "lucide-react";

export default function ReaderPage({ params }: { params: { id: string; chapterId: string } }) {
  const [ch, setCh] = useState<Chapter | null>(null);
  const [err, setErr] = useState("");

  // Reader settings
  const [theme, setTheme] = useState<"dark" | "sepia" | "light">("dark");
  const [font, setFont] = useState<"serif" | "sans">("serif");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    api
      .chapter(params.id, params.chapterId)
      .then(setCh)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load chapter"));
  }, [params.id, params.chapterId]);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setScrollProgress(100);
        return;
      }
      const current = el.scrollTop;
      setScrollProgress(Math.min(100, Math.max(0, Math.round((current / total) * 100))));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (err) return <p className="wrap err" role="alert">{err}</p>;
  if (!ch) return <p className="wrap muted" role="status">Turning the page…</p>;

  const words = ch.wordCount || ch.body.split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(words / 200));

  const fontSizeStyle = fontSize === "sm" ? "17px" : fontSize === "lg" ? "22px" : "19px";

  return (
    <div className="reader-shell">
      {/* Reading Progress Indicator */}
      <div
        style={{
          position: "sticky",
          top: 64,
          left: 0,
          right: 0,
          height: 3,
          background: "transparent",
          zIndex: 30,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${scrollProgress}%`,
            background: "var(--accent)",
            transition: "width 0.1s ease-out",
          }}
          aria-hidden="true"
        />
      </div>

      <article className={`reader theme-${theme} font-${font}`}>
        {/* Reader Appearance Toolbar */}
        <div className="reader-control-bar" role="toolbar" aria-label="Reader appearance settings">
          <div className="reader-control-group">
            <button
              type="button"
              className={`reader-btn ${font === "serif" ? "active" : ""}`}
              onClick={() => setFont("serif")}
              title="Serif font"
            >
              <Type size={13} style={{ display: "inline", marginRight: 4 }} />
              Serif
            </button>
            <button
              type="button"
              className={`reader-btn ${font === "sans" ? "active" : ""}`}
              onClick={() => setFont("sans")}
              title="Sans-serif font"
            >
              Sans
            </button>
          </div>

          <div className="reader-control-group">
            <button
              type="button"
              className={`reader-btn ${fontSize === "sm" ? "active" : ""}`}
              onClick={() => setFontSize("sm")}
              title="Smaller font"
            >
              A-
            </button>
            <button
              type="button"
              className={`reader-btn ${fontSize === "md" ? "active" : ""}`}
              onClick={() => setFontSize("md")}
              title="Default font"
            >
              A
            </button>
            <button
              type="button"
              className={`reader-btn ${fontSize === "lg" ? "active" : ""}`}
              onClick={() => setFontSize("lg")}
              title="Larger font"
            >
              A+
            </button>
          </div>

          <div className="reader-control-group">
            <button
              type="button"
              className={`reader-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
              title="Dark theme"
            >
              <Moon size={13} style={{ display: "inline", marginRight: 4 }} />
              Dark
            </button>
            <button
              type="button"
              className={`reader-btn ${theme === "sepia" ? "active" : ""}`}
              onClick={() => setTheme("sepia")}
              title="Sepia theme"
            >
              Sepia
            </button>
            <button
              type="button"
              className={`reader-btn ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
              title="Light theme"
            >
              <Sun size={13} style={{ display: "inline", marginRight: 4 }} />
              Light
            </button>
          </div>
        </div>

        <p className="kicker">
          <Link href={`/stories/${ch.storyId}`}>{ch.storyTitle}</Link>
          {" · "}Chapter {ch.position}
        </p>

        <h1>{ch.title}</h1>

        <div className="muted" style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 24, fontSize: 13.5 }}>
          <span>📖 ~{readMins} min read</span>
          <span>·</span>
          <span>{words} words</span>
          <span>·</span>
          <span>{scrollProgress}% completed</span>
        </div>

        <div className="prose" style={{ fontSize: fontSizeStyle }}>
          {ch.body}
        </div>

        <nav className="pager" aria-label="Chapter navigation">
          {ch.prevId ? (
            <Link href={`/stories/${ch.storyId}/read/${ch.prevId}`}>
              <ChevronLeft size={16} aria-hidden="true" />
              <span>← Previous</span>
            </Link>
          ) : (
            <span className="muted">Beginning</span>
          )}

          <Link href={`/stories/${ch.storyId}`} className="ghost" style={{ fontSize: 13.5, padding: "6px 14px" }}>
            <BookOpen size={14} aria-hidden="true" />
            <span>Table of Contents</span>
          </Link>

          {ch.nextId ? (
            <Link href={`/stories/${ch.storyId}/read/${ch.nextId}`}>
              <span>Next →</span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span className="muted">End of published chapters</span>
          )}
        </nav>
      </article>
    </div>
  );
}
