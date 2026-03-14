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
} = require('../../../dist/index.cjs')

if (typeof AmigoClient !== 'function') {
  throw new Error('AmigoClient should be a function, got: ' + typeof AmigoClient)
}

// Verify error classes are exported directly
const errorClasses = {
  AmigoError,
  BadRequestError,
  AuthenticationError,
  NotFoundError,
  NetworkError,
}
for (const [name, cls] of Object.entries(errorClasses)) {
  if (typeof cls !== 'function') {
    throw new Error(name + ' should be a function')
  }
}

console.log('CJS exports: OK')
