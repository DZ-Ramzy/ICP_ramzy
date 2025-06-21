---
applyTo: "**/*.rs"
---

### Adding New Canister Functions

When implementing a new function for the Internet Computer canister:

- For query functions, use `#[ic_cdk::query]` annotation
- For update functions, use `#[ic_cdk::update]` annotation
- Use thread_local for state management if needed
- Follow Rust best practices and existing code style
- Ensure the `export_candid!()` macro is still called

Example implementation:

```rust
#[ic_cdk::query]
fn get_user_data(user_id: String) -> Option<UserData> {
    USER_DATA.with(|data| {
        data.borrow().get(&user_id).cloned()
    })
}
```

After adding a new function, always run the following command in the terminal:

```bash
npm run generate-candid <CANISTER_NAME>
```
