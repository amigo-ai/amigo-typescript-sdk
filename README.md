# Amigo TypeScript SDK

[![Tests](https://github.com/amigo-ai/amigo-typescript-sdk/actions/workflows/test.yml/badge.svg)](https://github.com/amigo-ai/amigo-typescript-sdk/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/amigo-ai/amigo-typescript-sdk/graph/badge.svg?token=PQU5JBU941)](https://codecov.io/gh/amigo-ai/amigo-typescript-sdk)
[![npm version](https://img.shields.io/npm/v/%40amigo-ai%2Fsdk?logo=npm)](https://www.npmjs.com/package/@amigo-ai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official TypeScript SDK for the Amigo API, providing a simple and intuitive interface to interact with Amigo's AI services.

## Installation

Install the SDK using npm:

```bash
npm install @amigo-ai/sdk
```

## Quick Start

```typescript
import { AmigoClient } from '@amigo-ai/sdk'

// Initialize the client
const client = new AmigoClient({
  apiKey: 'your-api-key',
  apiKeyId: 'your-api-key-id',
  userId: 'user-id',
  orgId: 'your-organization-id',
})

// List recent conversations
async function example() {
  try {
    const conversations = await client.conversations.getConversations({
      limit: 10,
      sort_by: ['-created_at'],
    })
    console.log('Conversations:', conversations)
  } catch (error) {
    console.error('Error:', error)
  }
}

example()
```

## Examples

- **Conversation management**:
  - [Basic conversation](examples/conversation/basic-conversation.ts)
  - [Streaming conversation events](examples/conversation/conversation-events.ts)
- **User management**:
  - [User management examples](examples/user/user-management.ts)

## Configuration

The SDK requires the following configuration parameters:

| Parameter  | Type   | Required | Description                                                    |
| ---------- | ------ | -------- | -------------------------------------------------------------- |
| `apiKey`   | string | ✅       | API key from Amigo dashboard                                   |
| `apiKeyId` | string | ✅       | API key ID from Amigo dashboard                                |
| `userId`   | string | ✅       | User ID on whose behalf the request is made                    |
| `orgId`    | string | ✅       | Your organization ID                                           |
| `baseUrl`  | string | ❌       | Base URL of the Amigo API (defaults to `https://api.amigo.ai`) |

### Getting Your API Credentials

1. **API Key & API Key ID**: Generate these from your Amigo admin dashboard or programmatically using the API
2. **Organization ID**: Found in your Amigo dashboard URL or organization settings
3. **User ID**: The ID of the user you want to impersonate for API calls

For detailed instructions on generating API keys, see the [Authentication Guide](https://docs.amigo.ai/developer-guide).

### API compatibility

This SDK auto-generates its types from the latest Amigo OpenAPI schema. As a result, only the latest published SDK version is guaranteed to match the current API. If you pin to an older version, it may not include the newest endpoints or fields.

## Generated types

The SDK ships with TypeScript types generated from the latest OpenAPI schema and re-exports them for convenience.

- **Importing types**:

```typescript
import type { components, operations, paths } from '@amigo-ai/sdk'

// Example: response types
type Conversation = components['schemas']['Conversation']

// Example: operation params
type GetConversationsParams = operations['getConversations']['parameters']['query']
```

## Retries

The HTTP client includes sensible, configurable retries:

- **Defaults**:
  - max attempts: 3
  - backoff base: 250ms (exponential with full jitter)
  - max delay per attempt: 30s
  - retry on status: {408, 429, 500, 502, 503, 504}
  - retry on methods: {GET}
  - special-case: POST is retried on 429 when `Retry-After` is present

## Error Handling

The SDK provides typed error handling:

```typescript
import { AmigoClient, errors } from '@amigo-ai/sdk'

try {
  const result = await client.organizations.getOrganization('org-id')
} catch (error) {
  if (error instanceof errors.AuthenticationError) {
    console.error('Authentication failed:', error.message)
  } else if (error instanceof errors.NetworkError) {
    console.error('Network error:', error.message)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## Documentation

- **Developer Guide**: [https://docs.amigo.ai/developer-guide](https://docs.amigo.ai/developer-guide)
- **API Reference**: [https://docs.amigo.ai/api-reference](https://docs.amigo.ai/api-reference)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or feature requests, please visit our [GitHub repository](https://github.com/amigo-ai/amigo-typescript-sdk) or contact support through the Amigo dashboard.
