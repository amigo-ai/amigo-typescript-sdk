// TODO: Implement integration tests for the ConversationResource

/*
Notes:
- Instead of creating a new conversation for each test, we should create a single conversation and use it for all tests.  This is 
because we don't have a way to delete conversations, only finish them so we want to keep down the noise.
- Create conversation and interact with conversation return a stream of NDJSON events.  We need to handle this properly.
- We're going to start by testing the text-only interactions.  We'll add voice interactions later.
- Reference organization.integration.test.ts for examples of hitting the live API.
- Reference organization.ts for the functions available on the ConversationResource.
/*

/* 
Test overview
- Create a conversation (use serviceID: 689b81e7afdaf934f4b48f81)
    - Verify that 201 response is returned
    - Check that events are streamed back
    - conversation-created (save conversation ID)
    - new-message (multiple)
    - interaction-complete (save interaction ID)

- Recommend responses for interaction
    - Verify that 200 response is returned
    - Verify that the recommendations are returned

- Get conversations (use conversation ID from previous test as id filter)
    - Verify that 200 response is returned
    - Verify that the conversation is returned

- Interact with a conversation
    - Send a message 'Hello, I'm sending a text message from the SDK!'
    - Verify that 200 response is returned
    - Check that events are streamed back
    - new-message
    - interaction-complete

- Get conversation messages (use conversation ID from previous test and use limit=1)
    - Verify that 200 is returned
    - Verify that the message is returned
    - Verify that has_more is true and that a continuation token is returned
    - Use continuation token to get next page of messages
    - Verify that next message is returned

- Get interaction insights (use conversation ID and interaction ID from previous test)
    - Verify that 200 is returned
    - Verify that the insights are returned
*/
