export interface AgentExecutionHistory {
  id: string;
  ToolCalls: any[];
  AuthorName: string;
  Content: string;
  ModelId: string;
  Metadata: {
    Usage: {
      OutputTokenCount: number;
      InputTokenCount: number;
      TotalTokenCount: number;
      OutputTokenDetails: {
        ReasoningTokenCount: number;
      };
    };
    Refusal: null;
    FinishReason: string;
  };
}

export interface AgentExecution {
  id: string;
  agent_group_id: string;
  agent_execution_history: string;
  app_insight_operation_id: string;
  run_status: string;
  run_on: string;
  timestamp?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  status: string;
  data: AgentExecution;
  order: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  hasMore?: boolean;
  currentPage?: number;
  totalPages?: number;
}
