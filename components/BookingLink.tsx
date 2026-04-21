"use client";

interface BookingLinkProps {
  href: string;
  children?: React.ReactNode;
}

export function BookingLink({ href, children }: BookingLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        marginTop: "0.5rem",
        padding: "0.75rem 1.25rem",
        background: "var(--accent)",
        color: "#0f172a",
        borderRadius: "0.5rem",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children ?? "Book a Strategy Call"}
    </a>
  );
}
