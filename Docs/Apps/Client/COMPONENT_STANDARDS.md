# Component Standards
> strict rules for building UI components in Angular 18+.

## Core Principles

### Smart vs. Dumb
- **Smart Components (Containers)**:
  - Connect to **Stores** or **Services**.
  - Pass data down via `[inputs]`.
  - Listen to events via `(outputs)`.
  - **Example**: `ChatWindowComponent`
- **Dumb Components (UI)**:
  - **NO** Service injections.
  - Receive data *only* via `input()`.
  - Communicate interactions *only* via `output()`.
  - **Example**: `MessageBubbleComponent`, `InputAreaComponent`.

### Signal Inputs/Outputs
> Use the new Signal-based API.

```typescript
// PREFERRED
export class MyComponent {
  // Input Signal (Read-only)
  data = input.required<MyData>();
  
  // Output Emitter
  action = output<string>();
  
  // Computed Signal
  formattedData = computed(() => this.data().value.toUpperCase());
}

// FORBIDDEN (Legacy)
@Input() data: MyData;
@Output() action = new EventEmitter<string>();
```

## Template Standards
> Use the new Control Flow syntax.

```html
<!-- PREFERRED -->
@if (isLoading()) {
  <spinner />
} @else {
  @for (item of items(); track item.id) {
    <item-card [data]="item" />
  }
}

<!-- FORBIDDEN (Legacy) -->
<div *ngIf="isLoading">...</div>
<div *ngFor="let item of items">...</div>
```

## Performance Setup
- `changeDetection: ChangeDetectionStrategy.OnPush` is **MANDATORY**.
- `standalone: true` is **MANDATORY**.
- Use `imports: [...]` for minimal dependency coupling.

## Naming Conventions
- **Files**: `kebab-case.component.ts`
- **Selectors**: `app-kebab-case`
- **Classes**: `PascalCaseComponent`