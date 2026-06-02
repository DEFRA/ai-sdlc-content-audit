# Single Responsibility

Rules ensuring each module, class, and function has exactly one reason to change.

## Scope

Applies to all JavaScript modules, classes, functions, and components in `src/`.

## Modules

- Limit each module to one cohesive area of responsibility — expressible in one sentence without "and" or "or".
- Separate business logic from infrastructure concerns: data processing and database access belong in different modules.
- Separate data transformation from data persistence.
- Limit public exports to five or fewer — more suggests multiple concerns.
- Split any class or module whose name requires "And", "Or", or "Manager" to describe it.

## Functions

- Write functions that perform one task and produce no side effects unrelated to that task.
- Keep functions under 20 lines — longer functions often signal multiple responsibilities.
- Place error handling in dedicated middleware or error-handling modules, not inside business logic functions.

## UI Components

- Restrict UI components to presentation only — no business logic or data fetching inside a component.

## Testability Check

- Split a module when you cannot test it without setting up unrelated dependencies.
- Separate parts of a module that change for different reasons.

## Example

```javascript
// ✅ Good: three focused modules
class UserValidator    { validateEmail(email) { ... } }
class UserRepository   { async save(user) { ... } }
class WelcomeMailer    { async send(user) { ... } }

// ❌ Bad: one class doing too much
class UserManager {
  validateUser()    { ... }   // validation
  async saveUser()  { ... }   // persistence
  async mailUser()  { ... }   // notification
  async logAction() { ... }   // logging
}
```
