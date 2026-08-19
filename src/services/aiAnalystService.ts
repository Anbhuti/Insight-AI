import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getApiAuthHeaders } from './apiClient';
import { Dataset } from '../types/dataset';
import { DatasetProfile, ColumnProfile } from '../types/dataProfile';
import {
  ChatMessage,
  Conversation,
  DatasetAnalystContext,
  AnalystChatPayload,
  AnalystResponsePayload,
  CompactColumnContext,
} from '../types/chat';

const LOCAL_CONVERSATIONS_KEY_PREFIX = 'insightai_conversations_';
const LOCAL_MESSAGES_KEY_PREFIX = 'insightai_messages_';

/**
 * Builds compact, token-efficient context from dataset & profile
 */
export function buildDatasetContext(
  dataset: Dataset,
  profile?: DatasetProfile | null
): DatasetAnalystContext {
  const columns: CompactColumnContext[] = [];

  if (profile && profile.columns) {
    for (const col of profile.columns) {
      const compact: CompactColumnContext = {
        name: col.name,
        type: col.logicalType,
        missingPercentage: col.missingPercentage,
        uniqueCount: col.uniqueCount,
        sampleValues: col.sampleValues?.slice(0, 5),
      };

      if (col.numericStats) {
        compact.min = col.numericStats.min;
        compact.max = col.numericStats.max;
        compact.mean = col.numericStats.mean;
        compact.median = col.numericStats.median;
        compact.stdDev = col.numericStats.standardDeviation;
        compact.outlierCount = col.numericStats.outlierCount;
      }

      if (col.categoricalStats && col.categoricalStats.topValues) {
        compact.topCategories = col.categoricalStats.topValues.slice(0, 5);
      }

      if (col.dateStats) {
        compact.min = col.dateStats.minDate;
        compact.max = col.dateStats.maxDate;
      }

      columns.push(compact);
    }
  } else if (dataset.previewSample) {
    for (const colName of dataset.previewSample.columns) {
      columns.push({
        name: colName,
        type: 'string',
        missingPercentage: 0,
        uniqueCount: 0,
      });
    }
  }

  // Extract sample rows
  let sampleRows: Record<string, any>[] | undefined = undefined;
  if (dataset.previewSample && dataset.previewSample.rows.length > 0) {
    const colNames = dataset.previewSample.columns;
    sampleRows = dataset.previewSample.rows.slice(0, 5).map((row) => {
      const obj: Record<string, any> = {};
      colNames.forEach((name, i) => {
        obj[name] = row[i];
      });
      return obj;
    });
  }

  const criticalIssues = (profile?.issues || [])
    .filter((i) => i.severity === 'critical' || i.severity === 'high' || i.severity === 'medium')
    .slice(0, 6)
    .map((i) => ({
      category: i.category,
      severity: i.severity,
      description: i.description,
      recommendation: i.recommendation,
    }));

  return {
    datasetId: dataset.datasetId,
    datasetName: dataset.name,
    rowCount: profile?.rowCount || dataset.rowCount || 0,
    columnCount: profile?.columnCount || dataset.columnCount || 0,
    fileType: dataset.fileType,
    qualityScore: profile?.qualityScore || dataset.qualityScore || 0,
    duplicateRowCount: profile?.duplicateRowCount || 0,
    missingCellPercentage: profile?.missingCellPercentage || 0,
    columns,
    criticalIssues,
    sampleRows,
  };
}

/**
 * Generates dynamic starter prompt recommendations based on dataset contents
 */
export function getDatasetStarterPrompts(
  dataset: Dataset,
  profile?: DatasetProfile | null
): string[] {
  const prompts: string[] = [];

  if (!profile || !profile.columns || profile.columns.length === 0) {
    return [
      `What are the most significant high-level patterns in ${dataset.name}?`,
      `Summarize the key variables and data quality of this dataset.`,
      `What business questions can I answer with this data?`,
      `Which metrics should I visualize first?`,
    ];
  }

  const numCols = profile.columns.filter(
    (c) => c.logicalType === 'numeric' || c.logicalType === 'integer' || c.logicalType === 'decimal'
  );
  const catCols = profile.columns.filter(
    (c) => c.logicalType === 'categorical' || c.logicalType === 'text'
  );
  const dateCols = profile.columns.filter(
    (c) => c.logicalType === 'date' || c.logicalType === 'datetime'
  );

  // 1. Quality & Executive Overview
  prompts.push(
    `Provide an executive briefing: what does this dataset represent, and what is its overall data health?`
  );

  // 2. Financial / Metric Driver Analysis
  const revCol = numCols.find((c) =>
    /revenue|sales|profit|amount|cost|spend|price|total|income/i.test(c.name)
  );
  const dimCol = catCols.find((c) =>
    /category|region|country|segment|product|channel|department|status/i.test(c.name)
  );

  if (revCol && dimCol) {
    prompts.push(
      `Analyze the relationship and variance of **${revCol.name}** broken down by **${dimCol.name}**.`
    );
  } else if (numCols.length > 0) {
    prompts.push(
      `Examine the distribution, outliers, and skewness of **${numCols[0].name}**.`
    );
  }

  // 3. Time Series or Trend
  if (dateCols.length > 0 && numCols.length > 0) {
    prompts.push(
      `How has **${numCols[0].name}** trended over time based on **${dateCols[0].name}**?`
    );
  } else if (catCols.length > 0) {
    prompts.push(
      `What are the top categories in **${catCols[0].name}** and where is the concentration?`
    );
  }

  // 4. Outliers & Data Hygiene
  const outlierCol = numCols.find((c) => (c.numericStats?.outlierCount || 0) > 0);
  if (outlierCol) {
    prompts.push(
      `Investigate the ${outlierCol.numericStats?.outlierCount} anomalous outliers in **${outlierCol.name}** and their potential business impact.`
    );
  } else {
    prompts.push(
      `What data cleaning or preprocessing steps do you recommend before running advanced statistical modeling?`
    );
  }

  return prompts.slice(0, 4);
}

/**
 * Sends chat request to server-side Gemini API
 */
export async function askAnalyst(payload: AnalystChatPayload): Promise<AnalystResponsePayload> {
  const response = await fetch('/api/analyst/chat', {
    method: 'POST',
    headers: getApiAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `Server returned status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}

/**
 * Conversation Firestore & Local Storage Helpers
 */

function getLocalConversationsKey(userId: string): string {
  return `${LOCAL_CONVERSATIONS_KEY_PREFIX}${userId}`;
}

function getLocalMessagesKey(userId: string, conversationId: string): string {
  return `${LOCAL_MESSAGES_KEY_PREFIX}${userId}_${conversationId}`;
}

export async function createConversation(
  userId: string,
  datasetId: string,
  datasetName: string,
  initialTitle?: string
): Promise<Conversation> {
  const id = `conv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const conv: Conversation = {
    id,
    userId,
    datasetId,
    datasetName,
    title: initialTitle || `Chat with ${datasetName}`,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };

  if (db) {
    try {
      const convRef = doc(db, 'users', userId, 'conversations', id);
      await setDoc(convRef, conv);
    } catch (e) {
      console.warn('Firestore createConversation failed, saving locally:', e);
    }
  }

  // Local caching
  const stored = getLocalConversations(userId);
  stored.unshift(conv);
  saveLocalConversations(userId, stored);

  return conv;
}

export async function getConversations(
  userId: string,
  datasetId?: string
): Promise<Conversation[]> {
  if (!userId) return [];

  let list: Conversation[] = [];

  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'conversations');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as Conversation);
    } catch (e) {
      console.warn('Firestore getConversations failed, using local cache:', e);
      list = getLocalConversations(userId);
    }
  } else {
    list = getLocalConversations(userId);
  }

  if (datasetId) {
    return list.filter((c) => c.datasetId === datasetId);
  }

  return list;
}

export async function getConversationMessages(
  userId: string,
  conversationId: string
): Promise<ChatMessage[]> {
  if (!userId || !conversationId) return [];

  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
      const q = query(colRef, orderBy('timestamp', 'asc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ChatMessage);
      }
    } catch (e) {
      console.warn('Firestore getConversationMessages failed, checking local storage:', e);
    }
  }

  return getLocalMessages(userId, conversationId);
}

export async function saveMessage(
  userId: string,
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  if (!userId || !conversationId || !message) return;

  if (db) {
    try {
      const msgRef = doc(
        db,
        'users',
        userId,
        'conversations',
        conversationId,
        'messages',
        message.id
      );
      await setDoc(msgRef, message);

      // Update conversation metadata
      const convRef = doc(db, 'users', userId, 'conversations', conversationId);
      await updateDoc(convRef, {
        updatedAt: new Date().toISOString(),
        lastMessageSnippet: message.content.substring(0, 100),
      });
    } catch (e) {
      console.warn('Firestore saveMessage failed, caching locally:', e);
    }
  }

  // Local sync
  const currentMessages = getLocalMessages(userId, conversationId);
  const existingIdx = currentMessages.findIndex((m) => m.id === message.id);
  if (existingIdx >= 0) {
    currentMessages[existingIdx] = message;
  } else {
    currentMessages.push(message);
  }
  saveLocalMessages(userId, conversationId, currentMessages);

  // Update conversation in local storage
  const convs = getLocalConversations(userId);
  const convIdx = convs.findIndex((c) => c.id === conversationId);
  if (convIdx >= 0) {
    convs[convIdx].updatedAt = new Date().toISOString();
    convs[convIdx].messageCount = currentMessages.length;
    convs[convIdx].lastMessageSnippet = message.content.substring(0, 100);
    saveLocalConversations(userId, convs);
  }
}

export async function updateMessageFeedback(
  userId: string,
  conversationId: string,
  messageId: string,
  feedback: 'like' | 'dislike' | null
): Promise<void> {
  if (!userId || !conversationId || !messageId) return;

  if (db) {
    try {
      const msgRef = doc(
        db,
        'users',
        userId,
        'conversations',
        conversationId,
        'messages',
        messageId
      );
      await updateDoc(msgRef, { feedback });
    } catch (e) {
      console.warn('Firestore updateMessageFeedback failed:', e);
    }
  }

  const msgs = getLocalMessages(userId, conversationId);
  const msg = msgs.find((m) => m.id === messageId);
  if (msg) {
    msg.feedback = feedback;
    saveLocalMessages(userId, conversationId, msgs);
  }
}

export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!userId || !conversationId) return;

  if (db) {
    try {
      const convRef = doc(db, 'users', userId, 'conversations', conversationId);
      await deleteDoc(convRef);
    } catch (e) {
      console.warn('Firestore deleteConversation failed:', e);
    }
  }

  const convs = getLocalConversations(userId).filter((c) => c.id !== conversationId);
  saveLocalConversations(userId, convs);
  localStorage.removeItem(getLocalMessagesKey(userId, conversationId));
}

// Local Storage Helpers
function getLocalConversations(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(getLocalConversationsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalConversations(userId: string, list: Conversation[]): void {
  try {
    localStorage.setItem(getLocalConversationsKey(userId), JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save conversations locally', e);
  }
}

function getLocalMessages(userId: string, conversationId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(getLocalMessagesKey(userId, conversationId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(
  userId: string,
  conversationId: string,
  messages: ChatMessage[]
): void {
  try {
    localStorage.setItem(getLocalMessagesKey(userId, conversationId), JSON.stringify(messages));
  } catch (e) {
    console.warn('Failed to save messages locally', e);
  }
}
