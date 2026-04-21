export interface EmailNotificationPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email notification");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Agent Strategy <noreply@example.com>",
      to: payload.to,
      subject: payload.subject,
      text: payload.body,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API failed: ${response.status}`);
  }
}
