import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import {
  DatabaseProvider,
  DatabaseEngineType,
  SQLColumnSchema,
  SQLTableSchema,
  QueryResult,
  IngestionResult,
  QueryExecutionOptions,
} from './types';
import { quoteIdentifier } from './schemaService';

const getInitSqlJs = () => {
  if (typeof initSqlJs === 'function') return initSqlJs;
  if ((initSqlJs as any)?.default && typeof (initSqlJs as any).default === 'function') {
    return (initSqlJs as any).default;
  }
  return initSqlJs;
};

const DEFAULT_QUERY_TIMEOUT_MS = 15000;
const MAX_DEFAULT_ROWS = 1000;
const MAX_DEFAULT_COLUMNS = 50;

/**
 * SQLite WASM Database Provider Implementation
 * Provides high-speed in-memory analytical SQL execution without native C++ compilation dependencies.
 */
export class SqliteWasmProvider implements DatabaseProvider {
  readonly providerType: DatabaseEngineType = 'sqlite_wasm';
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private tableSchemas: Map<string, SQLTableSchema> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return;

    try {
      const initFn = getInitSqlJs();
      this.SQL = await initFn({
        // Locate WASM file if needed or use default embedded loader
      });
      this.db = new this.SQL.Database();
      this.isInitialized = true;
      console.log('SqliteWasmProvider initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize SqliteWasmProvider:', error);
      throw new Error(`Analytical database initialization failed: ${(error as Error).message}`);
    }
  }

  private ensureConnected(): Database {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database provider is not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async createDatasetTable(
    tableName: string,
    columns: SQLColumnSchema[],
    rows: (string | number | boolean | null)[][],
    options: { replace?: boolean } = { replace: true }
  ): Promise<IngestionResult> {
    const startTime = performance.now();
    await this.initialize();
    const db = this.ensureConnected();

    try {
      if (options.replace) {
        db.run(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)};`);
      }

      // 1. Generate CREATE TABLE SQL
      const colDefinitions = columns.map((col) => {
        const quotedCol = quoteIdentifier(col.name);
        let sqlDataType = 'TEXT';
        if (col.dataType === 'INTEGER') sqlDataType = 'INTEGER';
        else if (col.dataType === 'REAL') sqlDataType = 'REAL';
        else if (col.dataType === 'BOOLEAN') sqlDataType = 'INTEGER';
        return `${quotedCol} ${sqlDataType}`;
      });

      const createSQL = `CREATE TABLE ${quoteIdentifier(tableName)} (\n  ${colDefinitions.join(',\n  ')}\n);`;
      db.run(createSQL);

      // 2. Prepare bulk insert statement inside a transaction
      if (rows.length > 0) {
        const placeholders = columns.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO ${quoteIdentifier(tableName)} VALUES (${placeholders});`;
        const stmt = db.prepare(insertSQL);

        db.run('BEGIN TRANSACTION;');

        try {
          for (let r = 0; r < rows.length; r++) {
            const rawRow = rows[r];
            const boundValues: any[] = [];

            for (let c = 0; c < columns.length; c++) {
              const col = columns[c];
              const rawVal = rawRow[c];

              // Clean and cast value
              if (rawVal === null || rawVal === undefined || rawVal === '' || rawVal === 'null' || rawVal === 'NA' || rawVal === 'N/A') {
                boundValues.push(null);
              } else if (col.dataType === 'INTEGER') {
                const cleaned = String(rawVal).replace(/[$,]/g, '').trim();
                const num = parseInt(cleaned, 10);
                boundValues.push(isNaN(num) ? null : num);
              } else if (col.dataType === 'REAL') {
                const cleaned = String(rawVal).replace(/[$,%]/g, '').trim();
                const num = parseFloat(cleaned);
                boundValues.push(isNaN(num) ? null : num);
              } else if (col.dataType === 'BOOLEAN') {
                if (typeof rawVal === 'boolean') {
                  boundValues.push(rawVal ? 1 : 0);
                } else {
                  const s = String(rawVal).toLowerCase().trim();
                  boundValues.push(s === 'true' || s === '1' || s === 'yes' ? 1 : 0);
                }
              } else {
                boundValues.push(String(rawVal));
              }
            }

            stmt.run(boundValues);
          }

          db.run('COMMIT;');
        } catch (insertErr) {
          db.run('ROLLBACK;');
          throw insertErr;
        } finally {
          stmt.free();
        }
      }

      // 3. Cache table schema
      const tableSchema: SQLTableSchema = {
        tableName,
        datasetId: tableName.replace('dataset_', ''),
        userId: 'system',
        columns,
        rowCount: rows.length,
        createdAt: new Date().toISOString(),
        version: 1,
      };
      this.tableSchemas.set(tableName, tableSchema);

      const durationMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        tableName,
        rowCount: rows.length,
        columnCount: columns.length,
        ingestionTimeMs: durationMs,
      };
    } catch (error: any) {
      console.error(`Failed to ingest table "${tableName}":`, error);
      return {
        success: false,
        tableName,
        rowCount: 0,
        columnCount: columns.length,
        ingestionTimeMs: Math.round(performance.now() - startTime),
        error: error.message || 'Table ingestion failed.',
      };
    }
  }

  async getDatasetSchema(tableName: string): Promise<SQLTableSchema | null> {
    if (this.tableSchemas.has(tableName)) {
      return this.tableSchemas.get(tableName)!;
    }

    const exists = await this.tableExists(tableName);
    if (!exists) return null;

    const db = this.ensureConnected();
    const res = db.exec(`PRAGMA table_info(${quoteIdentifier(tableName)});`);
    if (!res || res.length === 0 || !res[0].values) return null;

    const columns: SQLColumnSchema[] = res[0].values.map((row: any[]) => {
      const name = String(row[1]);
      const type = String(row[2]).toUpperCase();
      let dataType: any = 'TEXT';
      if (type.includes('INT')) dataType = 'INTEGER';
      else if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUB')) dataType = 'REAL';

      return {
        name,
        sanitizedName: name,
        dataType,
        nullable: row[3] === 0,
      };
    });

    const countRes = db.exec(`SELECT COUNT(*) FROM ${quoteIdentifier(tableName)};`);
    const rowCount = countRes && countRes[0]?.values[0] ? Number(countRes[0].values[0][0]) : 0;

    const schema: SQLTableSchema = {
      tableName,
      datasetId: tableName.replace('dataset_', ''),
      userId: 'system',
      columns,
      rowCount,
      createdAt: new Date().toISOString(),
      version: 1,
    };

    this.tableSchemas.set(tableName, schema);
    return schema;
  }

  async executeQuery(
    sql: string,
    options: QueryExecutionOptions = {}
  ): Promise<QueryResult> {
    const startTime = performance.now();
    await this.initialize();
    const db = this.ensureConnected();

    const maxRows = options.maxRows || MAX_DEFAULT_ROWS;
    const maxCols = options.maxColumns || MAX_DEFAULT_COLUMNS;
    const timeoutMs = options.timeoutMs || DEFAULT_QUERY_TIMEOUT_MS;

    return new Promise<QueryResult>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;
      let isSettled = false;

      // Timeout safety
      timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          reject(new Error(`Query execution timed out after ${timeoutMs}ms. Try narrowing filters or requesting fewer rows.`));
        }
      }, timeoutMs);

      try {
        const results = db.exec(sql);
        if (timeoutId) clearTimeout(timeoutId);
        if (isSettled) return;
        isSettled = true;

        const durationMs = Math.round(performance.now() - startTime);

        if (!results || results.length === 0) {
          return resolve({
            columns: [],
            rows: [],
            rowCount: 0,
            executionTimeMs: durationMs,
            truncated: false,
          });
        }

        const firstResult = results[0];
        let returnCols = firstResult.columns || [];
        let returnRows = firstResult.values || [];

        // Apply column limit if excessive
        if (returnCols.length > maxCols) {
          returnCols = returnCols.slice(0, maxCols);
          returnRows = returnRows.map((r) => r.slice(0, maxCols));
        }

        // Apply row limit
        const totalRowsAvailable = returnRows.length;
        const truncated = returnRows.length > maxRows;
        if (truncated) {
          returnRows = returnRows.slice(0, maxRows);
        }

        // Clean values (e.g. convert nulls / format floats / Uint8Array)
        const sanitizedRows: (string | number | boolean | null)[][] = returnRows.map((row) =>
          row.map((cell) => {
            if (cell === null || cell === undefined) return null;
            if (typeof cell === 'number' && Number.isNaN(cell)) return null;
            if (cell instanceof Uint8Array) return new TextDecoder().decode(cell);
            return cell as string | number | boolean;
          })
        );

        resolve({
          columns: returnCols,
          rows: sanitizedRows,
          rowCount: sanitizedRows.length,
          totalRowsAvailable,
          executionTimeMs: durationMs,
          truncated,
        });
      } catch (execError: any) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!isSettled) {
          isSettled = true;
          reject(new Error(execError.message || 'SQL execution failed in analytical database.'));
        }
      }
    });
  }

  async dropDatasetTable(tableName: string): Promise<boolean> {
    if (!this.db || !this.isInitialized) return true;
    try {
      this.db.run(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)};`);
      this.tableSchemas.delete(tableName);
      return true;
    } catch (e) {
      console.warn(`Failed to drop table ${tableName}:`, e);
      return false;
    }
  }

  async tableExists(tableName: string): Promise<boolean> {
    if (!this.db || !this.isInitialized) return false;
    try {
      const res = this.db.exec(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=${quoteIdentifier(tableName)};`
      );
      return Boolean(res && res.length > 0 && res[0].values && res[0].values.length > 0);
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.tableSchemas.clear();
    }
  }
}

// Global Singleton Database Provider
let globalDbProvider: DatabaseProvider | null = null;

export function getDatabaseProvider(): DatabaseProvider {
  if (!globalDbProvider) {
    globalDbProvider = new SqliteWasmProvider();
  }
  return globalDbProvider;
}
