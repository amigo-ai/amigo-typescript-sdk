/**
 * CJS test: Verify error classes can be instantiated and used
 */
'use strict'

const { errors } = require('../../../dist/index.cjs')

// Test error instantiation
const err = new errors.AmigoError('test message')
if (!(err instanceof Error)) {
  throw new Error('AmigoError should be instanceof Error')
}
if (err.message !== 'test message') {
  throw new Error('Error message not set correctly')
}

// Test error type checking
if (!errors.isAmigoError(err)) {
  throw new Error('isAmigoError should return true for AmigoError')
}
if (errors.isAmigoError(new Error('plain'))) {
  throw new Error('isAmigoError should return false for plain Error')
}

console.log('CJS errors: OK')
