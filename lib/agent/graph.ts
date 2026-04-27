import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { parseExtraction, mergeFields, validateExtractedEmail } from "./extraction";
import { isLeadComplete } from "./completion";
import { calculateLeadScore, formatScoreSummary, isHighIntent, scoreLead } from "./scoring";
import {
  buildSystemPrompt,
  buildExtractionPrompt,
  buildQuestionPrompt,
  QUESTION_HINTS,
} from "./prompts";
import { FIELD_ORDER } from "./types";
import type { SessionFields, ConversationMessage } from "./types";
import { createLead } from "@/lib/db/leadRepository";
import { sendSlackNotification } from "@/lib/notifications/slack";

const AgentStateAnnotation = Annotation.Root({
  sessionId: Annotation<string>,
  fields: Annotation<SessionFields>({
    default: () => ({}),
    reducer: (_, right) => right ?? {},
  }),
  conversationHistory: Annotation<ConversationMessage[]>({
    default: () => [],
    reducer: (_, right) => right ?? [],
  }),
  lastUserMessage: Annotation<string>,
  reply: Annotation<string>,
  isComplete: Annotation<boolean>,
  bookingLink: Annotation<string | undefined>,
  error: Annotation<string | undefined>,
});

type AgentState = typeof AgentStateAnnotation.State;

function getNextMissingField(fields: SessionFields): string | null {
  for (const field of FIELD_ORDER) {
    const val = (fields as Record<string, unknown>)[field];
    if (val == null || val === "") return field;
  }
  return null;
}

function canAskEmail(fields: SessionFields): boolean {
  return !!(
    fields.useCase &&
    fields.teamSize &&
    fields.timeline
  );
}

function getNextFieldToAsk(fields: SessionFields): string | null {
  const next = getNextMissingField(fields);
  if (!next) return null;
  if (next === "email" && !canAskEmail(fields)) {
    return getNextMissingField({ ...fields, email: "__skip__" }) ?? null;
  }
  return next;
}

async function extractFieldsNode(state: AgentState): Promise<Partial<AgentState>> {
  const { fields, lastUserMessage } = state;
  const llm = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: 0,
  });

  const extractionPrompt = buildExtractionPrompt(fields);
  let extracted: ReturnType<typeof parseExtraction> = null;

  try {
    const response = await llm.invoke([
      new SystemMessage(extractionPrompt),
      new HumanMessage(lastUserMessage),
    ]);
    const content = typeof response.content === "string" ? response.content : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extracted = parseExtraction(jsonMatch[0]);
    }
  } catch (err) {
    console.error("Extraction error:", err);
    return {
      reply: "Sorry — something went wrong. Let's continue.",
      error: "extraction_failed",
    };
  }

  let mergedFields = fields;
  if (extracted) {
    if (extracted.email && !validateExtractedEmail(extracted.email)) {
      return {
        reply:
          "That email doesn't look valid. Could you share a valid email address so we can follow up?",
      };
    }
    mergedFields = mergeFields(fields, extracted);
  }

  const complete = isLeadComplete(mergedFields);
  if (complete) {
    return { fields: mergedFields, isComplete: true };
  }

  const nextField = getNextFieldToAsk(mergedFields);
  if (!nextField) {
    return { fields: mergedFields };
  }

  const systemPrompt = buildSystemPrompt();
  const questionPrompt = buildQuestionPrompt(
    mergedFields,
    nextField,
    QUESTION_HINTS
  );

  const messages = [
    new SystemMessage(systemPrompt),
    ...state.conversationHistory.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    ),
    new HumanMessage(lastUserMessage),
  ];

  try {
    const response = await llm.invoke([
      ...messages,
      new SystemMessage(questionPrompt),
    ]);
    const reply =
      typeof response.content === "string" ? response.content : "";
    return {
      fields: mergedFields,
      reply: reply.trim(),
    };
  } catch (err) {
    console.error("Ask question error:", err);
    return {
      fields: mergedFields,
      reply: "Sorry — something went wrong. Let's continue.",
      error: "llm_failed",
    };
  }
}

async function finalizeNode(state: AgentState): Promise<Partial<AgentState>> {
  const { fields, conversationHistory } = state;
  const llm = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: 0,
  });

  const summaryPrompt = `Summarize this lead in 2-3 concise sentences. Include: use case, team size, timeline, and key context.
useCase: ${fields.useCase ?? "N/A"}
teamSize: ${fields.teamSize ?? "N/A"}
timeline: ${fields.timeline ?? "N/A"}
tools: ${fields.tools ?? "N/A"}
department: ${fields.department ?? "N/A"}
budget: ${fields.budget ?? "N/A"}
company: ${fields.company ?? "N/A"}`;

  let summary = "";
  try {
    const response = await llm.invoke([
      new SystemMessage("You are a concise summarizer. Output only the summary, no JSON."),
      new HumanMessage(summaryPrompt),
    ]);
    summary =
      typeof response.content === "string"
        ? response.content.trim()
        : "Lead summary";
  } catch (err) {
    console.error("Summary error:", err);
    summary = "Lead qualified for follow-up.";
  }

  const score = calculateLeadScore(fields);
  const highIntent = isHighIntent(score);
  const bookingLink = highIntent
    ? process.env.BOOKING_LINK
    : undefined;

  const rawConv = conversationHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    await createLead({
      name: fields.name ?? undefined,
      email: fields.email!,
      company: fields.company ?? undefined,
      teamSize: fields.teamSize ?? undefined,
      timeline: fields.timeline ?? undefined,
      department: fields.department ?? undefined,
      tools: fields.tools ?? undefined,
      useCase: fields.useCase ?? undefined,
      budget: fields.budget ?? undefined,
      leadScore: score,
      summary,
      rawConversation: rawConv,
    });
  } catch (err) {
    console.error("DB error:", err);
    return {
      reply: "Sorry — something went wrong. Let's continue.",
      error: "db_failed",
    };
  }

  try {
    const breakdown = scoreLead(fields);
    const scoreSummary = formatScoreSummary(fields, breakdown);
    await sendSlackNotification({
      email: fields.email!,
      company: fields.company ?? "N/A",
      score,
      summary,
      scoreSummary,
    });
  } catch (err) {
    console.error("Notification error:", err);
  }

  const thanksMessage = highIntent
    ? "Thanks! You're a great fit. Here's a link to book a strategy call:"
    : "Thanks for sharing! We'll be in touch soon.";

  return {
    reply: thanksMessage,
    isComplete: true,
    bookingLink,
  };
}

function routeAfterExtract(state: AgentState): "ask_question" | "finalize" {
  if (state.isComplete) return "finalize";
  return "ask_question";
}

function buildGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    .addNode("extract_fields", extractFieldsNode)
    .addNode("finalize", finalizeNode)
    .addEdge("__start__", "extract_fields")
    .addConditionalEdges("extract_fields", routeAfterExtract, {
      ask_question: "__end__",
      finalize: "finalize",
    })
    .addEdge("finalize", "__end__");

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildGraph> | null = null;

export function getAgentGraph() {
  if (!compiledGraph) {
    compiledGraph = buildGraph();
  }
  return compiledGraph;
}

export interface ChatInput {
  sessionId: string;
  message: string;
  fields: SessionFields;
  conversationHistory: ConversationMessage[];
}

export interface ChatOutput {
  reply: string;
  isComplete: boolean;
  bookingLink?: string;
  fields: SessionFields;
  conversationHistory: ConversationMessage[];
}

export async function runAgent(input: ChatInput): Promise<ChatOutput> {
  const graph = getAgentGraph();

  const result = await graph.invoke({
    sessionId: input.sessionId,
    fields: input.fields,
    conversationHistory: input.conversationHistory,
    lastUserMessage: input.message,
    reply: "",
    isComplete: false,
    bookingLink: undefined,
    error: undefined,
  });

  const history = [
    ...input.conversationHistory,
    { role: "user" as const, content: input.message },
    { role: "assistant" as const, content: result.reply },
  ];

  return {
    reply: result.reply ?? "",
    isComplete: result.isComplete ?? false,
    bookingLink: result.bookingLink,
    fields: result.fields ?? input.fields,
    conversationHistory: history,
  };
}
