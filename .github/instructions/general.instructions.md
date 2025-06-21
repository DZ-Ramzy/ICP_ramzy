---
applyTo: "**"
---

# General Instructions

## Project Context

- This is an Internet Computer Protocol (ICP) project using Rust for canister development with PocketIC and Vitest for testing.
- The frontend is built with Vite, React, and TypeScript, styled with Tailwind CSS v4.

## Frontend Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v4 (uses `@tailwindcss/vite` plugin)
- **Development Server**: http://localhost:5173

## Code Quality & Formatting

- We use `rust-lang.rust-analyzer` for formatting and linting **Rust** code.
- We use `prettier` for formatting and linting **TypeScript** code.
- Run `npm run format` for formatting both typescript and rust code.

## AI Assistance

- Before implementing new features, consider asking human a few clarification questions.
- If you would like to go beyond the scope of the prompt, please ask the human for permission first.
- When finishing a significant change, please PAUSE and ask the human for review and permission to continue.

## Development Commands

### Backend Changes

```bash
# Generate candid after interface changes
npm run generate-candid

# Check Rust code for errors
cargo check
```

### Frontend Changes

```bash
# Start development server (assume running unless error occurs)
npm start

# Check TypeScript code for errors
npx tsc -p src/frontend/tsconfig.json
```

## Visual Review

**IMPORTANT**: After UI changes, always self-check by opening SimpleBrowser at `http://localhost:5173` and confirm changes with the user.

## Frontend Architecture

### Component Guidelines

- Use functional components with React hooks
- Organize with clear separation of concerns
- Create reusable components only when needed, otherwise define within views
- Export components from barrel files for clean imports

### Styling with Tailwind CSS v4

- Prefer utility classes over custom CSS
- Use directives in index.css instead of `tailwind.config.js` for custom classes

Example custom theme:

```css
@theme {
  --color-mint-500: oklch(0.72 0.11 178);
}
```

### Internet Computer Integration

- Import canister declarations from `declarations` directory
- Use async/await with proper loading state and error handling
- Create separate service layers for canister interactions
- Add type definitions for all canister responses

Example service:

```typescript
import { backend } from "../../declarations/backend";

export async function fetchUserData(userId: string): Promise<UserData> {
  try {
    return await backend.get_user_data(userId);
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}
```

### Updating the Changelog

When adding new features or making changes:

- Follow Keep a Changelog format
- Add entries under the [Unreleased] > appropriate section (Added, Changed, Fixed, etc.)
- Start each entry with a verb in present tense (Add, Fix, Change)
- Use clear, concise descriptions that explain the impact to users
- Don't add anything if it's a small change.
- Max 1 or 2 entries per feature or commit.

Example changelog entry:

```markdown
## [Unreleased]

### Added

- Add user profile management with support for avatars and display names
```
