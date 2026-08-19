import { getDatabaseProvider } from './databaseService';
import { validateSQL } from './sqlValidator';
import { buildTableSchema, generateSafeTableName } from './schemaService';
import { QueryResult, SQLTableSchema, QueryExecutionOptions } from './types';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';

/**
 * Orchestrates analytical SQL execution against an active dataset.
 * Ensures the dataset table is prepared, validates the query, and executes safely.
 */
export async function executeDatasetQuery(
  dataset: Dataset,
  profile: DatasetProfile | null,
  rawSQL: string,
  options: QueryExecutionOptions = {}
): Promise<{ result: QueryResult; schema: SQLTableSchema; sanitizedSQL: string }> {
  const db = getDatabaseProvider();
  await db.initialize();

  const tableName = generateSafeTableName(dataset.datasetId);
  let schema = await db.getDatasetSchema(tableName);

  // 1. If table is not in database, ingest it from available profile / dataset rows
  if (!schema || schema.rowCount === 0) {
    const tableSchema = buildTableSchema(dataset, profile);
    
    // Extract rows from previewSample or profile sample
    let rows: (string | number | boolean | null)[][] = [];
    if (dataset.previewSample && dataset.previewSample.rows) {
      rows = dataset.previewSample.rows;
    }

    const ingestionResult = await db.createDatasetTable(
      tableName,
      tableSchema.columns,
      rows,
      { replace: true }
    );

    if (!ingestionResult.success) {
      throw new Error(`Failed to initialize analytical table: ${ingestionResult.error}`);
    }

    schema = tableSchema;
  }

  // 2. Validate SQL for security, read-only permissions, and table/column allowlists
  const validation = validateSQL(rawSQL, tableName, schema);
  if (!validation.isValid) {
    throw new Error(`SQL Validation Error: ${validation.error}`);
  }

  const queryToRun = validation.sanitizedSQL || rawSQL;

  // 3. Execute query with timeout and row bounds
  const result = await db.executeQuery(queryToRun, options);

  return {
    result,
    schema,
    sanitizedSQL: queryToRun,
  };
}

/**
 * Formats a QueryResult as a downloadable CSV string
 */
export function exportResultToCSV(result: QueryResult): string {
  if (!result || !result.columns || result.columns.length === 0) {
    return '';
  }

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = result.columns.map(escapeCSV).join(',');
  const dataLines = result.rows.map((row) => row.map(escapeCSV).join(','));

  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a browser file download of CSV result
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
