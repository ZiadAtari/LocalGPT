/**
 * Message Bubble Component (Dumb/Presentational)
 * ===============================================
 * Renders a single message with Markdown support and code blocks.
 * Based on: Docs/Apps/Client/SpecSheet.md § 4.1
 *
 * Features:
 *   - Markdown rendering (via ngx-markdown)
 *   - Syntax-highlighted code blocks
 *   - Copy-to-clipboard button on code blocks
 */
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-message-bubble',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="message-bubble">
      <!-- TODO: Render markdown content -->
      <!-- TODO: Handle user vs assistant styling -->
      <p>Message Bubble - Placeholder</p>
    </div>
  `,
    styles: [`
    .message-bubble {
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      margin-bottom: 0.5rem;
      max-width: 80%;
    }
  `],
})
export class MessageBubbleComponent {
    // TODO: @Input() message: UI_Message;
    // TODO: @Input() role: 'user' | 'assistant';
}
