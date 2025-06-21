---
applyTo: "**/*.tsx"
---

# TypeScript Instructions

## Type Safety

- Follow TypeScript best practices with proper type annotations
- Define interfaces for all props, state, and API responses
- Avoid `any` type - use proper typing or `unknown` when necessary

## Canister Integration Types

Define types for all canister interactions:

```typescript
// Define response types
interface UserData {
  id: string;
  name: string;
  email?: string;
}

// Service function with proper typing
export async function fetchUserData(userId: string): Promise<UserData> {
  try {
    return await backend.get_user_data(userId);
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}
```
