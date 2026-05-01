import { execSync } from 'node:child_process'

console.log('🔄 Generating all API types...\n')

console.log('--- Classic API ---')
execSync('node scripts/gen-classic.mjs', { stdio: 'inherit' })

console.log('\n--- Platform API ---')
execSync('node scripts/gen-platform.mjs', { stdio: 'inherit' })

console.log('\n✅ All API types generated')
