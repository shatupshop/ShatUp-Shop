import type { Metadata } from "next";

// The admin panel must never show up in search engines.
export const metadata: Metadata = {
  title: "ShatUp Admin",
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
