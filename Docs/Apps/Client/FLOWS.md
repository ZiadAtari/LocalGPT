# User Flows
> "Code explains how, this explains where to where."

## Authentication Loop
> Detailed steps from login to token storage to redirection.

1. **Login Request**: User submits credentials to `/login`.
2. **Token Handling**:
   - Access Token -> Memory / HttpOnly Cookie
   - Refresh Token -> HttpOnly Cookie
3. **Redirection**:
   - Success -> Dashboard
   - Failure -> Error Message / Reset Password Prompt
4. **Session Expiry**: Auto-refresh or force logout.

## Critical Paths
> The "Golden Path" for the user (e.g., Checkout flow, Onboarding).

### [Workflow Name, e.g., "Create Project"]
1. User clicks "New Project".
2. Modal opens with basic settings form.
3. User submits form -> Optimistic UI update.
4. Background request creates project.
5. User redirected to Project Details page.

## State Transitions
> How global state changes across different views.

- **Dashboard -> Profile**:
  - *State Change*: `currentView` updates, `userProfile` fetched if stale.
- **Logout**:
  - *State Change*: Clear `auth` store, reset `user` store, redirect to `/login`.