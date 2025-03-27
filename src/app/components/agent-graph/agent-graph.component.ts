import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { AgentExecutionService } from '../../services/agent-execution.service';
import { GraphData, GraphNode, GraphLink } from '../../models/agent-execution.model';

@Component({
  selector: 'app-agent-graph',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="graph-container">
      <div class="controls">
        <button (click)="previousPage()" [disabled]="currentPage === 1">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span>Page {{currentPage}}</span>
        <button (click)="nextPage()" [disabled]="!hasNextPage">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="svg-container">
        <svg #svg>
          <g class="zoom-container"></g>
        </svg>
      </div>
      <div class="tooltip-container">
        <div class="tooltip">
          <div class="tooltip-header"></div>
          <div class="tooltip-content"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
    }
    .graph-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      background: #fafafa;
    }
    .controls {
      padding: 12px;
      display: flex;
      gap: 16px;
      align-items: center;
      background: #fff;
      border-bottom: 1px solid rgba(0,0,0,0.1);
      z-index: 2;
    }
    .controls button {
      padding: 8px 16px;
      border: none;
      background: #f5f7fa;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .controls button:hover:not([disabled]) {
      background: #e3f2fd;
    }
    .controls button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .controls span {
      font-size: 14px;
      color: #37474f;
    }
    .svg-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      min-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .zoom-container {
      width: 100%;
      height: 100%;
    }
    .node {
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .node:hover {
      transform: scale(1.1);
    }
    .node circle {
      stroke: #fff;
      stroke-width: 2px;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }
    .node text {
      fill: #2c3e50;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .link {
      transition: all 0.3s ease;
    }
    .link:hover {
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)) !important;
    }
    .tooltip-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .tooltip {
      position: absolute;
      background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      visibility: hidden;
      opacity: 0;
      transition: all 0.3s ease;
      max-width: 300px;
      border: 1px solid rgba(0,0,0,0.1);
    }
    .tooltip.visible {
      visibility: visible;
      opacity: 1;
      transform: translateY(-5px);
    }
    .tooltip-header {
      font-weight: 600;
      margin-bottom: 12px;
      color: #1a237e;
      font-size: 16px;
      border-bottom: 2px solid #e3f2fd;
      padding-bottom: 8px;
    }
    .tooltip-content {
      font-size: 14px;
      color: #37474f;
      line-height: 1.5;
    }
    .tooltip-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
      color: #546e7a;
    }
    .tooltip-description {
      margin: 10px 0;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      color: #455a64;
    }
    .tooltip-history {
      max-height: 200px;
      overflow-y: auto;
      margin-top: 12px;
      padding-right: 8px;
    }
    .tooltip-history::-webkit-scrollbar {
      width: 6px;
    }
    .tooltip-history::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    .tooltip-history::-webkit-scrollbar-thumb {
      background: #90a4ae;
      border-radius: 3px;
    }
    .tooltip-history-item {
      padding: 8px;
      border-left: 3px solid #2196f3;
      margin-bottom: 8px;
      background: #e3f2fd;
      border-radius: 0 4px 4px 0;
    }
    .tooltip-history-author {
      font-weight: 600;
      color: #1565c0;
      margin-bottom: 4px;
    }
    .tooltip-history-content {
      color: #37474f;
      margin-bottom: 4px;
    }
    .tooltip-history-model {
      font-size: 12px;
      color: #78909c;
    }
  `]
})
export class AgentGraphComponent implements OnInit {
  @ViewChild('svg', { static: true }) private svgElement!: ElementRef<SVGElement>;
  private svg!: d3.Selection<SVGElement, unknown, null, undefined>;
  private simulation!: d3.Simulation<d3.SimulationNodeDatum, undefined>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

  private width = 800;
  private height = 600;
  private currentData: any = null;
  selectedNode: GraphNode | null = null;

  hasMore = false;
  currentPage = 1;
  hasNextPage = false;
  totalNodes = 0;

  constructor(private agentExecutionService: AgentExecutionService) {}

  ngOnInit() {
    this.initializeGraph();
    this.loadData();
  }

  private initializeGraph(): void {
    // Initialize SVG with responsive dimensions
    this.svg = d3.select<SVGElement, unknown>(this.svgElement.nativeElement);
    
    // Set initial dimensions
    this.updateDimensions();

    // Add resize listener
    window.addEventListener('resize', () => {
      this.updateDimensions();
      if (this.currentData) {
        this.updateGraph(this.currentData);
      }
    });

    // Create tooltip div
    const tooltipContainer = d3.select<HTMLDivElement, unknown>('.tooltip-container');
    this.tooltip = tooltipContainer.select<HTMLDivElement>('.tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

    // Initialize simulation with dynamic dimensions
    this.initializeSimulation();

    // Load initial data
    this.loadData();
  }

  private updateDimensions() {
    const container = this.svgElement.nativeElement.parentElement;
    if (container) {
      this.width = container.clientWidth;
      this.height = container.clientHeight;

      this.svg
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('viewBox', [0, 0, this.width, this.height]);
    }
  }

  private initializeSimulation() {
    this.simulation = d3.forceSimulation<d3.SimulationNodeDatum>()
      .force('link', d3.forceLink().id((d: any) => d.id).distance(200))
      .force('charge', d3.forceManyBody()
        .strength(-2000)
        .distanceMin(100)
        .distanceMax(Math.min(this.width, this.height) / 2))
      .force('collide', d3.forceCollide().radius(80).iterations(4))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('x', d3.forceX(this.width / 2).strength(0.1))
      .force('y', d3.forceY(this.height / 2).strength(0.1));
  }

  private loadData() {
    this.agentExecutionService.getDataByGroupId('3D62EDA5-A2DD-4A23-98FF-AB1B758FDD9C', this.currentPage)
      .subscribe(data => {
        this.currentData = data;
        this.updateGraph(data);
        this.updatePaginationInfo(data);
      });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadData();
    }
  }

  nextPage() {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadData();
    }
  }

  private updatePaginationInfo(data: any) {
    this.hasMore = data.hasMore || false;
    this.hasNextPage = data.hasMore;
    this.totalNodes = (data.totalPages || 1) * 10;
  }

  private updateGraph(data: any): void {
    if (!data) return;

    // Store component reference for callbacks
    const self = this;

    // Clear previous graph elements
    const zoomContainer = this.svg.select<SVGGElement>('.zoom-container');
    zoomContainer.selectAll('*').remove();

    // Update simulation with new dimensions
    this.simulation
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('x', d3.forceX(this.width / 2).strength(0.1))
      .force('y', d3.forceY(this.height / 2).strength(0.1))
      .force('charge', d3.forceManyBody()
        .strength(-2000)
        .distanceMin(100)
        .distanceMax(Math.min(this.width, this.height) / 2));

    // Create arrow markers
    const defs = zoomContainer.append('defs');
    
    // Right arrow marker
    defs.append('marker')
      .attr('id', 'arrow-right')
      .attr('viewBox', '0 0 512 512')
      .attr('refX', 256)
      .attr('refY', 256)
      .attr('markerWidth', 12)
      .attr('markerHeight', 12)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#1565C0')
      .attr('d', 'M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm-28.9 143.6l75.5 72.4H120c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h182.6l-75.5 72.4c-9.7 9.3-9.9 24.8-.4 34.3l11 10.9c9.4 9.4 24.6 9.4 33.9 0L404.3 273c9.4-9.4 9.4-24.6 0-33.9L271.6 106.3c-9.4-9.4-24.6-9.4-33.9 0l-11 10.9c-9.5 9.6-9.3 25.1.4 34.4z');
    
    // Create gradient for links
    const gradient = defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('gradientUnits', 'userSpaceOnUse');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2196F3')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#03A9F4')
      .attr('stop-opacity', 0.4);

    // Create highlighted gradient
    const highlightedGradient = defs.append('linearGradient')
      .attr('id', 'link-gradient-highlighted')
      .attr('gradientUnits', 'userSpaceOnUse');

    highlightedGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1565C0')
      .attr('stop-opacity', 1);

    highlightedGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1976D2')
      .attr('stop-opacity', 0.8);

    // Create node gradients
    const successGradient = defs.append('linearGradient')
      .attr('id', 'node-gradient-success')
      .attr('gradientUnits', 'userSpaceOnUse');
    successGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#43A047')
      .attr('stop-opacity', 1);
    successGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#66BB6A')
      .attr('stop-opacity', 0.8);

    const runningGradient = defs.append('linearGradient')
      .attr('id', 'node-gradient-running')
      .attr('gradientUnits', 'userSpaceOnUse');
    runningGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1E88E5')
      .attr('stop-opacity', 1);
    runningGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#42A5F5')
      .attr('stop-opacity', 0.8);

    const errorGradient = defs.append('linearGradient')
      .attr('id', 'node-gradient-error')
      .attr('gradientUnits', 'userSpaceOnUse');
    errorGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#E53935')
      .attr('stop-opacity', 1);
    errorGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#EF5350')
      .attr('stop-opacity', 0.8);

    const pendingGradient = defs.append('linearGradient')
      .attr('id', 'node-gradient-pending')
      .attr('gradientUnits', 'userSpaceOnUse');
    pendingGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FB8C00')
      .attr('stop-opacity', 1);
    pendingGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FFA726')
      .attr('stop-opacity', 0.8);

    // Create container for all graph elements
    const graphContainer = zoomContainer.append<SVGGElement>('g')
      .attr('class', 'graph-content');

    // Create links
    const links = graphContainer.selectAll<SVGPathElement, any>('.link')
      .data(data.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', 'url(#link-gradient)')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .attr('fill', 'none')
      .attr('marker-mid', 'url(#arrow-right)')
      .style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))')
      .style('cursor', 'pointer');

    // Create nodes
    const nodes = graphContainer.selectAll<SVGGElement, any>('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circles to nodes
    nodes.append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => this.getColorByStatus(d.status));

    // Add labels
    nodes.append('text')
      .attr('dy', '35px')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text((d: any) => d.label);

    // Add hover events
    this.addHoverEvents(nodes, links);

    // Update simulation
    this.simulation
      .nodes(data.nodes)
      .force('link', d3.forceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>(data.links).id((d: any) => d.id).distance(200))
      .on('tick', () => {
        links.attr('d', (d: any) => {
          const sourceX = d.source.x;
          const sourceY = d.source.y;
          const targetX = d.target.x;
          const targetY = d.target.y;
          
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;
          
          return `M${sourceX},${sourceY} L${midX},${midY} L${targetX},${targetY}`;
        });

        nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

    this.simulation.alpha(1).restart();

    // Add zoom behavior with bounds
    const zoom = d3.zoom<SVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        zoomContainer.attr('transform', event.transform.toString());
      });

    // Add zoom with initial transform
    this.svg
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity
        .translate(this.width / 2, this.height / 2)
        .scale(0.8)
        .translate(-this.width / 2, -this.height / 2));

    // Add bounds to node positions
    this.simulation.on('tick', () => {
      const padding = 50;
      
      nodes.each((d: any) => {
        d.x = Math.max(padding, Math.min(this.width - padding, d.x));
        d.y = Math.max(padding, Math.min(this.height - padding, d.y));
      });

      links.attr('d', (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        return `M${sourceX},${sourceY} L${midX},${midY} L${targetX},${targetY}`;
      });

      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }

  private addHoverEvents(
    nodes: d3.Selection<SVGGElement, any, SVGGElement, unknown>,
    links: d3.Selection<SVGPathElement, any, SVGGElement, unknown>
  ): void {
    // Store component reference for callbacks
    const self = this;

    // Add hover events to nodes
    nodes.on('mouseover', function(this: SVGGElement, event: MouseEvent, d: any) {
        const node = d3.select(this);
        
        // Highlight connections
        self.highlightConnections(d, links, nodes);
        
        // Show tooltip with animation
        const rect = this.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Format history if available
        let historyHtml = '';
        if (d.data.agent_execution_history) {
          try {
            const history = JSON.parse(d.data.agent_execution_history);
            historyHtml = `
              <div class="tooltip-history">
                ${history.map((item: any) => `
                  <div class="tooltip-history-item">
                    <div class="tooltip-history-author">${item.AuthorName}</div>
                    <div class="tooltip-history-content">${item.Content}</div>
                    <div class="tooltip-history-model">Model: ${item.ModelId}</div>
                  </div>
                `).join('')}
              </div>
            `;
          } catch (e) {
            historyHtml = '<div class="tooltip-history">Unable to parse history</div>';
          }
        }

        // Update tooltip content
        self.tooltip.select('.tooltip-header')
          .html(`
            <h3>${d.label}</h3>
          `);

        self.tooltip.select('.tooltip-content')
          .html(`
            <div class="tooltip-meta">
              <span>Status: ${d.status}</span>
              <span>${self.getFormattedDate(d.data.run_on)}</span>
            </div>
            ${d.description ? `<div class="tooltip-description">${d.description}</div>` : ''}
            ${historyHtml}
          `);

        // Position and show tooltip
        self.tooltip
          .style('left', `${rect.left + scrollLeft + rect.width/2}px`)
          .style('top', `${rect.top + scrollTop - 10}px`)
          .style('transform', 'translate(-50%, -100%)')
          .style('visibility', 'visible')
          .classed('visible', true);
      })
      .on('mouseout', function(this: SVGGElement, event: MouseEvent, d: any) {
        // Remove highlights
        links.style('stroke', 'url(#link-gradient)').style('stroke-width', 2);
        nodes.style('opacity', 1);
        
        // Hide tooltip with animation
        self.tooltip
          .classed('visible', false)
          .style('visibility', 'hidden');
      });

    // Add hover events to links
    links.on('mouseover', function(this: SVGPathElement, event: MouseEvent, d: any) {
        const link = d3.select(this);
        link
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 1)
          .style('filter', 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))')
          .attr('stroke', 'url(#link-gradient-highlighted)');
          
        // Show tooltip with animation
        const linkElement = this as SVGPathElement;
        const pathLength = linkElement.getTotalLength();
        const midPoint = linkElement.getPointAtLength(pathLength / 2);
        const matrix = linkElement.getScreenCTM();
        
        if (matrix) {
          const transformedPoint = {
            x: midPoint.x * matrix.a + matrix.e,
            y: midPoint.y * matrix.d + matrix.f
          };
          
          self.tooltip.select('.tooltip-header')
            .html(`<h3>Connection Details</h3>`);

          self.tooltip.select('.tooltip-content')
            .html(`
              <div class="tooltip-meta">
                <span>From: ${d.source.label}</span>
                <span>To: ${d.target.label}</span>
              </div>
            `);
          
          self.tooltip
            .style('left', `${transformedPoint.x}px`)
            .style('top', `${transformedPoint.y - 10}px`)
            .style('transform', 'translate(-50%, -100%)')
            .style('visibility', 'visible')
            .classed('visible', true);
        }
      })
      .on('mouseout', function(this: SVGPathElement, event: MouseEvent, d: any) {
        const link = d3.select(this);
        link
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.8)
          .style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))')
          .attr('stroke', 'url(#link-gradient)');
          
        // Hide tooltip with animation
        self.tooltip
          .classed('visible', false)
          .style('visibility', 'hidden');
      });
  }

  private highlightConnections(
    node: any,
    links: d3.Selection<SVGPathElement, any, SVGGElement, unknown>,
    nodes: d3.Selection<SVGGElement, any, SVGGElement, unknown>
  ): void {
    // Dim all nodes
    nodes.style('opacity', 0.3);
    
    // Highlight connected nodes and links
    const connectedNodes = new Set<string>();
    connectedNodes.add(node.id);

    links.style('stroke', (d: any) => {
      if (d.source.id === node.id || d.target.id === node.id) {
        connectedNodes.add(d.source.id);
        connectedNodes.add(d.target.id);
        return 'url(#link-gradient-highlighted)';
      }
      return 'url(#link-gradient)';
    }).style('stroke-width', (d: any) => {
      return d.source.id === node.id || d.target.id === node.id ? 3 : 2;
    });

    nodes.style('opacity', (d: any) => connectedNodes.has(d.id) ? 1 : 0.3);
  }

  private getColorByStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
        return 'url(#node-gradient-success)';
      case 'running':
        return 'url(#node-gradient-running)';
      case 'error':
        return 'url(#node-gradient-error)';
      case 'pending':
        return 'url(#node-gradient-pending)';
      default:
        return 'url(#node-gradient-pending)';
    }
  }

  private getFormattedDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  }
}
