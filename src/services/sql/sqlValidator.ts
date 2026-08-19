import nodeSqlParser from 'node-sql-parser';
import { SQLValidationResult, SQLTableSchema, SQLColumnSchema } from './types';

// Handle ESM / CJS interop for node-sql-parser
const ParserConstructor = (nodeSqlParser as any).Parser || (nodeSqlParser as any).default?.Parser || nodeSqlParser;
const parser = new ParserConstructor();

// Prohibited SQL command keywords (case-insensitive)
const BLOCKED_COMMAND_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'PRAGMA',
  'ATTACH',
  'DETACH',
  'LOAD',
  'EXEC',
  'EXECUTE',
  'VACUUM',
  'REINDEX',
  'TRANSACTION',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'MERGE',
  'REPLACE',
  'EXPLAIN',
  'COPY',
  'SHOW',
  'DESCRIBE',
  'INTO OUTFILE',
  'INTO DUMPFILE',
  'LOAD_FILE',
];

// Dangerous functions (system/filesystem/network)
const BLOCKED_FUNCTIONS = [
  'READ_FILE',
  'WRITE_FILE',
  'HTTP_GET',
  'HTTP_POST',
  'SYSTEM',
  'SHELL',
  'LOAD_EXTENSION',
  'READ_CSV',
  'READ_PARQUET',
];

/**
 * Sanitizes and strips comments (both -- and /* *\/) that could be used for bypasses
 */
export function stripSQLComments(sql: string): string {
  if (!sql) return '';
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // Block comments
    .replace(/--.*$/gm, ' ') // Line comments
    .trim();
}

/**
 * Validates whether the proposed SQL query is safe, read-only, single-statement,
 * and targets only the allowed table and valid schema columns.
 */
export function validateSQL(
  rawSQL: string,
  allowedTable?: string,
  schema?: SQLTableSchema | { columns: { name: string; sanitizedName?: string }[] }
): SQLValidationResult {
  const sanitized = stripSQLComments(rawSQL).trim();

  if (!sanitized) {
    return {
      isValid: false,
      error: 'Empty SQL query provided.',
      errorCategory: 'syntax',
      referencedTables: [],
      referencedColumns: [],
    };
  }

  // 1. Multi-statement check: reject multiple semicolon-separated statements
  // Note: Ignore semicolons within string literals
  const statementCount = countStatements(sanitized);
  if (statementCount > 1) {
    return {
      isValid: false,
      error: 'Multiple SQL statements are strictly prohibited. Only single analytical queries are allowed.',
      errorCategory: 'multi_statement',
      referencedTables: [],
      referencedColumns: [],
    };
  }

  // Strip trailing semicolon for single statement
  const cleanSQL = sanitized.replace(/;+\s*$/, '').trim();

  // 2. Blacklist / Dangerous keyword check
  const upperSQL = cleanSQL.toUpperCase();
  for (const keyword of BLOCKED_COMMAND_KEYWORDS) {
    // Match whole word keyword
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(cleanSQL)) {
      return {
        isValid: false,
        error: `Query contains blocked operation: "${keyword}". InsightAI only permits read-only analytical queries.`,
        errorCategory: 'blocked_keyword',
        referencedTables: [],
        referencedColumns: [],
      };
    }
  }

  // Check dangerous functions
  for (const fn of BLOCKED_FUNCTIONS) {
    const regex = new RegExp(`\\b${fn}\\b\\s*\\(`, 'i');
    if (regex.test(cleanSQL)) {
      return {
        isValid: false,
        error: `Query invokes prohibited system/file function: "${fn}".`,
        errorCategory: 'permission',
        referencedTables: [],
        referencedColumns: [],
      };
    }
  }

  // 3. Must begin with SELECT or WITH (Common Table Expressions)
  if (!/^\s*(SELECT|WITH)\b/i.test(cleanSQL)) {
    return {
      isValid: false,
      error: 'Query must be a read-only analytical statement starting with SELECT or WITH.',
      errorCategory: 'blocked_keyword',
      referencedTables: [],
      referencedColumns: [],
    };
  }

  // 4. AST-based Parsing & Table/Column Inspection
  let referencedTables: string[] = [];
  let referencedColumns: string[] = [];

  try {
    // Attempt AST parse with standard SQL / SQLite dialect
    const ast = parser.astify(cleanSQL, { database: 'sqlite' });
    const astArray = Array.isArray(ast) ? ast : [ast];

    if (astArray.length > 1) {
      return {
        isValid: false,
        error: 'Multi-statement execution detected in AST.',
        errorCategory: 'multi_statement',
        referencedTables: [],
        referencedColumns: [],
      };
    }

    const singleAst = astArray[0];
    if (singleAst && singleAst.type !== 'select') {
      return {
        isValid: false,
        error: `Invalid query type: "${singleAst.type}". Only SELECT queries are permitted.`,
        errorCategory: 'blocked_keyword',
        referencedTables: [],
        referencedColumns: [],
      };
    }

    // Extract table references from parser
    const tableListResult = parser.tableList(cleanSQL, { database: 'sqlite' });
    referencedTables = tableListResult
      .map((t) => {
        // Format can be "select::null::table" or just table name
        const parts = t.split('::');
        return (parts[parts.length - 1] || t).replace(/[`"']/g, '').trim();
      })
      .filter((t) => Boolean(t) && t !== 'null' && !t.startsWith('__cte_'));

    // Extract column references from parser
    const columnListResult = parser.columnList(cleanSQL, { database: 'sqlite' });
    referencedColumns = columnListResult
      .map((c) => {
        const parts = c.split('::');
        return (parts[parts.length - 1] || c).replace(/[`"']/g, '').trim();
      })
      .filter((c) => Boolean(c) && c !== 'null' && c !== '*');
  } catch (parseError: any) {
    // If parser encounters specialized SQL functions (e.g. date formatting), fallback to regex table inspection
    console.warn('AST parser note, running strict regex fallback validator:', parseError.message);

    // Strict regex extraction of FROM and JOIN tables
    const tableMatches = cleanSQL.matchAll(/\b(?:FROM|JOIN)\s+([`"']?)([a-zA-Z0-9_]+)\1/gi);
    for (const match of tableMatches) {
      if (match[2]) referencedTables.push(match[2]);
    }
  }

  // 5. Verify Table Allowlist (Dataset Isolation)
  if (allowedTable) {
    // Clean allowedTable name
    const targetTable = allowedTable.replace(/[`"']/g, '').trim().toLowerCase();

    // If no tables extracted but FROM is present, extract first table
    if (referencedTables.length === 0) {
      const fallbackMatch = cleanSQL.match(/\bFROM\s+([`"']?)([a-zA-Z0-9_]+)\1/i);
      if (fallbackMatch && fallbackMatch[2]) {
        referencedTables.push(fallbackMatch[2]);
      }
    }

    // Validate all referenced tables against allowedTable
    for (const tbl of referencedTables) {
      const cleanTbl = tbl.toLowerCase();
      // Allow CTE aliases if defined in a WITH clause
      const isCTE = new RegExp(`\\bWITH\\s+${cleanTbl}\\s+AS`, 'i').test(cleanSQL);
      if (isCTE) continue;

      if (cleanTbl !== targetTable) {
        return {
          isValid: false,
          error: `Cross-dataset or unauthorized table access blocked. Referenced table "${tbl}" does not match active dataset table "${allowedTable}".`,
          errorCategory: 'unknown_table',
          referencedTables,
          referencedColumns,
        };
      }
    }
  }

  // 6. Verify Column Allowlist (if schema provided)
  if (schema && schema.columns && schema.columns.length > 0 && referencedColumns.length > 0) {
    const validColumnNames = new Set(
      schema.columns.flatMap((c) => [
        c.name.toLowerCase(),
        c.sanitizedName ? c.sanitizedName.toLowerCase() : '',
      ]).filter(Boolean)
    );

    // List of common SQL standard functions/keywords to ignore in column list
    const sqlKeywords = new Set([
      'sum', 'avg', 'count', 'min', 'max', 'round', 'coalesce', 'nullif',
      'upper', 'lower', 'trim', 'length', 'substr', 'strftime', 'date', 'cast',
      'year', 'month', 'day', 'as', 'distinct', 'case', 'when', 'then', 'else', 'end',
      'order', 'by', 'group', 'having', 'limit', 'offset', 'like', 'between', 'in', 'is', 'null'
    ]);

    for (const col of referencedColumns) {
      const colLower = col.toLowerCase();
      if (sqlKeywords.has(colLower)) continue;
      // If column is numeric literal or alias
      if (/^\d+$/.test(colLower)) continue;

      if (!validColumnNames.has(colLower)) {
        return {
          isValid: false,
          error: `Unknown column "${col}" referenced in query. Column does not exist in dataset schema.`,
          errorCategory: 'unknown_column',
          referencedTables,
          referencedColumns,
        };
      }
    }
  }

  // 7. Enforce LIMIT constraint if missing (prevent unbounded massive query returns)
  let finalizedSQL = cleanSQL;
  const hasLimit = /\bLIMIT\s+\d+/i.test(finalizedSQL);
  const isAggregateOnly = /^\s*SELECT\s+(SUM|AVG|COUNT|MIN|MAX)\s*\(/i.test(finalizedSQL) && !/\bGROUP\s+BY\b/i.test(finalizedSQL);

  if (!hasLimit && !isAggregateOnly) {
    finalizedSQL = `${finalizedSQL} LIMIT 1000`;
  }

  return {
    isValid: true,
    sanitizedSQL: finalizedSQL,
    referencedTables,
    referencedColumns,
  };
}

/**
 * Counts top-level statements separated by semicolons outside of string literals
 */
function countStatements(sql: string): number {
  let count = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '';

    if (char === "'" && prevChar !== '\\') {
      if (!inDoubleQuote) inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\') {
      if (!inSingleQuote) inDoubleQuote = !inDoubleQuote;
    } else if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      // Check if there is non-whitespace following the semicolon
      const remaining = sql.slice(i + 1).trim();
      if (remaining.length > 0) {
        count++;
      }
    }
  }

  return count;
}
