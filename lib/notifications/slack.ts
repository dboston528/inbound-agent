export interface SlackNotificationPayload {
  email: string;
  company: string;
  score: number;
  summary: string;
  scoreSummary?: string;
}

export async function sendSlackNotification(
  payload: SlackNotificationPayload
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not set, skipping Slack notification");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `*New Lead*
Email: ${payload.email}
Company: ${payload.company}
Score: ${payload.score}
Summary: ${payload.summary}${payload.scoreSummary ? `\n\n${payload.scoreSummary}` : ""}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}
