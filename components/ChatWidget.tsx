"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageBubble } from "./MessageBubble";
import { BookingLink } from "./BookingLink";

const SESSION_KEY = "agent_session_id";
const COMPLETE_KEY = "agent_session_complete";
const BOOKING_LINK_KEY = "agent_booking_link";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(SESSION_KEY, id);
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const complete = sessionStorage.getItem(COMPLETE_KEY) === "true";
    if (complete) setIsComplete(true);

    const storedBookingLink = sessionStorage.getItem(BOOKING_LINK_KEY);
    if (storedBookingLink) setBookingLink(storedBookingLink);
  }, []);

  useEffect(() => {
    if (!isComplete) {
      inputRef.current?.focus();
    }
  }, [loading, isComplete]);

  function clearSession() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(COMPLETE_KEY);
    sessionStorage.removeItem(BOOKING_LINK_KEY);

    setMessages([]);
    setInput("");
    setBookingLink(null);
    setIsComplete(false);

    const nextId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, nextId);
    setSessionId(nextId);

    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || isComplete) return;

    const userMessage = input.trim();
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
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
        if (typeof window !== "undefined") {
          sessionStorage.setItem(COMPLETE_KEY, "true");
        }
        if (data.bookingLink) {
          setBookingLink(data.bookingLink);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(BOOKING_LINK_KEY, data.bookingLink);
          }
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
          We'll help you explore partnership options
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
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              readOnly={loading}
              aria-disabled={loading}
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

      {isComplete && (
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--chat-border)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={clearSession}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              background: "transparent",
              color: "var(--chat-text)",
              border: "1px solid var(--chat-border)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear session
          </button>
        </div>
      )}
    </div>
  );
}
