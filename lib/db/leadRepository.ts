import { prisma } from "./prisma";

export interface CreateLeadInput {
  name?: string;
  email: string;
  company?: string;
  teamSize?: string;
  timeline?: string;
  department?: string;
  tools?: string;
  useCase?: string;
  leadScore: number;
  summary: string;
  rawConversation: Record<string, unknown>[];
}

export async function createLead(input: CreateLeadInput) {
  return prisma.lead.create({
    data: {
      ...input,
      rawConversation: input.rawConversation as never,
    },
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
  });
}
