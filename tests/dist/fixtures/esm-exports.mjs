/**
 * ESM test: Verify module can be imported and exports are accessible
 */
import {
  AmigoClient,
  AmigoError,
  BadRequestError,
  AuthenticationError,
  NotFoundError,
  NetworkError,
  AgentResource,
  ContextGraphResource,
  ConversationResource,
  OrganizationResource,
  ServiceResource,
  UserResource,
} from '../../../dist/index.mjs'

if (typeof AmigoClient !== 'function') {
  throw new Error('AmigoClient should be a function, got: ' + typeof AmigoClient)
}

// Verify public errors and resource classes are exported by the built package
const publicClasses = {
  AmigoError,
  BadRequestError,
  AuthenticationError,
  NotFoundError,
  NetworkError,
  AgentResource,
  ContextGraphResource,
  ConversationResource,
  OrganizationResource,
  ServiceResource,
  UserResource,
}
for (const [name, cls] of Object.entries(publicClasses)) {
  if (typeof cls !== 'function') {
    throw new Error(name + ' should be a function')
  }
}

console.log('ESM exports: OK')
