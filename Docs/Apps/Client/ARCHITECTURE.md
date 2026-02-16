# Architecture
> High-level architectural decisions and constraints for the LocalGPT Client.

## Tech Stack
> Specific versions and rationale.

- **Framework**: **Angular 18+**
  - *Reasoning*: Leveraging modern **Signals** for reactive state management, **Control Flow** (`@if`, `@for`) for template performance, and **Standalone Components** for reduced boilerplate.
- **Language**: **TypeScript 5.x**
  - *Reasoning*: Strict typing for contract safety between Client and Middleware.
- **State Management**: **Angular Signals** (Native)
  - *Reasoning*: Granular change detection without the overhead of Ngrx/RxJS for this scope. Logic corresponds 1:1 with UI reactivity.
- **Styling**: **Tailwind CSS**
  - *Reasoning*: Utility-first CSS for rapid UI development, consistent theming (Dark/Light mode), and performance (critical CSS extraction).
- **Build Tool**: **Angular CLI / Vite** (via Angular builder)
  - *Reasoning*: Standard, optimized production builds.

## Pattern Enforcement
> Feature-Sliced Design (Hybrid)

- **Design Pattern**: **Smart (Container) vs. Dumb (Presentational) Components**
  - **Smart**: `ChatWindowComponent` - Connects to Stores/Services, handles data glue.
  - **Dumb**: `InputArea`, `MessageBubble` - Pure inputs/outputs, no service dependencies.

- **Directory Structure Strategy**:
  ```text
  src/app/
    ├── core/         # Singleton services (Api, Stream, Theme), global guards
    ├── features/     # Domain-specific modules (Chat, Settings)
    │   └── chat/
    │       ├── components/  # Feature-specific components
    │       └── chat.store.ts # Feature-specific state (Signals)
    ├── shared/       # Reusable UI components (Buttons, Cards) - *Future*
    └── app.routes.ts # Top-level routing
  ```

## Dependency Constraints
> Forbidden libraries to maintain performance and "Local Forever" ethos.

| Library | Status | Reason | Replacement |
+|---------|--------|--------|-------------|
| `Bootstrap` / `Material` | **FORBIDDEN** | Too heavy, overrides custom aesthetics | `Tailwind CSS` + Headless UI (if needed) |
| `Moment.js` | **FORBIDDEN** | Bundle size bloat | Native `Intl.DateTimeFormat` or `date-fns` |
| `Ngrx Store` | **AVOID** | Overkill for effective signal-based state | `Signals` + Service-based Stores |
| `jQuery` | **FORBIDDEN** | Direct DOM manipulation bypassing Angular | `Renderer2` or Directives |