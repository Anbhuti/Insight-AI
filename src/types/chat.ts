export type MessageRole = 'user' | 'assistant' | 'system';

export interface VisualizationRecommendation {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'table' | 'kpi_card';
  title: string;
  description: string;
  xAxisColumn?: string;
  yAxisColumn?: string;
  breakdownColumn?: string;
  rationale: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO string
  suggestedFollowUps?: string[];
  visualization?: VisualizationRecommendation;
  feedback?: 'like' | 'dislike' | null;
  status?: 'sending' | 'complete' | 'error';
  errorMessage?: string;
  // SQL Agent Metadata
  isSQLQuery?: boolean;
  sqlQuery?: string;
  sqlColumns?: string[];
  sqlRows?: (string | number | boolean | null)[][];
  sqlRowCount?: number;
  sqlExecutionTimeMs?: number;
  sqlMethodology?: string;
  sqlColumnsUsed?: string[];
  sqlDataQualityNotes?: string[];
  sqlRepairAttempts?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  datasetId: string;
  datasetName: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageSnippet?: string;
}

export interface CompactColumnContext {
  name: string;
  type: string;
  missingPercentage: number;
  uniqueCount: number;
  min?: number | string | null;
  max?: number | string | null;
  mean?: number | null;
  median?: number | null;
  stdDev?: number | null;
  topCategories?: { value: string; count: number; percentage: number }[];
  outlierCount?: number;
  isHighCardinality?: boolean;
  sampleValues?: (string | number | boolean | null)[];
}

export interface DatasetAnalystContext {
  datasetId: string;
  datasetName: string;
  rowCount: number;
  columnCount: number;
  fileType: string;
  qualityScore: number;
  duplicateRowCount: number;
  missingCellPercentage: number;
  columns: CompactColumnContext[];
  criticalIssues: {
    category: string;
    severity: string;
    description: string;
    recommendation: string;
  }[];
  sampleRows?: Record<string, any>[];
}

export interface AnalystChatPayload {
  userId: string;
  datasetId: string;
  conversationId: string;
  message: string;
  history: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  datasetContext: DatasetAnalystContext;
}

export interface AnalystResponsePayload {
  content: string;
  suggestedFollowUps?: string[];
  visualization?: VisualizationRecommendation;
}
