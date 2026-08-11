"use client";

import React from "react";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Page Not Found</h2>
      <p style={{ color: "#64748b" }}>The requested page could not be found.</p>
      <a
        href="/"
        style={{
          display: "inline-block",
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#2563eb",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "4px",
        }}
      >
        Return Home
      </a>
    </div>
  );
}
