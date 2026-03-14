/**
 * CJS test: Verify module can be required and exports are accessible
 */
'use strict'

const { AmigoClient, errors } = require('../../../dist/index.cjs')

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

console.log('CJS exports: OK')
