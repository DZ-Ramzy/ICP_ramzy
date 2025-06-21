---
mode: "agent"
tools: ["codebase", "changes", "usages", "terminalLastCommand"]
description: "Perform a current changes review"
---

# Uncommitted Changes Review

## Goal

To identify opportunities for improvement in the uncommitted changes of the codebase.
To help the developer:

- Consider unexpected edge cases;
- Improve code quality;
- Mitigate security and performance risks.

## Workflow

Perform a current changes review:

- Read the uncommitted changes.
- **Important:** Read the files affected for extra context, and any other connected files, especially inside tests and src folder.
- Write a 3 section review:
  - **Business Logic Risks**: Does the code behave as expected? Try to find unwanted edge cases.
  - **Code Quality Risks**: Is the code well written? Are there any anti-patterns? Try to find any relevant refactor to consider.
  - **Security and Performance Risks**: Is the code secure? Are there any security or performance issues? Imagine you are a bug bounty hunter and try to find any real vulnerability.
- Make a summary report in the end with most important findings to consider.

## Recommendations

- **IMPORTANT:** Only focus analysis on the uncommitted changes.
- **IMPORTANT:** Do NOT describe or summarize what changes were made - the developer already knows this.
- **IMPORTANT:** Focus ONLY on identifying risks or improvements within those changes.
- Do NOT list what files were changed or what the changes contain.
- If no actual risks or improvements are identified in a section, simply state "No relevant risks" without explaining why.
- Keep your review concise and limit to 1-2 top risks and suggestions per section.
- Use bulleted lists for clarity.

### How to read uncommitted changes

You can run the following command:

```bash
git diff | cat && git diff --staged | cat
```
