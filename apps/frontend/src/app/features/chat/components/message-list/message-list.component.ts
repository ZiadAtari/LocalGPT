/**
 * Message List Component (Dumb/Presentational)
 * =============================================
 * Renders the list of messages. Uses Virtual Scrolling (Angular CDK)
 * for performance with 100+ messages.
 * Based on: Docs/Apps/Client/SpecSheet.md § 7.1
 */
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-message-list',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <!-- TODO: Implement cdk-virtual-scroll-viewport -->
    <div class="message-list">
      <p>Message List - Placeholder</p>
    </div>
  `,
    styles: [`
    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
  `],
})
export class MessageListComponent {
    // TODO: @Input() messages: ChatMessage[] = [];
}
