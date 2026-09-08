/**
 * CJS test: Verify module can be required and exports are accessible
 */
'use strict'

const {
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
} = require('../../../dist/index.cjs')

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

console.log('CJS exports: OK')
