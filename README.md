# Agent Strategy Assistant

An inbound sales agent that qualifies automation prospects, captures structured requirements, scores leads deterministically, and persists them to Postgres.

**Stack:** Next.js 14 · TypeScript · LangGraph · Postgres · Prisma

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL, OPENAI_API_KEY, etc.

# Generate Prisma client
npm run db:generate

# Push schema to DB
npm run db:push

# Run dev server
npm run dev
```

## Docker

```bash
docker compose up
```

Runs the app and Postgres. Ensure `OPENAI_API_KEY` is set in your environment or `.env`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 |
| `OPENAI_MODEL` | Model name (default: gpt-4o) |
| `BOOKING_LINK` | Calendly/booking URL for high-intent leads |
| `SLACK_WEBHOOK_URL` | Slack webhook for lead notifications |
| `RESEND_API_KEY` | Resend API key for email notifications |

## API

### POST /api/chat

**Request:**
```json
{
  "sessionId": "uuid",
  "message": "string"
}
```

**Response:**
```json
{
  "reply": "string",
  "isComplete": boolean,
  "bookingLink": "string (optional, high intent only)"
}
```

## Tests

```bash
npm run test           # Unit tests
npm run test:integration  # Integration tests
```

## Project Structure

```
/app/api/chat/route.ts     # Chat API endpoint
/components/               # ChatWidget, MessageBubble, BookingLink
/lib/agent/                # LangGraph agent, prompts, extraction, scoring
/lib/db/                   # Prisma client, lead repository
/lib/notifications/        # Slack, email
/lib/validation/           # Email validation
/tests/integration/        # Integration tests
```
