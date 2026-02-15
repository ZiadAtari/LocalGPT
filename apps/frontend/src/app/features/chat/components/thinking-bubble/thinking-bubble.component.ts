/**
 * Thinking Bubble Component (Dumb/Presentational)
 * ================================================
 * Renders the "Thinking" / reasoning process from models like DeepSeek R1.
 * Displayed as a collapsible accordion, separate from the final answer.
 * Based on: Docs/Apps/Client/SpecSheet.md § 4.1 ("Thinking" State Visualization)
 */
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-thinking-bubble',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <details class="thinking-bubble">
      <summary>Reasoning Process</summary>
      <div class="thinking-content">
        <!-- TODO: Render thought process text -->
        <p>Thinking content - Placeholder</p>
      </div>
    </details>
  `,
    styles: [`
    .thinking-bubble {
      background: var(--surface-secondary);
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `],
})
export class ThinkingBubbleComponent {
    // TODO: @Input() content: string;
}
