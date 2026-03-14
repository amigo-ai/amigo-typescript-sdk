/**
 * ESM test: Verify AmigoClient can be instantiated
 */
import { AmigoClient } from '../../../dist/index.mjs'

const client = new AmigoClient({
  apiKey: 'test-key',
  apiKeyId: 'test-key-id',
  userId: 'test-user',
  orgId: 'test-org',
})

// Verify client has expected resource accessors
if (!client.conversations) {
  throw new Error('client.conversations is missing')
}
if (!client.organizations) {
  throw new Error('client.organizations is missing')
}
if (!client.services) {
  throw new Error('client.services is missing')
}
if (!client.users) {
  throw new Error('client.users is missing')
}

console.log('ESM instantiation: OK')
