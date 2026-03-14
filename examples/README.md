# Amigo TypeScript SDK — Examples

This folder contains small, readable examples for consuming the Amigo TypeScript SDK (`@amigo-ai/sdk`).

All examples use a shared `examples/package.json` to install dependencies from npm and load environment variables from `examples/.env` via `dotenv`.

## Setup

1. Use Node.js 18+ (Node 20+ recommended).
2. Install dependencies in the `examples/` folder:
   ```bash
   cd examples
   npm install
   ```
3. Configure environment variables (template provided and tracked):
   ```bash
   cp examples/.env.example examples/.env
   ```

## Examples

### Conversation (`examples/conversation`)

- Create a conversation and stream lifecycle events
- Send a text interaction and stream events
- Fetch recent messages
- Finish the conversation

Files:

- `conversation/basic-conversation.ts`: End‑to‑end flow with simple event logging (TypeScript/ESM).
- `conversation/basic-conversation.cjs`: Same flow using CommonJS `require()` syntax for non-ESM environments.
- `conversation/conversation-events.ts`: Handler‑style event processing, truncates verbose `new-message` events, and demonstrates timeout/AbortSignal usage.

### Run

- Basic conversation example (TypeScript):

  ```bash
  cd examples
  npm run start:basic --silent
  ```

- Basic conversation example (CommonJS):

  ```bash
  cd examples
  npm run start:basic-cjs --silent
  ```

- Conversation events example:
  ```bash
  cd examples
  npm run start:events --silent
  ```

## Environment variables

Environment variables are loaded from `examples/.env`.

- `AMIGO_API_KEY`
- `AMIGO_API_KEY_ID`
- `AMIGO_USER_ID`
- `AMIGO_ORGANIZATION_ID`
- `AMIGO_SERVICE_ID` (required)
- `AMIGO_BASE_URL` (optional)

Notes:

- Finish errors such as conflict/not-found can occur due to eventual consistency; the examples handle and log these gracefully.
- For local development you can point `AMIGO_BASE_URL` at internal or staging endpoints if needed.
