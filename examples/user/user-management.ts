// User management example using the Amigo TypeScript SDK
//
// This example demonstrates how to:
// - Create an invited user with a unique email
// - Update the user's profile
// - List users filtered by id and email
// - Delete the created user so the example is re-runnable
//
// Requirements:
// - Install deps in examples/: npm i
// - Copy examples/.env.example to examples/.env and fill in credentials
// - Run: npm run start:user  (or: npx tsx user/user-management.ts)

import 'dotenv/config'
import { AmigoClient, errors, type AmigoSdkConfig } from '@amigo-ai/sdk'

async function run(): Promise<void> {
  const config: AmigoSdkConfig = {
    apiKey: process.env.AMIGO_API_KEY ?? '',
    apiKeyId: process.env.AMIGO_API_KEY_ID ?? '',
    userId: process.env.AMIGO_USER_ID ?? '',
    orgId: process.env.AMIGO_ORGANIZATION_ID ?? '',
    baseUrl: process.env.AMIGO_BASE_URL || undefined,
  }

  const client = new AmigoClient(config)

  let createdUserId: string | undefined
  let createdUserEmail: string | undefined

  // Use a unique email so the example can be run repeatedly
  const uniqueSuffix = Date.now().toString(36)
  const email = `ts-sdk-example-${uniqueSuffix}@example.com`

  try {
    console.log('\n[1/5] Creating an invited user...')
    const created = await client.users.createUser({
      first_name: 'TS',
      last_name: 'SDK-Example',
      email,
      role_name: 'DefaultUserRole',
    })
    createdUserId = created.user_id
    createdUserEmail = email
    console.log('Created user_id:', createdUserId)

    console.log('\n[2/5] Updating the user profile...')
    if (!createdUserId) throw new Error('User was not created (no id received).')
    await client.users.updateUser(createdUserId, {
      first_name: 'TS-Updated',
      last_name: 'SDK-Example-Updated',
      preferred_language: {},
      timezone: {},
    })
    console.log('User updated.')

    console.log('\n[3/5] Listing users filtered by id...')
    if (!createdUserId) throw new Error('User id missing before list-by-id.')
    const byId = await client.users.getUsers({ user_id: [createdUserId] })
    const byIdCount = Array.isArray(byId.users) ? byId.users.length : 0
    console.log('Users found by id:', byIdCount, 'has_more:', byId.has_more)

    console.log('\n[4/5] Listing users filtered by email...')
    if (!createdUserEmail) throw new Error('User email missing before list-by-email.')
    const byEmail = await client.users.getUsers({ email: [createdUserEmail] })
    const byEmailCount = Array.isArray(byEmail.users) ? byEmail.users.length : 0
    console.log('Users found by email:', byEmailCount, 'has_more:', byEmail.has_more)

    console.log('\n[5/5] Done. Cleaning up...')
  } catch (err) {
    if (err instanceof errors.AmigoError) {
      console.error('[AmigoError]', err)
    } else {
      console.error('[Unexpected error]', err)
    }
    process.exitCode = 1
  } finally {
    if (createdUserId) {
      try {
        console.log('\nDeleting created user to keep the example re-runnable...')
        await client.users.deleteUser(createdUserId)
        console.log('Deleted user:', createdUserId)
      } catch (e) {
        if (e instanceof errors.NotFoundError) {
          console.warn('User already deleted or not found.')
        } else if (e instanceof errors.AmigoError) {
          console.error('[Cleanup error]', e)
        } else {
          console.error('[Unexpected cleanup error]', e)
        }
      }
    }
  }
}

await run()
