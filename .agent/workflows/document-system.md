---
description: Workflow for comprehensively documenting a system component (Client, Backend, Engine, etc.)
---

# Documentation Workflow

Follow this workflow when documenting a subsystem of the LocalGPT project.

## 1. Directory Analysis
First, assess the structure of the target component.
- **Action**: Use `list_dir` on the target root (e.g., `apps/backend`).
- **Goal**: Identify key directories (`controllers`, `services`, `models`, `utils`).
- **Output**: Create a temporary list of files to process.

## 2. Deep Dive & Commenting (The "Reading Phase")
For each key file identified in Step 1:
- **Action**: Read the file using `view_file`.
- **Action**: Understand the logic, data flow, and dependencies.
- **Action**: Apply **JSDoc** (TS) or **Docstring** (Python) comments.
  - **Classes**: Purpose, responsibilities.
  - **Methods**: Parameters, return values, side effects.
  - **Complex Logic**: Inline explanations.
// turbo
- **Constraint**: Do NOT change logic. Only add comments.

## 3. Architecture Documentation
Update `Docs/Apps/[System]/ARCHITECTURE.md`.
- **Tech Stack**: Frameworks, libraries, languages (with versions).
- **Patterns**: Design patterns used (e.g., Repository, Singleton, Smart/Dumb).
- **Structure**: High-level directory layout explaination.
- **Constraints**: Forbidden libraries or practices.

## 4. Data Models Documentation
Update `Docs/Apps/[System]/DATA_MODELS.md`.
- **Entities**: Core domain objects (User, Chat, Document).
- **DTOs**: Data Transfer Objects for API/IPC.
- **Validation**: Schema definitions (Zod/Pydantic).

## 5. API Contract Documentation
Update `Docs/Apps/[System]/API_CONTRACT.md`.
- **Endpoints**: Table of Methods, Paths, and Descriptions.
- **Examples**: JSON payloads for Requests/Responses.
- **Error Codes**: Status codes and their meanings.

## 6. Component Standards (Frontend Only)
Update `Docs/Apps/[System]/COMPONENT_STANDARDS.md`.
- **Smart vs. Dumb**: Rules for component responsibilities.
- **Inputs/Outputs**: Naming conventions and types.
- **Templates**: Control flow syntax preferences.

## 7. State Management / Services
Update `Docs/Apps/[System]/STATE_MANAGEMENT.md`.
- **Stores**: Global vs. Feature state.
- **Persistence**: LocalStorage, Database, or In-Memory.
- **Reactivity**: How data flows (Signals, Observables, Event Loop).

## 8. Verification
- **Action**: Review all generated markdown files for consistency.
- **Action**: Verify that no code logic was altered during the commenting phase.
