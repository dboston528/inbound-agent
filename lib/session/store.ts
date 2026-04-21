import type { SessionFields, ConversationMessage } from "@/lib/agent/types";

export interface Session {
  sessionId: string;
  fields: SessionFields;
  conversationHistory: ConversationMessage[];
}

const sessions = new Map<string, Session>();

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function setSession(session: Session): void {
  sessions.set(session.sessionId, session);
}

export function getOrCreateSession(sessionId: string): Session {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      fields: {},
      conversationHistory: [],
    };
    sessions.set(sessionId, session);
  }
  return session;
}
