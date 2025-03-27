import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AgentGraphComponent } from './components/agent-graph/agent-graph.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AgentGraphComponent],
  template: `
    <div class="container">
      <h1>Agent Execution Graph</h1>
      <app-agent-graph></app-agent-graph>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  `]
})
export class AppComponent {
  title = 'agent-graph-visualization';
}
