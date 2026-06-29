"use client";

/**
 * Root error boundary — replaces the whole document when the root layout itself
 * throws. Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1.25rem",
          color: "#1a1b2e",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
        <p style={{ maxWidth: "34em", color: "#5a5e72", lineHeight: 1.6 }}>
          The application hit an unexpected error{error.digest ? ` (ref: ${error.digest})` : ""}.
          Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.6rem 1.2rem",
            borderRadius: "9px",
            border: "none",
            background: "#024794",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
