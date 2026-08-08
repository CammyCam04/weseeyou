"use client";

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
        <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", padding: "2rem", fontFamily: "sans-serif" }}>
          <h2>Application Error</h2>
          <p style={{ color: "#64748b" }}>An unexpected error occurred in the transparency portal.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
