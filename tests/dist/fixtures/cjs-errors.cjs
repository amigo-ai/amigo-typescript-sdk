/**
 * CJS test: Verify error classes can be instantiated and used
 */
'use strict'

const { AmigoError, isAmigoError } = require('../../../dist/index.cjs')

// Test error instantiation
const err = new AmigoError('test message')
if (!(err instanceof Error)) {
  throw new Error('AmigoError should be instanceof Error')
}
if (err.message !== 'test message') {
  throw new Error('Error message not set correctly')
}

// Test error type checking
if (!isAmigoError(err)) {
  throw new Error('isAmigoError should return true for AmigoError')
}
if (isAmigoError(new Error('plain'))) {
  throw new Error('isAmigoError should return false for plain Error')
}

console.log('CJS errors: OK')
