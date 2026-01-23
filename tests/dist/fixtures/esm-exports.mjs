/**
 * ESM test: Verify module can be imported and exports are accessible
 */
import { AmigoClient, errors } from '../../../dist/index.mjs'

if (typeof AmigoClient !== 'function') {
  throw new Error('AmigoClient should be a function, got: ' + typeof AmigoClient)
}
if (typeof errors !== 'object' || errors === null) {
  throw new Error('errors should be an object, got: ' + typeof errors)
}

// Verify error classes are exported
const expectedErrors = [
  'AmigoError',
  'BadRequestError',
  'AuthenticationError',
  'NotFoundError',
  'NetworkError',
]
for (const name of expectedErrors) {
  if (typeof errors[name] !== 'function') {
    throw new Error('errors.' + name + ' should be a function')
  }
}

console.log('ESM exports: OK')
