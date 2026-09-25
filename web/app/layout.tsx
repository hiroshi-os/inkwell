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
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">Inkwell MVP · original fiction, not a Wattpad clone.</div>
        </footer>
      </body>
    </html>
  );
}
