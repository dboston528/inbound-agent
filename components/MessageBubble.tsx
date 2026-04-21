"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "0.75rem",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "0.75rem 1rem",
          borderRadius: "1rem",
          background: isUser ? "var(--accent)" : "var(--chat-surface)",
          color: isUser ? "#0f172a" : "var(--chat-text)",
          border: isUser ? "none" : "1px solid var(--chat-border)",
        }}
      >
        <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {content}
        </p>
      </div>
    </div>
  );
}
