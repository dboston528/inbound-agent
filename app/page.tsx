"use client";

import { ChatWidget } from "@/components/ChatWidget";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        ACME Media, Inc. 
      </h1>
      <p
        style={{
          color: "var(--chat-muted)",
          marginBottom: "2rem",
        }}
      >
        Inbound Sales Agent for Partnership Opportunities
      </p>
      <ChatWidget />
    </main>
  );
}
