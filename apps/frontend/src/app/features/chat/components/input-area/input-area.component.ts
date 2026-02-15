/**
 * Input Area Component (Dumb/Presentational)
 * ===========================================
 * Captures user text input and file uploads (drag-and-drop).
 * Emits events up to the smart container.
 * Based on: Docs/Apps/Client/SpecSheet.md § 4.2
 */
import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-input-area',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="input-area">
      <!-- TODO: Text input with auto-resize -->
      <!-- TODO: Drag-and-drop file zone -->
      <!-- TODO: Send button -->
      <p>Input Area - Placeholder</p>
    </div>
  `,
    styles: [`
    .input-area {
      padding: 1rem;
      border-top: 1px solid var(--border);
    }
  `],
})
export class InputAreaComponent {
    // TODO: @Output() messageSent = new EventEmitter<string>();
    // TODO: @Output() fileUploaded = new EventEmitter<File>();
}
