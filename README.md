# @amigo-ai/sdk

[![Tests](https://github.com/amigo-ai/amigo-typescript-sdk/actions/workflows/test.yml/badge.svg)](https://github.com/amigo-ai/amigo-typescript-sdk/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/amigo-ai/amigo-typescript-sdk/graph/badge.svg?token=PQU5JBU941)](https://codecov.io/gh/amigo-ai/amigo-typescript-sdk)
[![npm version](https://img.shields.io/npm/v/%40amigo-ai%2Fsdk?logo=npm)](https://www.npmjs.com/package/@amigo-ai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official TypeScript SDK for the Amigo API.

Typed from the Amigo OpenAPI schema, shipped as both ESM and CommonJS, and designed for the classic org-scoped API used by existing Amigo integrations.

## Documentation

- [Product Docs](https://docs.amigo.ai)
- [Developer Guide](https://docs.amigo.ai/developer-guide)
- [Examples](https://github.com/amigo-ai/amigo-typescript-sdk/tree/main/examples)
- [Changelog](https://github.com/amigo-ai/amigo-typescript-sdk/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/amigo-ai/amigo-typescript-sdk/blob/main/CONTRIBUTING.md)

## Status

This package remains the supported SDK for the classic Amigo API. The Amigo Platform API is the long-term home for new workspace-scoped capabilities, but classic customers are not being asked to make an abrupt rewrite. As equivalent platform surfaces become available, Amigo will publish a migration path and upgrade guidance before recommending a move.

Classic is not end-of-life. Existing integrations can continue to build on `@amigo-ai/sdk` while platform coverage expands.

## Choose The Right SDK

| If you need                                                    | Use                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| The current org-scoped Amigo API used by existing integrations | `@amigo-ai/sdk`                                                                       |
| New workspace-scoped Platform API integrations                 | [`@amigo-ai/platform-sdk`](https://github.com/amigo-ai/amigo-platform-typescript-sdk) |

## Installation

```bash
npm install @amigo-ai/sdk
```

## Quick Start

```typescript
import { AmigoClient } from '@amigo-ai/sdk'

const client = new AmigoClient({
  apiKey: 'your-api-key',
  apiKeyId: 'your-api-key-id',
  userId: 'user-id',
  orgId: 'your-organization-id',
})

const conversations = await client.conversations.getConversations({
  limit: 10,
  sort_by: ['-created_at'],
})

console.log(conversations.conversations.map(conversation => conversation.id))
```

ESM and CommonJS are both supported. See the [examples directory](https://github.com/amigo-ai/amigo-typescript-sdk/tree/main/examples) for runnable examples.

## Configuration

| Option     | Type           | Required | Description                                                   |
| ---------- | -------------- | -------- | ------------------------------------------------------------- |
| `apiKey`   | `string`       | Yes      | API key from the Amigo dashboard                              |
| `apiKeyId` | `string`       | Yes      | API key ID paired with `apiKey`                               |
| `userId`   | `string`       | Yes      | User ID on whose behalf the request is made                   |
| `orgId`    | `string`       | Yes      | Organization ID for the classic API                           |
| `baseUrl`  | `string`       | No       | Override the API base URL. Defaults to `https://api.amigo.ai` |
| `retry`    | `RetryOptions` | No       | Retry policy overrides for transient HTTP failures            |

## What This SDK Covers

- Conversations, including NDJSON event streaming
- Services and version-set operations
- Users and organizations
- Agents and context graphs
- Webhook helpers, rate-limit parsing, and typed SDK errors

## Generated Types

The package re-exports the generated OpenAPI types so you can type application code directly from the API contract:

```typescript
import type { components, operations, paths } from '@amigo-ai/sdk'

type Conversation = components['schemas']['ConversationInstance']
type GetConversationsQuery = operations['get-conversations']['parameters']['query']
```

## Retries

The HTTP client retries transient failures with sensible defaults:

- Max attempts: `3`
- Backoff base: `250ms` with full jitter
- Max delay per attempt: `30s`
- Statuses: `408`, `429`, `500`, `502`, `503`, `504`
- Methods: `GET`, plus `POST` on `429` when `Retry-After` is present

## Error Handling

```typescript
import { AmigoClient, AuthenticationError, NetworkError } from '@amigo-ai/sdk'

try {
  const client = new AmigoClient({
    apiKey: 'your-api-key',
    apiKeyId: 'your-api-key-id',
    userId: 'user-id',
    orgId: 'your-organization-id',
  })

  await client.organizations.getOrganization()
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message)
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## Support

Use the [issue tracker](https://github.com/amigo-ai/amigo-typescript-sdk/issues) for bugs and feature requests. For vulnerability reports, see [SECURITY.md](https://github.com/amigo-ai/amigo-typescript-sdk/blob/main/SECURITY.md).
