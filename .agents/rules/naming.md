# Naming

Intention-revealing naming conventions for all code identifiers.

## Scope

Applies to all files in `src/`: function names, variables, constants, directories, and module exports. Architecture-specific names (controllers, services, repositories) are in `server-architecture.md`.

## Directories

- Use domain-specific terms that describe what the directory contains: `authentication/`, `user-notifications/`, `prompt-cards/`.
- Treat names like `utils/`, `helpers/`, `shared/`, `common/`, and `lib/` as a signal to find a more specific name.

## Functions

- Use verb phrases: `validateCredentials()`, `calculateTax()`, `sendNotification()`.
- Prefix async functions with a verb that signals async intent when not obvious from context: `fetchUserData()`, `loadConfiguration()`.
- Prefix boolean-returning functions with `is`, `has`, `can`, or `should`: `isAuthenticated()`, `hasPermission()`.

## Variables and Constants

- Prefix boolean variables with `is`, `has`, `can`, or `should`: `isLoading`, `hasError`.
- Name constants in `SCREAMING_SNAKE_CASE` describing what they represent, not their value: `MAX_RETRY_ATTEMPTS`, not `THREE`.

## Modules and Exports

- Name modules to match their primary export: `user-validator.js` exports `userValidator`.
- Use consistent naming patterns within a domain: if you have `createUser()`, use `createOrder()` not `makeOrder()`.

## Error Classes

- Include `Error` in all error class and error variable names: `ValidationError`, `NotFoundError`, `upstreamError`.

## Example

```javascript
// ✅ Good
const MAX_LOGIN_ATTEMPTS = 5
const isAuthenticated = checkSession(request)
async function fetchUserProfile(userId) { ... }

// ❌ Bad
const n = 5                   // reveals nothing
const authenticated = true    // not prefixed
async function user(id) { ... } // not a verb phrase
```
