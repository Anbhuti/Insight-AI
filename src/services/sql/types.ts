/**
 * Types and interfaces for the SQL Analytics Engine and Database Abstraction
 */

export type IngestionStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type DatabaseEngineType = 'duckdb' | 'sqlite_wasm' | 'postgresql';

export type SQLColumnType = 'INTEGER' | 'REAL' | 'TEXT' | 'DATE' | 'DATETIME' | 'BOOLEAN';

export interface SQLColumnSchema {
  name: string;
  sanitizedName: string;
  dataType: SQLColumnType;
  nullable: boolean;
  sampleValues?: (string | number | boolean | null)[];
  distinctCount?: number;
  min?: number | string | null;
  max?: number | string | null;
}

export interface SQLTableSchema {
  tableName: string;
  datasetId: string;
  userId: string;
  columns: SQLColumnSchema[];
  rowCount: number;
  createdAt: string;
  version: number;
}

export interface QueryExecutionOptions {
  timeoutMs?: number;
  maxRows?: number;
  maxColumns?: number;
  signal?: AbortSignal;
}

export interface QueryResult {
  columns: string[];
  columnTypes?: Record<string, string>;
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  totalRowsAvailable?: number;
  executionTimeMs: number;
  truncated: boolean;
}

export interface SQLValidationResult {
  isValid: boolean;
  sanitizedSQL?: string;
  error?: string;
  errorCategory?: 'syntax' | 'blocked_keyword' | 'multi_statement' | 'unknown_table' | 'unknown_column' | 'permission';
  referencedTables: string[];
  referencedColumns: string[];
}

export interface IngestionResult {
  success: boolean;
  tableName: string;
  rowCount: number;
  columnCount: number;
  ingestionTimeMs: number;
  error?: string;
}

/**
 * Interface for Analytical Database Providers (DuckDB, SQLite WASM, etc.)
 */
export interface DatabaseProvider {
  readonly providerType: DatabaseEngineType;
  
  /**
   * Initializes the database engine connection/instance
   */
  initialize(): Promise<void>;

  /**
   * Ingests parsed dataset data into an isolated analytical table
   */
  createDatasetTable(
    tableName: string,
    columns: SQLColumnSchema[],
    rows: (string | number | boolean | null)[][],
    options?: { replace?: boolean }
  ): Promise<IngestionResult>;

  /**
   * Retrieves schema definition for an existing dataset table
   */
  getDatasetSchema(tableName: string): Promise<SQLTableSchema | null>;

  /**
   * Executes a validated read-only analytical SQL query
   */
  executeQuery(
    sql: string,
    options?: QueryExecutionOptions
  ): Promise<QueryResult>;

  /**
   * Drops a dataset analytical table
   */
  dropDatasetTable(tableName: string): Promise<boolean>;

  /**
   * Checks if table exists in analytical database
   */
  tableExists(tableName: string): Promise<boolean>;

  /**
   * Closes or cleans up resources
   */
  close(): Promise<void>;
}

export interface SQLAgentExplanation {
  answer: string;
  methodology: string;
  keyPoints?: string[];
  columnsUsed: string[];
  dataQualityNotes?: string[];
}

export interface SQLAgentResponse {
  status: 'success' | 'failed' | 'unsupported' | 'repaired';
  sql: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  executionTimeMs: number;
  explanation: SQLAgentExplanation;
  visualization?: {
    chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'kpi_card' | 'table';
    title: string;
    description: string;
    xAxisColumn?: string;
    yAxisColumn?: string;
    breakdownColumn?: string;
    rationale?: string;
  };
  repairAttempts?: number;
  error?: string;
}
