import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Figtree, Fraunces } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--sans" });
const serif = Fraunces({ subsets: ["latin"], variable: "--serif" });

export const metadata: Metadata = {
  title: "Inkwell — stories, serialized",
  description: "A small storytelling platform for serialized fiction. Browse, read, follow, write.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Header />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <footer className="site-footer">
          <div className="wrap">Inkwell · serialized fiction and chaptered stories.</div>
        </footer>
      </body>
    </html>
  );
}
