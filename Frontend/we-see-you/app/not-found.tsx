"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#f8fafc" }}>
      <h2>404 - Page Not Found</h2>
      <p style={{ marginTop: "1rem", color: "#94a3b8" }}>The requested page could not be found.</p>
      <Link href="/" style={{ marginTop: "1.5rem", display: "inline-block", color: "#38bdf8", fontWeight: 600 }}>
        Return to Home
      </Link>
    </div>
  );
}
