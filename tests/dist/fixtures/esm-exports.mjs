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
} from '../../../dist/index.mjs'

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

console.log('ESM exports: OK')
