"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageBubble } from "./MessageBubble";
import { BookingLink } from "./BookingLink";

const SESSION_KEY = "agent_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function ChatWidget() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingLink, setBookingLink] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || isComplete) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.current,
          message: userMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error ?? "Something went wrong. Please try again.",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      if (data.isComplete) {
        setIsComplete(true);
        if (data.bookingLink) {
          setBookingLink(data.bookingLink);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry — something went wrong. Let's continue.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "var(--chat-surface)",
        borderRadius: "1rem",
        border: "1px solid var(--chat-border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--chat-border)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Chat with us
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--chat-muted)",
            marginTop: "0.25rem",
          }}
        >
          We&apos;ll help you explore automation options
        </p>
      </div>

      <div
        style={{
          height: "320px",
          overflowY: "auto",
          padding: "1rem",
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              color: "var(--chat-muted)",
              fontSize: "0.875rem",
            }}
          >
            Say hi to get started
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {bookingLink && (
          <div style={{ marginTop: "0.5rem" }}>
            <BookingLink href={bookingLink} />
          </div>
        )}
        {loading && (
          <MessageBubble
            role="assistant"
            content="..."
          />
        )}
        <div ref={bottomRef} />
      </div>

      {!isComplete && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--chat-border)",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--chat-border)",
                background: "var(--chat-bg)",
                color: "var(--chat-text)",
                fontSize: "0.9375rem",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                background: "var(--accent)",
                color: "#0f172a",
                border: "none",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
