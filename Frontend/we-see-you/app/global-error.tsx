"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#f8fafc", backgroundColor: "#0f172a", minHeight: "100vh" }}>
          <h2>Something went wrong!</h2>
          {error?.message && <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>{error.message}</p>}
          <button
            onClick={() => reset()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "8px", background: "#38bdf8", color: "#0f172a", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
