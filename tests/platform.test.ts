import { describe, expect, test, vi } from 'vitest'
import {
  PlatformClient,
  callSid,
  contextGraphId,
  dataSourceId,
  entityId,
  hsmId,
  integrationId,
  monitorConceptId,
  operatorId,
  phoneNumberId,
  platformAgentId,
  platformApiKeyId,
  platformConversationId,
  platformServiceId,
  reviewItemId,
  skillId,
  taskId,
  unificationRuleId,
  workspaceId,
} from '../src/platform'
import type { PlatformWebSocketLike } from '../src/platform/core/websocket'

function createJsonFetch(body: unknown, status = 200) {
  const calls: Array<{
    url: string
    method: string
    authorization: string | null
    accept: string | null
    lastEventId: string | null
  }> = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    calls.push({
      url: request.url,
      method: request.method,
      authorization: request.headers.get('authorization'),
      accept: request.headers.get('accept'),
      lastEventId: request.headers.get('last-event-id'),
    })
    return Response.json(body, { status })
  })
  return { fetchMock, calls }
}

class MockWebSocket implements PlatformWebSocketLike {
  static instances: MockWebSocket[] = []
  readonly readyState = 1

  constructor(
    readonly url: string,
    readonly protocols?: string | string[]
  ) {
    MockWebSocket.instances.push(this)
  }

  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView): void {}
  close(_code?: number, _reason?: string): void {}
}

describe('PlatformClient', () => {
  const workspace = workspaceId('00000000-0000-4000-8000-000000000001')
  const agent = platformAgentId('00000000-0000-4000-8000-000000000002')
  const service = platformServiceId('00000000-0000-4000-8000-000000000003')
  const conversation = platformConversationId('00000000-0000-4000-8000-000000000004')
  const apiKey = platformApiKeyId('00000000-0000-4000-8000-000000000005')
  const graph = contextGraphId('00000000-0000-4000-8000-000000000006')
  const source = dataSourceId('00000000-0000-4000-8000-000000000007')
  const integration = integrationId('00000000-0000-4000-8000-000000000008')
  const phone = phoneNumberId('00000000-0000-4000-8000-000000000009')
  const skill = skillId('00000000-0000-4000-8000-000000000010')
  const call = callSid('CA00000000000000000000000000000000')
  const entity = entityId('00000000-0000-4000-8000-000000000011')
  const body = {} as never
  const query = {} as never

  test('sends Bearer auth and current workspace path params', async () => {
    const { fetchMock, calls } = createJsonFetch({ items: [], total: 0, has_more: false })
    const client = new PlatformClient({
      apiKey: 'platform-key',
      workspaceId: workspace,
      baseUrl: 'https://platform.example.com',
      fetch: fetchMock,
    })

    await client.conversations.list()

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      url: 'https://platform.example.com/v1/00000000-0000-4000-8000-000000000001/conversations',
      method: 'GET',
      authorization: 'Bearer platform-key',
    })
  })

  test('supports latest aliases and auth info on platform resources', async () => {
    const { fetchMock, calls } = createJsonFetch({ id: 'ok' })
    const client = new PlatformClient({
      apiKey: 'platform-key',
      workspaceId: workspace,
      baseUrl: 'https://platform.example.com',
      fetch: fetchMock,
    })

    await client.agents.getVersion({
      agentId: agent,
      version: 'latest',
    })
    await client.apiKeys.me()

    expect(calls.map(call => call.url)).toEqual([
      'https://platform.example.com/v1/00000000-0000-4000-8000-000000000001/agents/00000000-0000-4000-8000-000000000002/versions/latest',
      'https://platform.example.com/v1/auth/me',
    ])
  })

  test('streams typed conversation turn SSE events', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      expect(request.headers.get('accept')).toBe('text/event-stream')
      return new Response('event: token\ndata: {"type":"token","token":"hi"}\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    })
    const client = new PlatformClient({
      apiKey: 'platform-key',
      workspaceId: workspace,
      baseUrl: 'https://platform.example.com',
      fetch: fetchMock,
    })

    const stream = await client.conversations.streamTurn({
      conversationId: conversation,
      body: { message: 'hello' },
    })
    const events: unknown[] = []
    for await (const event of stream) events.push(event)

    expect(events).toEqual([{ event: 'token', data: { type: 'token', token: 'hi' } }])
  })

  test('streams workspace SSE events with resume headers', async () => {
    const calls: Array<{ accept: string | null; lastEventId: string | null }> = []
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      calls.push({
        accept: request.headers.get('accept'),
        lastEventId: request.headers.get('last-event-id'),
      })
      return new Response('event: text.completed\ndata: {"type":"text.completed"}\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    })
    const client = new PlatformClient({
      apiKey: 'platform-key',
      workspaceId: workspace,
      baseUrl: 'https://platform.example.com',
      fetch: fetchMock,
    })

    const stream = await client.events.stream({ lastEventId: 'evt_1' })
    const events: unknown[] = []
    for await (const event of stream) events.push(event)

    expect(calls).toEqual([{ accept: 'text/event-stream', lastEventId: 'evt_1' }])
    expect(events).toEqual([{ event: 'text.completed', data: { type: 'text.completed' } }])
  })

  test('builds text-session WebSocket with auth subprotocol', () => {
    MockWebSocket.instances = []
    const client = new PlatformClient({
      apiKey: 'platform-key',
      workspaceId: workspace,
      baseUrl: 'https://platform.example.com',
      WebSocket: MockWebSocket,
    })

    client.sessions.connectTextSession({
      serviceId: service,
      entityId: entity,
      conversationId: conversation,
      toolEvents: false,
    })

    expect(MockWebSocket.instances[0]?.url).toBe(
      'wss://platform.example.com/v1/00000000-0000-4000-8000-000000000001/sessions/connect?service_id=00000000-0000-4000-8000-000000000003&entity_id=00000000-0000-4000-8000-000000000011&tool_events=false&conversation_id=00000000-0000-4000-8000-000000000004'
    )
    expect(MockWebSocket.instances[0]?.protocols).toEqual(['auth', 'platform-key'])
  })

  test('brands platform identifiers without changing their runtime values', () => {
    const id = '00000000-0000-4000-8000-000000000099'

    expect([
      workspaceId(id),
      skillId(id),
      integrationId(id),
      hsmId(id),
      contextGraphId(id),
      platformAgentId(id),
      platformServiceId(id),
      phoneNumberId(id),
      platformApiKeyId(id),
      callSid(id),
      platformConversationId(id),
      dataSourceId(id),
      operatorId(id),
      reviewItemId(id),
      monitorConceptId(id),
      unificationRuleId(id),
      entityId(id),
      taskId(id),
    ]).toEqual(Array.from({ length: 18 }, () => id))
  })

  test('exercises platform resource wrapper routes', async () => {
    const { fetchMock, calls } = createJsonFetch({ ok: true })
    const client = new PlatformClient({
      apiKey: 'platform-key',
      workspaceId: workspace,
      baseUrl: 'https://platform.example.com',
      fetch: fetchMock,
    })

    const operations: Array<() => Promise<unknown> | unknown> = [
      () => client.agents.list({ query }),
      () => client.agents.get({ agentId: agent }),
      () => client.agents.create({ body }),
      () => client.agents.update({ agentId: agent, body }),
      () => client.agents.delete({ agentId: agent }),
      () => client.agents.listVersions({ agentId: agent, query }),
      () => client.agents.getVersion({ agentId: agent, version: 2 }),
      () => client.agents.createVersion({ agentId: agent, body }),
      () => client.apiKeys.list({ query }),
      () => client.apiKeys.create({ body }),
      () => client.apiKeys.delete({ keyId: apiKey }),
      () => client.apiKeys.rotate({ keyId: apiKey, body }),
      () => client.contextGraphs.list({ query }),
      () => client.contextGraphs.get({ contextGraphId: graph }),
      () => client.contextGraphs.create({ body }),
      () => client.contextGraphs.update({ contextGraphId: graph, body }),
      () => client.contextGraphs.delete({ contextGraphId: graph }),
      () => client.contextGraphs.listVersions({ contextGraphId: graph, query }),
      () => client.contextGraphs.getVersion({ contextGraphId: graph, version: 'latest' }),
      () => client.contextGraphs.createVersion({ contextGraphId: graph, body }),
      () => client.conversations.list({ query }),
      () => client.conversations.create({ body }),
      () => client.conversations.get({ conversationId: conversation }),
      () => client.conversations.close({ conversationId: conversation }),
      () => client.conversations.createTurn({ conversationId: conversation, body, query }),
      () => client.dataSources.list({ query }),
      () => client.dataSources.get({ dataSourceId: source }),
      () => client.dataSources.create({ body }),
      () => client.dataSources.update({ dataSourceId: source, body }),
      () => client.dataSources.getStatus({ dataSourceId: source }),
      () => client.dataSources.getSyncHistory({ dataSourceId: source, query }),
      () => client.dataSources.triggerSync({ dataSourceId: source }),
      () => client.dataSources.delete({ dataSourceId: source }),
      () => client.fhir.status(),
      () => client.fhir.searchResources({ resourceType: 'Patient', query }),
      () => client.fhir.getResource({ resourceType: 'Patient', resourceId: 'pat_1' }),
      () => client.fhir.createResource({ resourceType: 'Patient', body: {} }),
      () => client.fhir.updateResource({ resourceType: 'Patient', resourceId: 'pat_1', body: {} }),
      () => client.fhir.syncFailures({ query }),
      () => client.fhir.import({ body }),
      () => client.fhir.searchPatients({ query }),
      () => client.fhir.getPatientTimeline({ patientId: 'pat_1', query }),
      () => client.fhir.getPatientSummary({ patientId: 'pat_1' }),
      () => client.fhir.viewPatients({ query }),
      () => client.fhir.viewPractitioners({ query }),
      () => client.fhir.viewLocations({ query }),
      () => client.fhir.viewAppointments({ query }),
      () => client.fhir.viewOrganizations({ query }),
      () => client.fhir.viewSlots({ query }),
      () => client.integrations.list({ query }),
      () => client.integrations.get({ integrationId: integration }),
      () => client.integrations.create({ body }),
      () => client.integrations.update({ integrationId: integration, body }),
      () => client.integrations.delete({ integrationId: integration }),
      () =>
        client.integrations.testEndpoint({
          integrationId: integration,
          endpointName: 'ping',
          body,
        }),
      () => client.integrations.healthCheck(),
      () => client.phoneNumbers.list({ query }),
      () => client.phoneNumbers.get({ phoneNumberId: phone }),
      () => client.phoneNumbers.create({ body }),
      () => client.phoneNumbers.update({ phoneNumberId: phone, body }),
      () => client.phoneNumbers.delete({ phoneNumberId: phone }),
      () => client.phoneNumbers.setForwarding({ phoneNumberId: phone, body }),
      () => client.phoneNumbers.clearForwarding({ phoneNumberId: phone }),
      () => client.phoneNumbers.getTwilioSubAccount(),
      () => client.phoneNumbers.provisionTwilioSubAccount(),
      () => client.phoneNumbers.searchAvailable({ query }),
      () => client.phoneNumbers.purchase({ body }),
      () => client.phoneNumbers.release({ phoneNumberId: phone }),
      () => client.phoneNumbers.bind({ body }),
      () => client.services.list({ query }),
      () => client.services.get({ serviceId: service }),
      () => client.services.create({ body }),
      () => client.services.update({ serviceId: service, body }),
      () => client.services.delete({ serviceId: service }),
      () => client.services.upsertVersionSet({ serviceId: service, name: 'prod', body }),
      () => client.services.resolveTools({ serviceId: service, query }),
      () => client.services.voiceTurn({ serviceId: service, body }),
      () => client.sessions.listActive(),
      () => client.sessions.start({ body }),
      () => client.sessions.inject({ callSid: call, body }),
      () => client.sessions.buildTextSessionUrl({ serviceId: service, entityId: entity }),
      () => client.skills.list({ query }),
      () => client.skills.get({ skillId: skill }),
      () => client.skills.create({ body }),
      () => client.skills.update({ skillId: skill, body }),
      () => client.skills.delete({ skillId: skill }),
      () => client.skills.test({ skillId: skill, body }),
      () => client.skills.getReferences({ skillId: skill }),
      () => client.workspaces.list({ query }),
      () => client.workspaces.get(),
      () => client.workspaces.create({ body }),
      () => client.workspaces.createSelfService({ body }),
      () => client.workspaces.update({ body }),
      () => client.workspaces.provision(),
      () => client.workspaces.archive({ body }),
      () => client.workspaces.checkEnvironmentConversion({ query }),
      () => client.workspaces.convertEnvironment({ body }),
      () => client.workspaces.getVoiceSettings(),
      () => client.workspaces.updateVoiceSettings({ body }),
      () => client.workspaces.getTestCallerNumbers(),
      () => client.workspaces.updateTestCallerNumbers({ body }),
    ]

    for (const operation of operations) {
      await operation()
    }

    expect(calls).toHaveLength(operations.length - 1)
    expect(calls.map(call => `${call.method} ${new URL(call.url).pathname}`)).toContain(
      'PUT /v1/00000000-0000-4000-8000-000000000001/services/00000000-0000-4000-8000-000000000003/version-sets/prod'
    )
    expect(fetchMock).toHaveBeenCalledTimes(operations.length - 1)
  })
})
