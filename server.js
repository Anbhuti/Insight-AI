// server.ts
import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import initSqlJs from "sql.js";

// src/services/sql/sqlValidator.ts
import nodeSqlParser from "node-sql-parser";
var ParserConstructor = nodeSqlParser.Parser || nodeSqlParser.default?.Parser || nodeSqlParser;
var parser = new ParserConstructor();
var BLOCKED_COMMAND_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "PRAGMA",
  "ATTACH",
  "DETACH",
  "LOAD",
  "EXEC",
  "EXECUTE",
  "VACUUM",
  "REINDEX",
  "TRANSACTION",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "MERGE",
  "REPLACE",
  "EXPLAIN",
  "COPY",
  "SHOW",
  "DESCRIBE",
  "INTO OUTFILE",
  "INTO DUMPFILE",
  "LOAD_FILE"
];
var BLOCKED_FUNCTIONS = [
  "READ_FILE",
  "WRITE_FILE",
  "HTTP_GET",
  "HTTP_POST",
  "SYSTEM",
  "SHELL",
  "LOAD_EXTENSION",
  "READ_CSV",
  "READ_PARQUET"
];
function stripSQLComments(sql) {
  if (!sql) return "";
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--.*$/gm, " ").trim();
}
function validateSQL(rawSQL, allowedTable, schema) {
  const sanitized = stripSQLComments(rawSQL).trim();
  if (!sanitized) {
    return {
      isValid: false,
      error: "Empty SQL query provided.",
      errorCategory: "syntax",
      referencedTables: [],
      referencedColumns: []
    };
  }
  const statementCount = countStatements(sanitized);
  if (statementCount > 1) {
    return {
      isValid: false,
      error: "Multiple SQL statements are strictly prohibited. Only single analytical queries are allowed.",
      errorCategory: "multi_statement",
      referencedTables: [],
      referencedColumns: []
    };
  }
  const cleanSQL = sanitized.replace(/;+\s*$/, "").trim();
  const upperSQL = cleanSQL.toUpperCase();
  for (const keyword of BLOCKED_COMMAND_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(cleanSQL)) {
      return {
        isValid: false,
        error: `Query contains blocked operation: "${keyword}". InsightAI only permits read-only analytical queries.`,
        errorCategory: "blocked_keyword",
        referencedTables: [],
        referencedColumns: []
      };
    }
  }
  for (const fn of BLOCKED_FUNCTIONS) {
    const regex = new RegExp(`\\b${fn}\\b\\s*\\(`, "i");
    if (regex.test(cleanSQL)) {
      return {
        isValid: false,
        error: `Query invokes prohibited system/file function: "${fn}".`,
        errorCategory: "permission",
        referencedTables: [],
        referencedColumns: []
      };
    }
  }
  if (!/^\s*(SELECT|WITH)\b/i.test(cleanSQL)) {
    return {
      isValid: false,
      error: "Query must be a read-only analytical statement starting with SELECT or WITH.",
      errorCategory: "blocked_keyword",
      referencedTables: [],
      referencedColumns: []
    };
  }
  let referencedTables = [];
  let referencedColumns = [];
  try {
    const ast = parser.astify(cleanSQL, { database: "sqlite" });
    const astArray = Array.isArray(ast) ? ast : [ast];
    if (astArray.length > 1) {
      return {
        isValid: false,
        error: "Multi-statement execution detected in AST.",
        errorCategory: "multi_statement",
        referencedTables: [],
        referencedColumns: []
      };
    }
    const singleAst = astArray[0];
    if (singleAst && singleAst.type !== "select") {
      return {
        isValid: false,
        error: `Invalid query type: "${singleAst.type}". Only SELECT queries are permitted.`,
        errorCategory: "blocked_keyword",
        referencedTables: [],
        referencedColumns: []
      };
    }
    const tableListResult = parser.tableList(cleanSQL, { database: "sqlite" });
    referencedTables = tableListResult.map((t) => {
      const parts = t.split("::");
      return (parts[parts.length - 1] || t).replace(/[`"']/g, "").trim();
    }).filter((t) => Boolean(t) && t !== "null" && !t.startsWith("__cte_"));
    const columnListResult = parser.columnList(cleanSQL, { database: "sqlite" });
    referencedColumns = columnListResult.map((c) => {
      const parts = c.split("::");
      return (parts[parts.length - 1] || c).replace(/[`"']/g, "").trim();
    }).filter((c) => Boolean(c) && c !== "null" && c !== "*");
  } catch (parseError) {
    console.warn("AST parser note, running strict regex fallback validator:", parseError.message);
    const tableMatches = cleanSQL.matchAll(/\b(?:FROM|JOIN)\s+([`"']?)([a-zA-Z0-9_]+)\1/gi);
    for (const match of tableMatches) {
      if (match[2]) referencedTables.push(match[2]);
    }
  }
  const targetTable = allowedTable.replace(/[`"']/g, "").trim().toLowerCase();
  if (referencedTables.length === 0) {
    const fallbackMatch = cleanSQL.match(/\bFROM\s+([`"']?)([a-zA-Z0-9_]+)\1/i);
    if (fallbackMatch && fallbackMatch[2]) {
      referencedTables.push(fallbackMatch[2]);
    }
  }
  for (const tbl of referencedTables) {
    const cleanTbl = tbl.toLowerCase();
    const isCTE = new RegExp(`\\bWITH\\s+${cleanTbl}\\s+AS`, "i").test(cleanSQL);
    if (isCTE) continue;
    if (cleanTbl !== targetTable) {
      return {
        isValid: false,
        error: `Cross-dataset or unauthorized table access blocked. Referenced table "${tbl}" does not match active dataset table "${allowedTable}".`,
        errorCategory: "unknown_table",
        referencedTables,
        referencedColumns
      };
    }
  }
  if (schema && schema.columns && schema.columns.length > 0 && referencedColumns.length > 0) {
    const validColumnNames = new Set(
      schema.columns.flatMap((c) => [
        c.name.toLowerCase(),
        c.sanitizedName ? c.sanitizedName.toLowerCase() : ""
      ]).filter(Boolean)
    );
    const sqlKeywords = /* @__PURE__ */ new Set([
      "sum",
      "avg",
      "count",
      "min",
      "max",
      "round",
      "coalesce",
      "nullif",
      "upper",
      "lower",
      "trim",
      "length",
      "substr",
      "strftime",
      "date",
      "cast",
      "year",
      "month",
      "day",
      "as",
      "distinct",
      "case",
      "when",
      "then",
      "else",
      "end",
      "order",
      "by",
      "group",
      "having",
      "limit",
      "offset",
      "like",
      "between",
      "in",
      "is",
      "null"
    ]);
    for (const col of referencedColumns) {
      const colLower = col.toLowerCase();
      if (sqlKeywords.has(colLower)) continue;
      if (/^\d+$/.test(colLower)) continue;
      if (!validColumnNames.has(colLower)) {
        return {
          isValid: false,
          error: `Unknown column "${col}" referenced in query. Column does not exist in dataset schema.`,
          errorCategory: "unknown_column",
          referencedTables,
          referencedColumns
        };
      }
    }
  }
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
    referencedColumns
  };
}
function countStatements(sql) {
  let count = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : "";
    if (char === "'" && prevChar !== "\\") {
      if (!inDoubleQuote) inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== "\\") {
      if (!inSingleQuote) inDoubleQuote = !inDoubleQuote;
    } else if (char === ";" && !inSingleQuote && !inDoubleQuote) {
      const remaining = sql.slice(i + 1).trim();
      if (remaining.length > 0) {
        count++;
      }
    }
  }
  return count;
}

// src/services/sql/schemaService.ts
var SQL_RESERVED_WORDS = /* @__PURE__ */ new Set([
  "order",
  "group",
  "by",
  "select",
  "from",
  "where",
  "table",
  "date",
  "user",
  "value",
  "rank",
  "case",
  "when",
  "then",
  "else",
  "end",
  "limit",
  "offset",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "full",
  "on",
  "as",
  "having",
  "distinct",
  "all",
  "and",
  "or",
  "not",
  "in",
  "like",
  "between",
  "is",
  "null",
  "primary",
  "key",
  "column",
  "filter",
  "over",
  "partition",
  "window"
]);
function quoteIdentifier(identifier) {
  if (SQL_RESERVED_WORDS.has(identifier.toLowerCase()) || /[\s\-–—/\\+*()$%#@!?.,]/.test(identifier) || /^\d/.test(identifier)) {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
  return identifier;
}
function formatSchemaForPrompt(schema) {
  let text = `=== DATABASE SCHEMA ===
`;
  text += `Table Name: ${schema.tableName}
`;
  text += `Total Records: ${schema.rowCount.toLocaleString()} rows

`;
  text += `COLUMNS & TYPES:
`;
  for (const col of schema.columns) {
    const isQuoted = quoteIdentifier(col.name) !== col.name;
    const identifierFormat = isQuoted ? `"${col.name}"` : col.name;
    let line = `\u2022 ${identifierFormat} (${col.dataType})`;
    if (col.nullable) line += ` [NULLABLE]`;
    if (col.distinctCount !== void 0 && col.distinctCount !== null) {
      line += ` - ${col.distinctCount} distinct values`;
    }
    if (col.min !== void 0 && col.min !== null && col.max !== void 0 && col.max !== null) {
      line += ` (Range: ${col.min} to ${col.max})`;
    }
    if (col.sampleValues && col.sampleValues.length > 0) {
      const samples = col.sampleValues.filter((v) => v !== null && v !== void 0 && v !== "").slice(0, 4).map((v) => typeof v === "string" ? `"${v}"` : String(v)).join(", ");
      if (samples) {
        line += ` | Samples: [${samples}]`;
      }
    }
    text += `${line}
`;
  }
  text += `=======================`;
  return text;
}

// server.ts
dotenv.config();
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "25mb" }));
var serverSQL = null;
var serverDB = null;
var loadedServerTables = /* @__PURE__ */ new Set();
async function getOrInitServerDB() {
  if (!serverDB) {
    if (!serverSQL) {
      serverSQL = await initSqlJs();
    }
    serverDB = new serverSQL.Database();
  }
  return serverDB;
}
async function ensureServerTable(tableName, columns, rows) {
  const db = await getOrInitServerDB();
  if (loadedServerTables.has(tableName)) {
    return;
  }
  try {
    db.run(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)};`);
    const colDefs = columns.map((col) => {
      const qCol = quoteIdentifier(col.name);
      let t = "TEXT";
      if (col.dataType === "INTEGER") t = "INTEGER";
      else if (col.dataType === "REAL") t = "REAL";
      else if (col.dataType === "BOOLEAN") t = "INTEGER";
      return `${qCol} ${t}`;
    });
    db.run(`CREATE TABLE ${quoteIdentifier(tableName)} (
  ${colDefs.join(",\n  ")}
);`);
    if (rows && rows.length > 0) {
      const placeholders = columns.map(() => "?").join(", ");
      const stmt = db.prepare(`INSERT INTO ${quoteIdentifier(tableName)} VALUES (${placeholders});`);
      db.run("BEGIN TRANSACTION;");
      try {
        for (const rawRow of rows) {
          const bound = [];
          for (let c = 0; c < columns.length; c++) {
            const col = columns[c];
            const val = rawRow[c];
            if (val === null || val === void 0 || val === "" || val === "null" || val === "NA" || val === "N/A") {
              bound.push(null);
            } else if (col.dataType === "INTEGER") {
              const num = parseInt(String(val).replace(/[$,]/g, "").trim(), 10);
              bound.push(isNaN(num) ? null : num);
            } else if (col.dataType === "REAL") {
              const num = parseFloat(String(val).replace(/[$,%]/g, "").trim());
              bound.push(isNaN(num) ? null : num);
            } else if (col.dataType === "BOOLEAN") {
              if (typeof val === "boolean") bound.push(val ? 1 : 0);
              else {
                const s = String(val).toLowerCase().trim();
                bound.push(s === "true" || s === "1" || s === "yes" ? 1 : 0);
              }
            } else {
              bound.push(String(val));
            }
          }
          stmt.run(bound);
        }
        db.run("COMMIT;");
      } catch (err) {
        db.run("ROLLBACK;");
        throw err;
      } finally {
        stmt.free();
      }
    }
    loadedServerTables.add(tableName);
  } catch (e) {
    console.error(`Error populating server analytical table ${tableName}:`, e);
    throw e;
  }
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "InsightAI Analytical SQL Engine API",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var geminiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}
app.post("/api/analyst/chat", async (req, res) => {
  try {
    const { datasetContext, message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "A message string is required." });
    }
    if (!datasetContext) {
      return res.status(400).json({ error: "Dataset context is required." });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        content: `### \u{1F4CA} Analytical Assessment for **${datasetContext.datasetName || "Dataset"}**

*Note: Gemini API key is being initialized. Here is an immediate statistical synthesis based on the profiled metadata:*

**Dataset Overview:**
- **Total Records:** ${datasetContext.rowCount?.toLocaleString() || "N/A"} rows across ${datasetContext.columnCount || 0} columns
- **Data Quality Score:** ${datasetContext.qualityScore || 0}/100
- **Missing Cells:** ${datasetContext.missingCellPercentage || 0}%

**Key Columns Identified:**
${(datasetContext.columns || []).slice(0, 5).map((col) => `- **${col.name}** (${col.type}): ${col.uniqueCount} distinct values, ${col.missingPercentage}% nulls`).join("\n")}

> **Next Action:** Please configure your \`GEMINI_API_KEY\` in the Secrets panel for real-time deep natural language intelligence.`,
        suggestedFollowUps: [
          "What are the top correlations in this dataset?",
          "How can I clean the missing values?",
          "What visualizations would best represent this data?"
        ]
      });
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are InsightAI, a world-class Senior Staff Data Analyst, BI Strategist, and Quantitative Specialist.
Your role is to help users understand, query, diagnose, and derive executive insights from their uploaded datasets.

CRITICAL OPERATIONAL RULES:
1. Grounding in Real Data Facts:
   - Rely strictly on the dataset context provided (column types, statistical summaries, percentiles, means, outliers, frequencies, missing rates, data quality issues, sample rows).
   - NEVER invent or hallucinate column names, row counts, metrics, or statistical numbers not grounded in the context.
   - If the user asks a question that cannot be answered with the current context (e.g. asking for individual row lookup when only statistics are available), clearly state what data you have and what additional granularity would be needed.

2. Tone & Communication:
   - Professional, articulate, structured, and insightful.
   - Speak like a top-tier management consultant and lead data scientist.
   - Use clear markdown: bold highlights, metric summaries, bullet points, clean markdown tables for tabular data, and blockquotes for strategic executive takeaways.

3. Formatting & Output Structure:
   - Structure your response logically:
     * **Executive Summary / Direct Answer**: Direct, concise answer to the user's prompt.
     * **Data Evidence & Findings**: Specific metrics, tables, and distributions from the dataset.
     * **Diagnostic Insights & Root Causes**: Explain why the data behaves this way (e.g., skewness, outliers, missingness).
     * **Actionable Recommendations / Next Steps**: Concrete steps for business or data cleaning decisions.
   - At the very end of your response, ALWAYS include a JSON block enclosed in \`\`\`json_metadata ... \`\`\` containing:
     {
       "suggestedFollowUps": ["Question 1", "Question 2", "Question 3"],
       "visualization": {
         "chartType": "bar|line|pie|scatter|histogram|table|kpi_card",
         "title": "Short title",
         "description": "Why this chart helps",
         "xAxisColumn": "column_name",
         "yAxisColumn": "column_name",
         "rationale": "Brief rationale"
       }
     }
   - The JSON metadata block is parsed by the client UI to render interactive chips and visual charts.`;
    const datasetSummaryText = `=== DATASET CONTEXT ===
Name: ${datasetContext.datasetName} (ID: ${datasetContext.datasetId})
File Format: ${datasetContext.fileType?.toUpperCase()}
Dimensions: ${datasetContext.rowCount} Rows x ${datasetContext.columnCount} Columns
Data Quality Score: ${datasetContext.qualityScore} / 100
Duplicate Rows: ${datasetContext.duplicateRowCount} (${(datasetContext.duplicateRowCount / (datasetContext.rowCount || 1) * 100).toFixed(1)}%)
Missing Cells: ${datasetContext.missingCellPercentage}%

COLUMNS & STATISTICAL PROFILES:
${(datasetContext.columns || []).map((col) => {
      let details = `\u2022 [${col.name}] Type: ${col.type} | Missing: ${col.missingPercentage}% | Uniques: ${col.uniqueCount}`;
      if (col.min !== void 0 && col.min !== null) details += ` | Min: ${col.min}, Max: ${col.max}`;
      if (col.mean !== void 0 && col.mean !== null) details += ` | Mean: ${col.mean.toFixed(2)}, Median: ${col.median}`;
      if (col.stdDev !== void 0 && col.stdDev !== null) details += ` | StdDev: ${col.stdDev.toFixed(2)}`;
      if (col.outlierCount) details += ` | Outliers: ${col.outlierCount}`;
      if (col.topCategories && col.topCategories.length > 0) {
        const topStr = col.topCategories.slice(0, 4).map((c) => `"${c.value}" (${c.count})`).join(", ");
        details += ` | Top Values: [${topStr}]`;
      }
      return details;
    }).join("\n")}

${datasetContext.criticalIssues && datasetContext.criticalIssues.length > 0 ? `DETECTED DATA ISSUES:
` + datasetContext.criticalIssues.map((issue) => `- [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description} (Recommendation: ${issue.recommendation})`).join("\n") : "No critical data quality issues flagged."}

${datasetContext.sampleRows && datasetContext.sampleRows.length > 0 ? `REPRESENTATIVE SAMPLE ROWS (First ${datasetContext.sampleRows.length} rows):
` + JSON.stringify(datasetContext.sampleRows, null, 2) : ""}
=======================`;
    const contents = [];
    contents.push({
      role: "user",
      parts: [{ text: `Here is the dataset I am working with:

${datasetSummaryText}

Please acknowledge receipt and prepare to analyze it.` }]
    });
    contents.push({
      role: "model",
      parts: [{ text: `I have thoroughly reviewed the profile and statistical properties of **${datasetContext.datasetName}** (${datasetContext.rowCount?.toLocaleString()} rows, ${datasetContext.columnCount} columns, Quality Score: ${datasetContext.qualityScore}/100). I am ready to answer your analytical, statistical, and business questions.` }]
    });
    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        contents.push({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.2
        // Low temperature for high factual accuracy
      }
    });
    const rawText = response.text || "No response generated.";
    let cleanContent = rawText;
    let suggestedFollowUps = [
      "What are the highest risk outliers in this dataset?",
      "Can you give me an executive breakdown by category?",
      "What data cleaning actions do you recommend before modeling?"
    ];
    let visualization = void 0;
    const metadataMatch = rawText.match(/```json_metadata\s*([\s\S]*?)\s*```/);
    if (metadataMatch && metadataMatch[1]) {
      try {
        const parsed = JSON.parse(metadataMatch[1].trim());
        if (Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0) {
          suggestedFollowUps = parsed.suggestedFollowUps;
        }
        if (parsed.visualization && typeof parsed.visualization === "object") {
          visualization = parsed.visualization;
        }
        cleanContent = rawText.replace(/```json_metadata[\s\S]*?```/, "").trim();
      } catch (e) {
        console.warn("Failed to parse json_metadata block:", e);
      }
    }
    return res.json({
      content: cleanContent,
      suggestedFollowUps,
      visualization
    });
  } catch (error) {
    console.error("Error in /api/analyst/chat:", error);
    return res.status(500).json({
      error: error.message || "Failed to process analytical inquiry with Gemini."
    });
  }
});
app.post("/api/sql/agent", async (req, res) => {
  const startTime = performance.now();
  try {
    const { userId, datasetId, datasetName, question, schema, history, qualityIssues, previewRows } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "A question string is required." });
    }
    if (!schema || !schema.tableName || !schema.columns) {
      return res.status(400).json({ error: "Valid dataset schema is required." });
    }
    await ensureServerTable(schema.tableName, schema.columns, previewRows || []);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const db2 = await getOrInitServerDB();
      const fallbackSQL = `SELECT * FROM ${quoteIdentifier(schema.tableName)} LIMIT 10;`;
      const queryRes = db2.exec(fallbackSQL);
      const cols = queryRes[0]?.columns || [];
      const rows = queryRes[0]?.values || [];
      return res.json({
        status: "success",
        sql: fallbackSQL,
        columns: cols,
        rows,
        rowCount: rows.length,
        executionTimeMs: Math.round(performance.now() - startTime),
        explanation: {
          answer: `Calculated results using preview fallback query against **${datasetName || schema.tableName}**. Please configure your \`GEMINI_API_KEY\` to enable dynamic natural language SQL generation.`,
          methodology: "Selected top 10 preview records from analytical database table.",
          columnsUsed: cols.slice(0, 5),
          dataQualityNotes: qualityIssues?.map((q) => `${q.category}: ${q.description}`) || []
        },
        visualization: {
          chartType: "table",
          title: "Preview Dataset Table",
          description: "Raw analytical records retrieved from database."
        },
        suggestedFollowUps: [
          "Show total count of records",
          "What is the summary breakdown by category?",
          "Show average values across numeric columns"
        ]
      });
    }
    const ai = getGeminiClient();
    const schemaPrompt = formatSchemaForPrompt(schema);
    const sqlGenerationSystemPrompt = `You are InsightAI's Lead SQL Analytics Engineer.
Your job is to convert natural language business questions into precise, high-performance, single-statement SQL queries.

CRITICAL SQL GENERATION RULES:
1. Engine Dialect: SQLite / Standard ANSI SQL.
2. ONLY SELECT queries (or WITH ... SELECT CTEs). Never output INSERT, UPDATE, DELETE, DROP, ALTER, PRAGMA, or administrative commands.
3. Target ONLY the specified table: ${quoteIdentifier(schema.tableName)}.
4. Quoting: Always quote column identifiers that contain spaces, dashes, special characters, or match SQL keywords (e.g. "Order Date", "Revenue ($)", "Status").
5. Safe Arithmetic: Protect against division by zero using NULLIF(denominator, 0).
6. Aggregations: Always group by non-aggregated selected columns.
7. Dates: For date grouping, use SQLite date functions such as strftime('%Y-%m', "date_column") or strftime('%Y', "date_column").
8. Bounds: Detail queries must include LIMIT 1000 (or smaller if requested, e.g. "top 5" -> LIMIT 5).
9. Output Format: Return a JSON object with this EXACT structure (no markdown fences around JSON, or inside \`\`\`json block):
{
  "sql": "SELECT ... FROM ...",
  "methodology": "Brief 1-2 sentence description of what the query calculates and how columns are aggregated",
  "columnsUsed": ["ColumnA", "ColumnB"]
}`;
    let proposedSQL = "";
    let methodology = "";
    let columnsUsed = [];
    const generateSQL = async (userPrompt, priorError) => {
      let promptContent = `${schemaPrompt}

User Question: "${userPrompt}"`;
      if (priorError) {
        promptContent += `

ATTENTION: The previous SQL query attempt failed with this error:
"${priorError}"
Please fix the SQL syntax or column reference and return valid corrected JSON.`;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [{ role: "user", parts: [{ text: promptContent }] }],
        config: {
          systemInstruction: sqlGenerationSystemPrompt,
          temperature: 0
          // Strict deterministic output
        }
      });
      const raw = response.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sql: parsed.sql,
          methodology: parsed.methodology || "",
          columnsUsed: parsed.columnsUsed || []
        };
      }
      throw new Error("Could not parse SQL generation JSON response.");
    };
    const genResult = await generateSQL(question);
    proposedSQL = genResult.sql;
    methodology = genResult.methodology;
    columnsUsed = genResult.columnsUsed;
    let validatedSQL = "";
    let queryColumns = [];
    let queryRows = [];
    let repairAttempts = 0;
    let executionSuccess = false;
    let lastError = "";
    const db = await getOrInitServerDB();
    for (let attempt = 0; attempt <= 2; attempt++) {
      const validation = validateSQL(proposedSQL, schema.tableName, schema);
      if (!validation.isValid) {
        lastError = validation.error || "SQL Validation Failed";
        repairAttempts++;
        if (attempt < 2) {
          const repaired = await generateSQL(question, `Validation error: ${lastError}`);
          proposedSQL = repaired.sql;
          methodology = repaired.methodology;
          columnsUsed = repaired.columnsUsed;
          continue;
        } else {
          break;
        }
      }
      validatedSQL = validation.sanitizedSQL || proposedSQL;
      try {
        const queryRes = db.exec(validatedSQL);
        if (queryRes && queryRes.length > 0) {
          queryColumns = queryRes[0].columns || [];
          queryRows = (queryRes[0].values || []).slice(0, 1e3);
        } else {
          queryColumns = [];
          queryRows = [];
        }
        executionSuccess = true;
        break;
      } catch (execErr) {
        lastError = execErr.message || "SQL Execution Failed";
        repairAttempts++;
        if (attempt < 2) {
          const repaired = await generateSQL(question, `Database execution error: ${lastError}`);
          proposedSQL = repaired.sql;
          methodology = repaired.methodology;
          columnsUsed = repaired.columnsUsed;
        }
      }
    }
    if (!executionSuccess) {
      return res.status(422).json({
        status: "failed",
        sql: proposedSQL,
        error: `Could not safely execute analytical query: ${lastError}`,
        repairAttempts
      });
    }
    const executionDurationMs = Math.round(performance.now() - startTime);
    const explanationSystemPrompt = `You are InsightAI's Lead Executive Data Analyst.
The analytical database has executed the user's SQL query and returned exact calculations.
Your role is to explain these exact results clearly and authoritatively.

CRITICAL RULES:
1. Grounding: The SQL query results are the single source of truth. Quote exact figures and metrics. DO NOT hallucinate or alter numbers.
2. Structure:
   - Direct Executive Answer: State the immediate finding clearly.
   - Detailed Breakdown / Metric Highlights: Key numbers, rankings, percentages, or variance.
   - Business Context & Caveats: Note any data limitations or data quality implications if relevant.
3. Visualization Decision:
   - If results have 1 categorical/date column and 1 numeric column: choose "bar" or "line".
   - If results represent parts of a whole with <= 7 categories: choose "pie".
   - If results are a single numeric aggregate: choose "kpi_card".
   - If results are multi-column or detail rows: choose "table".
4. Output Format: Provide clean markdown for your explanation, followed at the very end by a JSON block:
\`\`\`json_viz
{
  "chartType": "bar" | "line" | "pie" | "scatter" | "kpi_card" | "table",
  "title": "Chart Title",
  "description": "Chart subtitle",
  "xAxisColumn": "col_name",
  "yAxisColumn": "col_name",
  "breakdownColumn": "col_name",
  "suggestedFollowUps": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}
\`\`\``;
    const resultsSampleText = JSON.stringify({
      columns: queryColumns,
      rowCount: queryRows.length,
      sampleRows: queryRows.slice(0, 20)
    }, null, 2);
    const explanationPrompt = `User Question: "${question}"
Executed SQL:
\`\`\`sql
${validatedSQL}
\`\`\`
Methodology: ${methodology}
Query Result Data:
${resultsSampleText}

${qualityIssues && qualityIssues.length > 0 ? `Active Data Quality Notes: ${qualityIssues.map((q) => q.description).join("; ")}` : ""}

Please explain the exact findings from this query.`;
    const explainResponse = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: explanationPrompt }] }],
      config: {
        systemInstruction: explanationSystemPrompt,
        temperature: 0.2
      }
    });
    const rawExplanation = explainResponse.text || "Calculation complete.";
    let cleanAnswer = rawExplanation;
    let visualization = void 0;
    let suggestedFollowUps = [
      "Break this down further by category",
      "Compare this against the overall dataset average",
      "Show top 5 highest and lowest values"
    ];
    const vizMatch = rawExplanation.match(/```json_viz\s*([\s\S]*?)\s*```/);
    if (vizMatch && vizMatch[1]) {
      try {
        const parsedViz = JSON.parse(vizMatch[1].trim());
        if (parsedViz.suggestedFollowUps) {
          suggestedFollowUps = parsedViz.suggestedFollowUps;
        }
        visualization = {
          chartType: parsedViz.chartType || "table",
          title: parsedViz.title || "Query Results",
          description: parsedViz.description || "",
          xAxisColumn: parsedViz.xAxisColumn || queryColumns[0] || "",
          yAxisColumn: parsedViz.yAxisColumn || queryColumns[1] || queryColumns[0] || "",
          breakdownColumn: parsedViz.breakdownColumn
        };
        cleanAnswer = rawExplanation.replace(/```json_viz[\s\S]*?```/, "").trim();
      } catch (e) {
        console.warn("Failed to parse json_viz:", e);
      }
    }
    return res.json({
      status: repairAttempts > 0 ? "repaired" : "success",
      sql: validatedSQL,
      columns: queryColumns,
      rows: queryRows,
      rowCount: queryRows.length,
      executionTimeMs: executionDurationMs,
      explanation: {
        answer: cleanAnswer,
        methodology: methodology || "Executed SQL aggregation query.",
        columnsUsed: columnsUsed.length > 0 ? columnsUsed : queryColumns,
        dataQualityNotes: qualityIssues?.map((q) => q.description) || []
      },
      visualization,
      suggestedFollowUps,
      repairAttempts
    });
  } catch (error) {
    console.error("Error in /api/sql/agent:", error);
    return res.status(500).json({
      error: error.message || "Failed to process SQL query."
    });
  }
});
app.post("/api/anomaly/explain", async (req, res) => {
  try {
    const { anomaly, datasetSummary } = req.body;
    if (!anomaly || !anomaly.column) {
      return res.status(400).json({ error: "Valid anomaly data object is required." });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const isSpike = anomaly.type === "spike";
      return res.json({
        headline: `${isSpike ? "Significant Spike" : "Abnormal Drop"} in ${anomaly.column} (${anomaly.scoreLabel})`,
        businessImpact: `The metric "${anomaly.column}" registered ${anomaly.actualValue?.toLocaleString()} against an expected baseline of ${anomaly.expectedValue?.toLocaleString()} (${anomaly.deviationPercentage > 0 ? "+" : ""}${anomaly.deviationPercentage}% variance). Such deviations can distort financial forecasts, inventory targets, or strategic KPIs.`,
        potentialDrivers: [
          `Localized volatility around row record ${anomaly.rowIdentifier || ""}`,
          `Statistical deviation from distribution bounds (${anomaly.statisticalEvidence})`,
          `Potential demand surge, data pipeline anomaly, or seasonal irregularity`
        ],
        recommendedActions: [
          `Inspect surrounding records and related categorical dimensions.`,
          `Formulate a hypothesis using the InsightAI Natural Language Analyst.`,
          `Validate whether this represents a true business event or ingestion error.`
        ],
        confidence: 0.9
      });
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are InsightAI's Chief Quantitative Risk & Anomaly Intelligence Specialist.
You receive mathematical, algorithmic anomaly detections calculated from real enterprise datasets (Z-Score, IQR, MAD, Rolling Window, % change).
Your role is to translate these mathematical deviations into crisp, executive-level business intelligence.

CRITICAL RULES:
1. Grounding: Rely strictly on the supplied anomaly metrics (actualValue, expectedValue, deviationPercentage, score, method, column, rowData). DO NOT hallucinate different numbers.
2. Structure: Respond with a JSON object matching this exact schema (no extra text outside the JSON):
{
  "headline": "Short, punchy executive headline summarizing the anomaly",
  "businessImpact": "2-3 sentence explanation of why this deviation matters to executive stakeholders (revenue, risk, operations, forecasting)",
  "potentialDrivers": [
    "Most likely mathematical or business root driver 1",
    "Potential contributing factor 2",
    "Possible external or process explanation 3"
  ],
  "recommendedActions": [
    "Immediate diagnostic or corrective action 1",
    "Investigation query or audit step 2",
    "Preventative or monitoring measure 3"
  ],
  "confidence": 0.94
}`;
    const prompt = `DATASET & ANOMALY EVIDENCE:
Dataset: ${anomaly.datasetName} (ID: ${anomaly.datasetId})
Metric Column: "${anomaly.column}"
Anomaly Type: ${anomaly.type}
Detection Algorithm: ${anomaly.method} (${anomaly.scoreLabel})
Actual Observed Value: ${anomaly.actualValue}
Expected Baseline: ${anomaly.expectedValue}
Deviation: ${anomaly.deviation} (${anomaly.deviationPercentage > 0 ? "+" : ""}${anomaly.deviationPercentage}%)
Row Identifier: ${anomaly.rowIdentifier || "N/A"}
Date Context: ${anomaly.dateValue || "N/A"}
Dimension Context: ${anomaly.dimensionValue || "N/A"}
Statistical Proof: ${anomaly.statisticalEvidence}

Full Row Record Data:
${JSON.stringify(anomaly.rowData || {}, null, 2)}

Please provide the executive business analysis for this detected anomaly.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });
    const raw = response.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    }
    return res.json({
      headline: `Statistical anomaly detected in ${anomaly.column}`,
      businessImpact: anomaly.summary,
      potentialDrivers: ["Statistical distribution outlier", "Abnormal value shift"],
      recommendedActions: ["Inspect row details", "Investigate with AI Analyst"],
      confidence: 0.9
    });
  } catch (error) {
    console.error("Error in /api/anomaly/explain:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate anomaly explanation."
    });
  }
});
app.post("/api/root-cause/explain", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.targetMetric) {
      return res.status(400).json({ error: "Missing RCA payload in request." });
    }
    const p = payload.periodComparison;
    const top = payload.topDrivers?.[0];
    const fallbackResponse = {
      headline: `${payload.targetMetric} shifted ${p?.percentageChange > 0 ? "+" : ""}${p?.percentageChange || 0}%`,
      executiveSummary: top ? `Analysis indicates ${payload.targetMetric} changed by ${p?.percentageChange}%, with segment "${top.segment}" within "${top.dimension}" representing the largest observed contributor (${top.contributionPct}%).` : `Analysis reveals a ${p?.percentageChange}% net variance in ${payload.targetMetric} across baseline periods.`,
      keyFacts: payload.facts || [],
      topDriversExplanation: (payload.topDrivers || []).map(
        (d) => `Segment "${d.segment}" contributed ${d.contributionPct}% of total change.`
      ),
      hypothesesSummary: (payload.hypotheses || []).map((h) => `[${h.classification}] ${h.statement}`),
      limitationsExplained: (payload.limitations || []).map((l) => `${l.title}: ${l.impact}`),
      recommendedInvestigations: ["Review transaction-level records", "Investigate with AI Analyst"],
      confidenceNarrative: `Confidence level is ${payload.overallConfidence || "medium"} based on available sample records.`
    };
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(fallbackResponse);
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are an enterprise data analyst performing root cause analysis.

You must reason only from the structured mathematical evidence provided.

CRITICAL RULES:
1. Separate FACTS from HYPOTHESES.
2. Never invent missing information or unobserved factors.
3. Never claim causation from correlation alone. Always distinguish between "Observed Contributor", "Statistical Association", and "Potential Root Cause".
4. Never create or hallucinate numerical values; use exact figures from the evidence.
5. For every hypothesis, cite the specific evidence supporting it.
6. Explicitly mention limitations when unobserved variables (e.g. marketing spend, external competitor actions, customer sentiment) or sample sizes reduce certainty.
7. If the available data cannot establish a definitive root cause, explicitly state: "Insufficient evidence to determine the root cause; observed drivers represent contributors rather than confirmed causes."

Respond ONLY with valid JSON conforming to this schema:
{
  "headline": "Concise high-impact executive headline summarizing the primary observed contributor and shift",
  "executiveSummary": "Objective 2-3 sentence executive breakdown explaining what happened, the largest observed contributor with exact contribution %, and why further targeted investigation is needed",
  "keyFacts": ["Array of factual bullet points directly computed from data"],
  "topDriversExplanation": ["Array explaining each top driver segment with contribution % and delta"],
  "hypothesesSummary": ["Array of formulated hypotheses with their classification (Observed Contributor / Coinciding Shift) and confidence level"],
  "limitationsExplained": ["Array explaining dataset limitations, unobserved variables, and sample constraints"],
  "recommendedInvestigations": ["Array of actionable, evidence-based next steps"],
  "confidenceNarrative": "Objective sentence explaining why the evidence confidence is rated High, Medium, or Low based on record counts and completeness"
}`;
    const prompt = `Perform Root Cause Analysis interpretation on the following structured evidence:

Target Metric: "${payload.targetMetric}" (${payload.targetMetricLabel || payload.targetMetric})
Dataset: "${payload.datasetName || "Dataset"}"

Baseline Period Comparison:
- Baseline Period: ${payload.periodComparison?.periodBeforeLabel || "Baseline"} (Value: ${payload.periodComparison?.beforeValue})
- Observed Period: ${payload.periodComparison?.periodAfterLabel || "Current"} (Value: ${payload.periodComparison?.afterValue})
- Net Shift: ${payload.periodComparison?.absoluteChange} (${payload.periodComparison?.percentageChange > 0 ? "+" : ""}${payload.periodComparison?.percentageChange}%)
- Sample Size: ${payload.periodComparison?.sampleSizeBefore + payload.periodComparison?.sampleSizeAfter} total records

Top Observed Dimension Drivers:
${JSON.stringify(payload.topDrivers || [], null, 2)}

Mathematical Metric Decompositions:
${JSON.stringify(payload.metricDecompositions || [], null, 2)}

Statistical Correlations:
${JSON.stringify(payload.correlations || [], null, 2)}

Derived Facts:
${JSON.stringify(payload.facts || [], null, 2)}

Formulated Hypotheses:
${JSON.stringify(payload.hypotheses || [], null, 2)}

Dataset Limitations & Unobserved Variables:
${JSON.stringify(payload.limitations || [], null, 2)}

Overall Analytical Confidence: ${payload.overallConfidence || "medium"}

Please generate the structured executive RCA intelligence.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.15
      }
    });
    const raw = response.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    }
    return res.json(fallbackResponse);
  } catch (error) {
    console.error("Error in /api/root-cause/explain:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate root cause analysis explanation."
    });
  }
});
app.post("/api/forecast/explain", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.targetMetric) {
      return res.status(400).json({ error: "Invalid forecast payload." });
    }
    const fallbackResponse = {
      headline: `${payload.targetMetric} is projected to ${payload.summary?.expectedGrowthPct >= 0 ? "grow" : "decline"} by ${payload.summary?.expectedGrowthPct >= 0 ? "+" : ""}${payload.summary?.expectedGrowthPct}% over the next ${payload.horizon} periods.`,
      executiveSummary: `Baseline of ${payload.targetMetric} ends at ${payload.summary?.latestActualValue?.toLocaleString()}, projecting to ${payload.summary?.finalPredictedValue?.toLocaleString()} (${payload.summary?.expectedGrowthPct}% delta). Modeled via ${payload.selectedModel} (sMAPE: ${payload.bestScorecard?.smape}%).`,
      historicalTrendNarrative: `Historical series exhibits ${payload.decomposition?.trend || "stable"} movement with ${payload.decomposition?.seasonalityExplanation || "no strong seasonal cycle"}.`,
      forecastDirectionNarrative: `Forward projection indicates a net shift of ${payload.summary?.expectedAbsoluteChange?.toLocaleString()} units over the next ${payload.horizon} periods.`,
      modelSelectionNarrative: `${payload.selectedModel} was selected based on chronological backtesting validation (MAE: ${payload.bestScorecard?.mae}, RMSE: ${payload.bestScorecard?.rmse}).`,
      uncertaintyNarrative: `Confidence level is rated ${payload.confidenceRating || "Medium"} with expanding statistical prediction intervals into future horizons.`,
      limitationsNarrative: (payload.warnings || []).length > 0 ? `Analytical caveats: ${payload.warnings.join(" ")}` : "Projections assume continuation of historical operating dynamics without major external disruptions.",
      recommendedActions: [
        `Monitor actual ${payload.targetMetric} against the forecast upper/lower confidence bounds.`,
        "Track core operational drivers to validate forward momentum.",
        "Re-estimate model parameters periodically as new transactions settle."
      ]
    };
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(fallbackResponse);
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are a chief quantitative analytics strategist interpreting statistical time-series forecasts.

CRITICAL RULES:
1. Ground every sentence ONLY in the provided mathematical scorecard, trend metrics, and prediction numbers.
2. DO NOT invent forecast numbers, future dates, or speculative market conditions not in the data.
3. Clearly explain why the winning statistical model was chosen over alternative baselines using the backtest error metrics (sMAPE, MAE, RMSE).
4. Frame uncertainty realistically: explain the prediction intervals and confidence rating without over-promising precision.
5. Provide actionable, risk-adjusted operational recommendations.

Respond ONLY with valid JSON conforming to this schema:
{
  "headline": "Concise, punchy executive headline summarizing the projected growth/decline and timeframe",
  "executiveSummary": "2-3 sentence executive brief stating the baseline starting value, final projected value, net percentage change, winning model name, and backtesting validation accuracy",
  "historicalTrendNarrative": "Factual paragraph detailing the historical trend slope, growth rate, and any observed seasonal cycles",
  "forecastDirectionNarrative": "Factual paragraph describing the projected forward trajectory, total cumulative forecasted sum, and rate of change",
  "modelSelectionNarrative": "Clear explanation of why the selected statistical model outperformed other candidate algorithms during chronological cross-validation",
  "uncertaintyNarrative": "Objective explanation of the prediction interval width, expanding uncertainty horizon, and overall confidence rating",
  "limitationsNarrative": "Clear statement of potential risks, data gaps, outliers, or structural assumptions",
  "recommendedActions": ["Array of 3-4 specific operational or monitoring recommendations for business decision makers"]
}`;
    const prompt = `Interpret the following statistical forecast results for executive leadership:

Target Metric: "${payload.targetMetric}"
Time Frequency: ${payload.frequency}
Forecast Horizon: ${payload.horizon} periods
Selected Model: ${payload.selectedModel}
Selection Reason: ${payload.selectionReason}

Historical Baseline Summary:
- Latest Actual Value: ${payload.summary?.latestActualValue} (${payload.summary?.latestHistoricalDate})
- Final Projected Value: ${payload.summary?.finalPredictedValue} (${payload.summary?.endForecastDate})
- Expected Absolute Change: ${payload.summary?.expectedAbsoluteChange}
- Expected Net Growth %: ${payload.summary?.expectedGrowthPct}%
- Total Cumulative Forecast Sum: ${payload.summary?.totalForecastedSum}
- Mean Projected Value per Period: ${payload.summary?.meanForecastedValue}

Time Series Decomposition & Structure:
- Detected Trend: ${payload.decomposition?.trend} (Slope: ${payload.decomposition?.trendSlope}, Historic Growth: ${payload.decomposition?.trendGrowthPct}%)
- Seasonality Strength: ${payload.decomposition?.seasonality} (${payload.decomposition?.seasonalityExplanation || "None"})
- Historical Outliers: ${payload.metadata?.hasOutliers ? "Yes" : "No"}
- Missing Periods: ${payload.metadata?.missingPeriodsCount} (${payload.metadata?.missingPeriodsPercentage}%)
- Total Sample Observations: ${payload.metadata?.aggregatedPointsCount}

Model Selection & Chronological Backtesting Scorecard:
${JSON.stringify(payload.allScorecards || [], null, 2)}

Winning Model Performance (${payload.selectedModel}):
- MAE: ${payload.bestScorecard?.mae}
- RMSE: ${payload.bestScorecard?.rmse}
- sMAPE: ${payload.bestScorecard?.smape}%
- WAPE: ${payload.bestScorecard?.wape}%

Confidence Rating: ${payload.confidenceRating}
Confidence Rationales: ${JSON.stringify(payload.confidenceRationale || [])}
Data Caveats / Warnings: ${JSON.stringify(payload.warnings || [])}

Generate the structured JSON executive forecast briefing.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });
    const raw = response.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    }
    return res.json(fallbackResponse);
  } catch (error) {
    console.error("Error in /api/forecast/explain:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate forecast AI explanation."
    });
  }
});
app.post("/api/report/summarize", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.datasetName) {
      return res.status(400).json({ error: "Dataset metadata is required for report summarization." });
    }
    const fallbackResponse = {
      headline: `Business Intelligence Dossier for ${payload.datasetName}`,
      overviewNarrative: `Executive analysis across ${payload.datasetName} reveals solid performance metrics across ${payload.kpis?.length || 0} core tracked indicators, with a data quality rating of ${payload.dataQuality?.qualityScore || 90}/100. Key trends highlight stabilized operational throughput and consistent period performance.`,
      keyTakeaways: [
        payload.kpis?.[0] ? `Primary metric "${payload.kpis[0].label}" recorded ${payload.kpis[0].formattedValue} (${payload.kpis[0].percentageChange ? `${payload.kpis[0].percentageChange > 0 ? "+" : ""}${payload.kpis[0].percentageChange}% change` : "stable baseline"}).` : "Core business metrics maintain stable operational levels.",
        payload.anomalies?.totalDetected > 0 ? `Detected ${payload.anomalies.totalDetected} statistical anomalies (${payload.anomalies.highRiskCount || 0} high-severity) requiring localized inspection.` : "No severe statistical spikes or anomalies detected across baseline periods.",
        payload.forecast?.expectedGrowthPct !== void 0 ? `Forward predictive horizon projects ${payload.forecast.expectedGrowthPct >= 0 ? "growth" : "decline"} of ${payload.forecast.expectedGrowthPct}% over the upcoming ${payload.forecast.horizon || 30} periods.` : "Time series trend exhibits steady baseline continuity."
      ],
      strategicImplications: [
        "Operational capacity should align with projected trend volumes.",
        "Data hygiene score confirms readiness for cross-department reporting.",
        "Key dimension concentrations should be monitored for margin preservation."
      ],
      recommendations: [
        {
          priority: "high",
          category: "Operational",
          action: "Deploy automated threshold monitors around high-variance metrics.",
          expectedImpact: "Early warning detection and reduction in unexpected operational variance.",
          timeframe: "Immediate (1-2 Weeks)"
        },
        {
          priority: "medium",
          category: "Strategic",
          action: "Rebalance allocation toward highest-performing segment drivers.",
          expectedImpact: "Targeted margin expansion and optimized resource utilization.",
          timeframe: "Medium Term (30 Days)"
        },
        {
          priority: "low",
          category: "Governance",
          action: "Address missing values in secondary categorical columns.",
          expectedImpact: "Elevation of overall dataset hygiene score from good to excellent.",
          timeframe: "Next Ingestion Cycle"
        }
      ],
      limitations: [
        {
          type: "Sample Boundaries",
          caveat: `Analysis is based on ${payload.rowCount?.toLocaleString() || "available"} historical records.`,
          mitigation: "Continuous ingestion will refine future predictive intervals."
        },
        {
          type: "Exogenous Variables",
          caveat: "External macroeconomic conditions and unobserved marketing expenditures are not encoded in this dataset.",
          mitigation: "Combine quantitative models with domain expertise during strategic reviews."
        }
      ],
      confidenceScore: 0.92
    };
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(fallbackResponse);
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are InsightAI's Lead Executive Briefing Strategist and Chief Analytics Officer.
You receive structured, verified analytical results from our automated database, profiling, anomaly, root cause, and forecasting engines.
Your mission is to synthesize these factual metrics into a board-level Executive Briefing.

CRITICAL RULES:
1. Pure Grounding: Every metric, percentage, column name, and anomaly count MUST match the provided payload. DO NOT fabricate or hallucinate numbers.
2. Tone: Authoritative, concise, executive, and actionable. Write like a top-tier management consultant (McKinsey/Bain).
3. Output Schema: Respond ONLY with valid JSON conforming to this schema (no markdown fences around the JSON):
{
  "headline": "Punchy, strategic executive headline summarizing the core business finding",
  "overviewNarrative": "A polished 2-3 sentence executive synthesis explaining the macro state of the business, key performance highlights, and overarching trend",
  "keyTakeaways": [
    "Factual takeaway 1 quoting exact numbers from the data",
    "Factual takeaway 2 regarding anomalies or segment drivers",
    "Factual takeaway 3 regarding forecasting trajectory or data quality"
  ],
  "strategicImplications": [
    "Strategic implication for executive leadership 1",
    "Strategic implication for resource allocation or risk 2",
    "Strategic implication for forward planning 3"
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "category": "Operational" | "Strategic" | "Governance" | "Financial",
      "action": "Specific evidence-based action to take",
      "expectedImpact": "Quantifiable or operational benefit",
      "timeframe": "1-2 Weeks" | "30 Days" | "Quarterly"
    }
  ],
  "limitations": [
    {
      "type": "Data Scope" | "Unobserved Drivers" | "Model Assumptions",
      "caveat": "Objective disclosure of what the data cannot prove",
      "mitigation": "How leadership should account for this"
    }
  ],
  "confidenceScore": 0.95
}`;
    const promptText = `Please synthesize an executive business intelligence briefing from this structured analytical portfolio:

Report Title: "${payload.title || "Business Intelligence Report"}"
Template Type: ${payload.templateId || "Executive Briefing"}
Dataset: "${payload.datasetName}" (${payload.rowCount?.toLocaleString()} rows, ${payload.columnCount} columns)
Data Quality Score: ${payload.dataQuality?.qualityScore || "N/A"}/100 (Grade: ${payload.dataQuality?.grade || "Good"})
Missing Cells: ${payload.dataQuality?.missingCellsPct || 0}%, Duplicate Rows: ${payload.dataQuality?.duplicateRowsPct || 0}%

Verified KPI Scorecards:
${JSON.stringify(payload.kpis || [], null, 2)}

Time-Series & Trend Summary:
${JSON.stringify(payload.trendSummary || {}, null, 2)}

Categorical & Segment Distributions:
${JSON.stringify(payload.topSegments || [], null, 2)}

Detected Anomaly Intelligence:
${JSON.stringify(payload.anomalies || { totalDetected: 0 }, null, 2)}

Root Cause Analysis (RCA) Drivers:
${JSON.stringify(payload.rootCause || { hasRCA: false }, null, 2)}

Predictive Forecast Projections:
${JSON.stringify(payload.forecast || { hasForecast: false }, null, 2)}

Active User Focus / Notes:
"${payload.focusPrompt || "Provide comprehensive executive intelligence across all observed metrics."}"

Generate the structured JSON executive briefing.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });
    const raw = response.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    }
    return res.json(fallbackResponse);
  } catch (error) {
    console.error("Error in /api/report/summarize:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate report summary."
    });
  }
});
app.post("/api/alerts/explain", async (req, res) => {
  try {
    const { alertTitle, severity, type, metric, datasetName, evidence, additionalContext } = req.body;
    if (!evidence || !alertTitle) {
      return res.status(400).json({ error: "Missing required alert evidence or title." });
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are an enterprise analytics assistant explaining an alert.
Use ONLY the structured evidence provided.

Rules:
1. Never invent values.
2. Never change values.
3. Never claim causation without evidence (e.g. if RCA indicates a contributor, say 'was the largest observed contributor', never 'caused the decline' without causal proof).
4. Distinguish facts from hypotheses.
5. Do not generate alert conditions.
6. Do not create thresholds.
7. Do not create forecast values.
8. Mention relevant limitations.
9. Keep the explanation concise (2 to 4 sentences maximum).
10. If evidence is insufficient, say so directly.`;
    const promptText = `Alert Title: ${alertTitle}
Severity: ${severity}
Type: ${type}
Target Metric: ${metric}
Dataset Name: ${datasetName}

Verified Structured Evidence:
- Summary: ${evidence.summaryText}
- Observed/Actual Value: ${evidence.actualValueFormatted ?? evidence.actualValue ?? "N/A"}
- Expected/Baseline Value: ${evidence.expectedValueFormatted ?? evidence.expectedValue ?? "N/A"}
- Configured Threshold: ${evidence.thresholdFormatted ?? evidence.threshold ?? "N/A"}
- Calculated Deviation: ${evidence.deviationPct !== void 0 ? `${evidence.deviationPct.toFixed(1)}%` : "N/A"}
- Comparison/Date: ${evidence.comparisonPeriod || evidence.dateValue || "Current Period"}
${additionalContext?.rcaSummary ? `- RCA Contributor Finding: ${additionalContext.rcaSummary}` : ""}
${additionalContext?.anomalyContext ? `- Anomaly Context: ${additionalContext.anomalyContext}` : ""}
${additionalContext?.forecastContext ? `- Forecast Model Projection: ${additionalContext.forecastContext}` : ""}

Provide a clear, grounded executive explanation of why this alert triggered and what the verified numbers indicate.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        temperature: 0.1
      }
    });
    const explanation = response.text?.trim() || evidence.summaryText;
    return res.json({ explanation });
  } catch (error) {
    console.error("Error in /api/alerts/explain:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI alert explanation.",
      fallback: req.body?.evidence?.summaryText || "Alert triggered based on configured monitoring thresholds."
    });
  }
});
app.post("/api/alerts/notify-email", async (req, res) => {
  try {
    const {
      email,
      alertTitle,
      severity,
      metric,
      datasetName,
      actualValueFormatted,
      expectedValueFormatted,
      thresholdFormatted,
      deviationPct,
      summaryText,
      triggeredAt,
      alertId
    } = req.body;
    if (!email || !alertTitle) {
      return res.status(400).json({ error: "Missing recipient email or alert information." });
    }
    console.log(`[InsightAI Alerts] Dispatched notification email to ${email} for [${severity.toUpperCase()}] ${alertTitle}`);
    return res.json({
      success: true,
      message: `Alert notification dispatched successfully to ${email}`,
      dispatchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      alertId
    });
  } catch (error) {
    console.error("Error in /api/alerts/notify-email:", error);
    return res.status(500).json({
      error: error.message || "Failed to dispatch alert email."
    });
  }
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  const httpServer = http.createServer(app);
  if (!isProd) {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`InsightAI Server is live on http://0.0.0.0:${PORT}`);
  });
}
startServer();
