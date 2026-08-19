import { SQLColumnSchema, SQLTableSchema, SQLColumnType } from './types';
import { ColumnProfile, DatasetProfile } from '../../types/dataProfile';
import { Dataset } from '../../types/dataset';

// SQL Reserved Words that must be quoted if used as column identifiers
const SQL_RESERVED_WORDS = new Set([
  'order',
  'group',
  'by',
  'select',
  'from',
  'where',
  'table',
  'date',
  'user',
  'value',
  'rank',
  'case',
  'when',
  'then',
  'else',
  'end',
  'limit',
  'offset',
  'join',
  'left',
  'right',
  'inner',
  'outer',
  'full',
  'on',
  'as',
  'having',
  'distinct',
  'all',
  'and',
  'or',
  'not',
  'in',
  'like',
  'between',
  'is',
  'null',
  'primary',
  'key',
  'column',
  'filter',
  'over',
  'partition',
  'window',
]);

/**
 * Generates a strictly safe, isolated table identifier for a dataset.
 * e.g. "dataset_a82f93d1"
 */
export function generateSafeTableName(datasetId: string): string {
  // Extract alphanumeric characters and create stable prefix
  const cleanId = datasetId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `dataset_${cleanId}`;
}

/**
 * Sanitizes a column name for SQL standard identifiers.
 */
export function sanitizeColumnName(rawName: string): string {
  if (!rawName) return 'unnamed_column';
  
  // Replace spaces and special characters with underscores
  let cleaned = rawName
    .trim()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase();

  // If begins with a digit, prefix with col_
  if (/^\d/.test(cleaned)) {
    cleaned = `col_${cleaned}`;
  }

  return cleaned || 'col';
}

/**
 * Safely quotes an identifier if it has spaces, special characters, or is a reserved keyword
 */
export function quoteIdentifier(identifier: string): string {
  if (
    SQL_RESERVED_WORDS.has(identifier.toLowerCase()) ||
    /[\s\-–—/\\+*()$%#@!?.,]/.test(identifier) ||
    /^\d/.test(identifier)
  ) {
    // Quote with standard SQL double quotes
    return `"${identifier.replace(/"/g, '""')}"`;
  }
  return identifier;
}

/**
 * Maps logical data types to SQL column types
 */
export function mapLogicalToSQLType(logicalType: string): SQLColumnType {
  switch (logicalType) {
    case 'integer':
      return 'INTEGER';
    case 'decimal':
    case 'numeric':
    case 'currency':
    case 'percentage':
      return 'REAL';
    case 'boolean':
      return 'BOOLEAN';
    case 'date':
      return 'DATE';
    case 'datetime':
      return 'DATETIME';
    case 'categorical':
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
    case 'postal_code':
    default:
      return 'TEXT';
  }
}

/**
 * Builds a complete SQLTableSchema from a Dataset and DatasetProfile
 */
export function buildTableSchema(
  dataset: Dataset,
  profile?: DatasetProfile | null
): SQLTableSchema {
  const tableName = generateSafeTableName(dataset.datasetId);
  const columns: SQLColumnSchema[] = [];

  if (profile && profile.columns && profile.columns.length > 0) {
    for (const col of profile.columns) {
      const sqlCol: SQLColumnSchema = {
        name: col.name,
        sanitizedName: sanitizeColumnName(col.name),
        dataType: mapLogicalToSQLType(col.logicalType),
        nullable: col.missingPercentage > 0,
        sampleValues: col.sampleValues?.slice(0, 5),
        distinctCount: col.uniqueCount,
        min: col.numericStats?.min ?? col.dateStats?.minDate ?? null,
        max: col.numericStats?.max ?? col.dateStats?.maxDate ?? null,
      };
      columns.push(sqlCol);
    }
  } else if (dataset.previewSample) {
    for (const colName of dataset.previewSample.columns) {
      columns.push({
        name: colName,
        sanitizedName: sanitizeColumnName(colName),
        dataType: 'TEXT',
        nullable: true,
      });
    }
  }

  return {
    tableName,
    datasetId: dataset.datasetId,
    userId: dataset.userId,
    columns,
    rowCount: profile?.rowCount || dataset.rowCount || 0,
    createdAt: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Formats table schema into a clean, unambiguous prompt context for Gemini SQL generation
 */
export function formatSchemaForPrompt(schema: SQLTableSchema): string {
  let text = `=== DATABASE SCHEMA ===\n`;
  text += `Table Name: ${schema.tableName}\n`;
  text += `Total Records: ${schema.rowCount.toLocaleString()} rows\n\n`;
  text += `COLUMNS & TYPES:\n`;

  for (const col of schema.columns) {
    const isQuoted = quoteIdentifier(col.name) !== col.name;
    const identifierFormat = isQuoted ? `"${col.name}"` : col.name;
    
    let line = `• ${identifierFormat} (${col.dataType})`;
    if (col.nullable) line += ` [NULLABLE]`;
    if (col.distinctCount !== undefined && col.distinctCount !== null) {
      line += ` - ${col.distinctCount} distinct values`;
    }
    if (col.min !== undefined && col.min !== null && col.max !== undefined && col.max !== null) {
      line += ` (Range: ${col.min} to ${col.max})`;
    }
    if (col.sampleValues && col.sampleValues.length > 0) {
      const samples = col.sampleValues
        .filter((v) => v !== null && v !== undefined && v !== '')
        .slice(0, 4)
        .map((v) => (typeof v === 'string' ? `"${v}"` : String(v)))
        .join(', ');
      if (samples) {
        line += ` | Samples: [${samples}]`;
      }
    }
    text += `${line}\n`;
  }

  text += `=======================`;
  return text;
}
