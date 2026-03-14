Add a new API resource to the SDK. The user will specify the resource name and endpoints.

1. Create a new resource file in src/resources/{resource_name}.ts following the pattern of existing resources
2. Export it from src/index.ts
3. Add the resource as a property on the AmigoClient class in src/index.ts
4. Add tests in tests/resources/{resource_name}.test.ts using the MSW test helpers from tests/test-helpers.ts
5. Run tests to verify
