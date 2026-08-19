import { Dataset } from '../types/dataset';
import { DatasetProfile } from '../types/dataProfile';
import { SQLAgentResponse, SQLTableSchema } from './sql/types';
import { buildTableSchema } from './sql/schemaService';
import { getApiAuthHeaders } from './apiClient';

export interface SQLAgentRequestPayload {
  userId: string;
  datasetId: string;
  datasetName: string;
  question: string;
  schema: SQLTableSchema;
  history?: { role: 'user' | 'assistant'; content: string }[];
  qualityIssues?: { category: string; severity: string; description: string }[];
  sampleRows?: Record<string, any>[];
  previewRows?: (string | number | boolean | null)[][];
}

/**
 * Calls the server-side SQL Analytics Agent endpoint
 */
export async function runSQLAgent(
  dataset: Dataset,
  profile: DatasetProfile | null,
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<SQLAgentResponse> {
  const schema = buildTableSchema(dataset, profile);

  // Extract preview rows if available
  const previewRows = dataset.previewSample?.rows || [];

  const qualityIssues = (profile?.issues || [])
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .map((i) => ({
      category: i.category,
      severity: i.severity,
      description: i.description,
    }));

  const payload: SQLAgentRequestPayload = {
    userId: dataset.userId,
    datasetId: dataset.datasetId,
    datasetName: dataset.name,
    question,
    schema,
    history: history.slice(-6),
    qualityIssues,
    previewRows,
  };

  const response = await fetch('/api/sql/agent', {
    method: 'POST',
    headers: getApiAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const err = await response.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}
