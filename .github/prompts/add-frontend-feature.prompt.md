---
mode: "agent"
description: "Add a feature to the frontend in typescript"
---

## Add Frontend Feature Instructions

Only when working on features for the frontend, follow this step-by-step approach with GitHub Copilot Agent Mode.

## Relevant Instructions

IMPORTANT: you must search in codebase for files matching "\*\*/\*.instructions.md".
Then read the files:

- "typescript.instructions.md"
- "frontend-test.instructions.md"
- "rust.instructions.md".

#### Step-by-Step Workflow

IMPORTANT: When you see "CRITICAL PAUSE POINT!" in these instructions, you MUST stop immediately and wait for human feedback before proceeding to the next step. Do not continue past any CRITICAL PAUSE POINT instruction without explicit approval.

Please follow a Feature Driven Development workflow. Here are explicit steps for you to strictly follow:

1. Planning:
   1. First, ensure you fully understand the feature and the scope, ask a few clarification questions.
   2. **CRITICAL PAUSE POINT** - STOP HERE and wait for human answers before continuing!
   3. If the feature is complex, break it down into smaller and numerated tasks.
   4. Do the rest of the workflow PER task.
2. Update the changelog with an entry of the implemented feature.
3. Implement Code:
   1. Implement code according to the typescript or rust instructions.
   2. If frontend was changed, use tool openSimpleBrowser and showcase the changes.
   3. **CRITICAL PAUSE POINT** - STOP HERE and wait for human to review changes and approval before continuing!
4. Implement Tests:
   1. Then, write tests following frontend test instructions.
   2. Run tests and ensure it's passing.
