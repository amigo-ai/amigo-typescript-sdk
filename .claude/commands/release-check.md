Verify the SDK is ready for release:

1. Run `npm run lint` - must pass with zero warnings
2. Run `npm run build` - must compile cleanly
3. Run `npm test` - all tests must pass
4. Run `npm run test:dist` - distribution tests must pass
5. Check CHANGELOG.md has entries for unreleased changes
6. Report any blockers for release
