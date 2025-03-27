# Agent Graph Visualization

An interactive visualization tool for agent execution graphs built with Angular and D3.js.

## Features

- Interactive graph visualization of agent execution flows
- Dynamic node styling and animations
- Zoom and pan capabilities
- Tooltips with detailed information
- Responsive design

## Integration Guide

### Prerequisites
1. Make sure your project uses Angular version 16 or higher
2. Node.js version 14 or higher
3. npm version 6 or higher

### Step 1: Install Dependencies
Add the required dependencies to your project:
```bash
# Install D3.js and its type definitions
npm install d3 @types/d3

# If you haven't already, install Angular Material (optional, for styling)
ng add @angular/material
```

### Step 2: Copy Required Files
1. Create these directories in your project if they don't exist:
```bash
mkdir -p src/app/components/agent-graph
mkdir -p src/app/models
mkdir -p src/app/services
```

2. Copy these files to your project:
```bash
# Components
cp src/app/components/agent-graph/agent-graph.component.ts <your-project>/src/app/components/agent-graph/
cp src/app/components/agent-graph/agent-graph.component.css <your-project>/src/app/components/agent-graph/

# Models
cp src/app/models/agent-execution.model.ts <your-project>/src/app/models/

# Services
cp src/app/services/agent-execution.service.ts <your-project>/src/app/services/
```

### Step 3: Update Module Imports
1. Add these imports to your `app.module.ts` (or the relevant module):
```typescript
import { AgentGraphComponent } from './components/agent-graph/agent-graph.component';
import { AgentExecutionService } from './services/agent-execution.service';

@NgModule({
  declarations: [
    // ... other declarations
  ],
  imports: [
    // ... other imports
    AgentGraphComponent  // Add this line
  ],
  providers: [
    AgentExecutionService  // Add this line
  ]
})
export class AppModule { }
```

### Step 4: Use the Component
1. Add the component to your template:
```html
<app-agent-graph></app-agent-graph>
```

2. Style the container (add to your CSS):
```css
:host {
  display: block;
  width: 100%;
  height: 100vh; /* or your preferred height */
}
```

### Step 5: Customize Data Integration
1. Modify `AgentExecutionService` to match your data structure:
```typescript
// In agent-execution.service.ts
interface YourDataStructure {
  // Define your data structure here
}

// Update the transformData method to match your data
private transformData(rawData: YourDataStructure): GraphData {
  // Transform your data to match the required format
  return {
    nodes: [...],
    links: [...]
  };
}
```

### Step 6: Configure Styling
1. Add these styles to your global `styles.scss`:
```scss
/* Required for proper graph display */
.graph-container {
  width: 100%;
  height: 100%;
  background: #fafafa;
}

/* Optional: Custom node colors */
.node-success { fill: #43A047; }
.node-error { fill: #E53935; }
.node-running { fill: #1E88E5; }
.node-pending { fill: #FB8C00; }
```

### Common Issues and Solutions

1. **Graph Not Visible**
   - Check container height/width
   - Ensure parent elements have explicit dimensions
   - Verify data is being passed correctly

2. **Styling Issues**
   - Make sure all CSS files are properly imported
   - Check for CSS specificity conflicts
   - Verify z-index for tooltips

3. **Performance Issues**
   - Limit number of nodes displayed at once
   - Implement pagination for large datasets
   - Use requestAnimationFrame for animations

### Data Format Requirements

The graph component expects data in this format:
```typescript
interface GraphData {
  nodes: {
    id: string;
    label: string;
    status: 'success' | 'error' | 'running' | 'pending';
    data?: any;  // Additional data for tooltips
  }[];
  links: {
    source: string;  // Node ID
    target: string;  // Node ID
    label?: string;
  }[];
}
```

## Development

### Local Development
```bash
ng serve
```
Navigate to `http://localhost:4200/`

### Building
```bash
ng build
```
Build artifacts will be in the `dist/` directory

## Technologies Used

- Angular v16+
- D3.js v7
- TypeScript v5
- SCSS
- Angular Material (optional)

## Support

For issues or questions:
1. Check the Common Issues section above
2. Review the example implementation in this repository
3. Create an issue in the GitHub repository

## License

MIT License - Feel free to use in your projects
