"use client";

interface BookingLinkProps {
  href: string;
  children?: React.ReactNode;
}

export function BookingLink({ href, children }: BookingLinkProps) {
  return (
    <button
      type="button"
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
      style={{
        display: "inline-block",
        marginTop: "0.5rem",
        padding: "0.75rem 1.25rem",
        background: "var(--accent)",
        color: "#0f172a",
        borderRadius: "0.5rem",
        fontWeight: 600,
        textDecoration: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      {children ?? "Book a Strategy Call"}
    </button>
  );
}
