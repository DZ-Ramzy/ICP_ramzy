---
mode: "agent"
description: "Add a feature to the backend in Rust"
---

## Add Backend Feature Instructions

Only when working on features for the backend, follow this step-by-step approach with GitHub Copilot Agent Mode.

## Relevant Instructions

IMPORTANT: you must search in codebase for files matching "\*\*/\*.instructions.md".
Then read the files:

- "rust.instructions.md".
- "backend-test.instructions.md"

#### Step-by-Step Workflow

IMPORTANT: When you see "CRITICAL PAUSE POINT!" in these instructions, you MUST stop immediately and wait for human feedback before proceeding to the next step. Do not continue past any CRITICAL PAUSE POINT instruction without explicit approval.

Please follow a Spec Driven Development workflow. Here are explicit steps for you to strictly follow:

1. Planning:
   1. Ensure you fully understand the problem, feel free to ask a few clarification questions.
   2. **CRITICAL PAUSE POINT** - STOP HERE and wait for human answers before continuing!
   3. If the feature is complex, break it down into smaller and numerated tasks.
   4. Do the rest of the workflow PER task.
2. Update the changelog with one entry of the requested feature.
3. Implement Tests:
   1. If needed, create a new method on backend canister without actual logic.
   2. Regenerate Candid and Cargo check.
   3. Then, write tests and ensure to follow backend test instructions.
   4. Then run tests and ensure it's failing. If not failing, check what went wrong and fix. If tests don't fail, you aren't testing anything!
   5. **CRITICAL PAUSE POINT** - STOP HERE and wait for human to review test cases and approval before continuing!
4. Implement Code:
   1. Implement code changes according to the tests described.
   2. Finally, run tests and ensure it's passing.
