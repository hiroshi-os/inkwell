import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--sans" });

export const metadata: Metadata = {
  title: "Inkwell — Stories you'll obsess over",
  description: "Read and write serialized stories. Browse, follow, and keep a library.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={sans.variable} style={{ fontFamily: "var(--sans)" }}>
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">Inkwell · read, write, obsess.</div>
        </footer>
      </body>
    </html>
  );
}
