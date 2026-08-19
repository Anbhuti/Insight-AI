import {
  Anomaly,
  AnomalyDetectionConfig,
  AnomalyScanSummary,
  AnomalySensitivity,
  AnomalyStatus,
  DetectionMethod,
} from '../../types/anomaly';
import { Dataset } from '../../types/dataset';
import { DatasetProfile, ColumnProfile } from '../../types/dataProfile';
import {
  detectZScoreAnomalies,
  detectIQRAnomalies,
  detectMADAnomalies,
  detectRollingWindowAnomalies,
  detectPercentageChangeAnomalies,
  NumericSeriesItem,
} from './statisticalEngine';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, getBytes } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { isValueMissing } from '../profilingService';

const LOCAL_ANOMALIES_KEY_PREFIX = 'insightai_anomalies_';

export function getDefaultDetectionConfig(sensitivity: AnomalySensitivity = 'standard'): AnomalyDetectionConfig {
  if (sensitivity === 'aggressive') {
    return {
      sensitivity: 'aggressive',
      zScoreThreshold: 2.3,
      iqrMultiplier: 1.2,
      madThreshold: 2.5,
      pctChangeThreshold: 25,
      windowSize: 5,
      maxAnomaliesPerColumn: 10,
      totalMaxAnomalies: 40,
      enabledMethods: ['z_score', 'iqr', 'mad', 'rolling_window', 'pct_change'],
    };
  } else if (sensitivity === 'conservative') {
    return {
      sensitivity: 'conservative',
      zScoreThreshold: 3.5,
      iqrMultiplier: 2.2,
      madThreshold: 4.2,
      pctChangeThreshold: 60,
      windowSize: 10,
      maxAnomaliesPerColumn: 5,
      totalMaxAnomalies: 20,
      enabledMethods: ['z_score', 'iqr', 'mad', 'rolling_window', 'pct_change'],
    };
  }

  // Standard (Balanced)
  return {
    sensitivity: 'standard',
    zScoreThreshold: 2.8,
    iqrMultiplier: 1.5,
    madThreshold: 3.2,
    pctChangeThreshold: 40,
    windowSize: 7,
    maxAnomaliesPerColumn: 8,
    totalMaxAnomalies: 30,
    enabledMethods: ['z_score', 'iqr', 'mad', 'rolling_window', 'pct_change'],
  };
}

/**
 * Loads tabular rows from Storage, Download URL, or Dataset Preview Sample
 */
export async function loadDatasetRows(
  dataset: Dataset
): Promise<{ columns: string[]; rows: (string | number | boolean | null)[][] }> {
  let fileBuffer: ArrayBuffer | undefined;

  // 1. Try Firebase Cloud Storage
  if (storage && dataset.storagePath) {
    try {
      const storageRef = ref(storage, dataset.storagePath);
      fileBuffer = await getBytes(storageRef, 25 * 1024 * 1024);
    } catch (e) {
      console.warn('Storage fetch fallback to preview/url:', e);
    }
  }

  if (!fileBuffer && dataset.downloadUrl) {
    try {
      const res = await fetch(dataset.downloadUrl);
      fileBuffer = await res.arrayBuffer();
    } catch {
      // ignore
    }
  }

  if (fileBuffer) {
    if (dataset.fileType === 'csv') {
      const text = new TextDecoder('utf-8').decode(fileBuffer);
      const parsed = Papa.parse(text, {
        header: false,
        dynamicTyping: false,
        skipEmptyLines: 'greedy',
      });
      if (parsed.data && parsed.data.length > 0) {
        const rawHeader = parsed.data[0] as string[];
        const columns = rawHeader.map((c, i) => (c && String(c).trim() ? String(c).trim() : `Column_${i + 1}`));
        const rows = (parsed.data.slice(1) as (string | number | boolean | null)[][]).filter(
          (r) => r.length > 0 && r.some((cell) => cell !== null && cell !== '')
        );
        return { columns, rows };
      }
    } else {
      // Excel parsing
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = dataset.selectedSheet && workbook.SheetNames.includes(dataset.selectedSheet)
        ? dataset.selectedSheet
        : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as (string | number | boolean | null)[][];
      if (jsonData && jsonData.length > 0) {
        const rawHeader = jsonData[0] as string[];
        const columns = rawHeader.map((c, i) => (c && String(c).trim() ? String(c).trim() : `Column_${i + 1}`));
        const rows = jsonData.slice(1).filter((r) => r.length > 0 && r.some((cell) => cell !== null && cell !== ''));
        return { columns, rows };
      }
    }
  }

  // Fallback to preview sample
  if (dataset.previewSample && dataset.previewSample.columns.length > 0) {
    return {
      columns: dataset.previewSample.columns,
      rows: dataset.previewSample.rows,
    };
  }

  return { columns: [], rows: [] };
}

/**
 * Executes a full statistical anomaly scan on a dataset
 */
export async function runAnomalyDetectionScan(
  dataset: Dataset,
  profile: DatasetProfile | null,
  customConfig?: Partial<AnomalyDetectionConfig>
): Promise<AnomalyScanSummary> {
  const startTime = performance.now();
  const config: AnomalyDetectionConfig = {
    ...getDefaultDetectionConfig(customConfig?.sensitivity || 'standard'),
    ...customConfig,
  };

  // Load raw data
  const { columns, rows } = await loadDatasetRows(dataset);
  const rowCount = rows.length;

  if (columns.length === 0 || rowCount === 0) {
    throw new Error('No records available to perform statistical anomaly detection.');
  }

  // Identify column roles
  const columnProfiles = profile?.columns || [];
  const colProfileMap = new Map<string, ColumnProfile>();
  columnProfiles.forEach((cp) => colProfileMap.set(cp.name, cp));

  let dateColIdx = -1;
  let dimensionColIdx = -1;

  for (let c = 0; c < columns.length; c++) {
    const colName = columns[c];
    const cp = colProfileMap.get(colName);
    const lower = colName.toLowerCase();

    // Check for date column
    if (dateColIdx === -1) {
      if (cp?.logicalType === 'date' || cp?.logicalType === 'datetime' || lower.includes('date') || lower.includes('time') || lower.includes('year') || lower.includes('month') || lower.includes('day')) {
        dateColIdx = c;
      }
    }

    // Check for primary dimension (Category / Region / Segment / Product)
    if (dimensionColIdx === -1) {
      if (
        (cp?.logicalType === 'categorical' || (!cp && !lower.includes('id') && !lower.includes('date'))) &&
        (lower.includes('category') || lower.includes('region') || lower.includes('country') || lower.includes('segment') || lower.includes('product') || lower.includes('channel') || lower.includes('department') || lower.includes('brand'))
      ) {
        dimensionColIdx = c;
      }
    }
  }

  const rawAnomalies: Anomaly[] = [];
  const methods = config.enabledMethods;

  // Scan every numeric column
  for (let c = 0; c < columns.length; c++) {
    const colName = columns[c];
    const cp = colProfileMap.get(colName);

    // If user specified target columns, restrict to them
    if (config.selectedColumns && config.selectedColumns.length > 0 && !config.selectedColumns.includes(colName)) {
      continue;
    }

    // Skip potential IDs or non-numeric fields
    if (cp && (cp.isPotentialId || cp.logicalType === 'text' || cp.logicalType === 'boolean')) {
      continue;
    }

    // Extract numeric series
    const series: NumericSeriesItem[] = [];

    for (let r = 0; r < rowCount; r++) {
      const rawRow = rows[r];
      const rawCell = rawRow[c];

      if (isValueMissing(rawCell)) continue;

      let numVal: number | null = null;
      if (typeof rawCell === 'number') {
        numVal = rawCell;
      } else if (typeof rawCell === 'string') {
        const cleaned = rawCell.replace(/[$,%]/g, '').trim();
        const parsed = Number(cleaned);
        if (!Number.isNaN(parsed)) numVal = parsed;
      }

      if (numVal !== null && Number.isFinite(numVal)) {
        // Build raw row dictionary
        const rowDict: Record<string, string | number | boolean | null> = {};
        columns.forEach((col, idx) => {
          rowDict[col] = rawRow[idx] !== undefined ? rawRow[idx] : null;
        });

        const dateStr = dateColIdx !== -1 && rawRow[dateColIdx] !== null && rawRow[dateColIdx] !== undefined ? String(rawRow[dateColIdx]) : undefined;
        const dimensionStr = dimensionColIdx !== -1 && rawRow[dimensionColIdx] !== null && rawRow[dimensionColIdx] !== undefined ? String(rawRow[dimensionColIdx]) : undefined;

        series.push({
          rowIndex: r,
          value: numVal,
          dateStr,
          dimensionStr,
          rowRecord: rowDict,
        });
      }
    }

    // Need at least 5 numeric observations
    if (series.length < 5) continue;

    // Check if column is sufficiently numeric (>60% of non-null cells)
    if (series.length < rowCount * 0.4 && rowCount > 10) continue;

    // 1. Z-Score Detection
    if (methods.includes('z_score')) {
      const zAnoms = detectZScoreAnomalies(series, colName, dataset.datasetId, dataset.name, dataset.userId, config);
      rawAnomalies.push(...zAnoms.slice(0, config.maxAnomaliesPerColumn));
    }

    // 2. IQR Outlier Detection
    if (methods.includes('iqr')) {
      const iqrAnoms = detectIQRAnomalies(series, colName, dataset.datasetId, dataset.name, dataset.userId, config);
      rawAnomalies.push(...iqrAnoms.slice(0, config.maxAnomaliesPerColumn));
    }

    // 3. MAD Detection
    if (methods.includes('mad')) {
      const madAnoms = detectMADAnomalies(series, colName, dataset.datasetId, dataset.name, dataset.userId, config);
      rawAnomalies.push(...madAnoms.slice(0, config.maxAnomaliesPerColumn));
    }

    // 4. Rolling Window & % Change if Date column present or series is ordered
    if (dateColIdx !== -1 || series.length >= 10) {
      if (methods.includes('rolling_window')) {
        const rollAnoms = detectRollingWindowAnomalies(series, colName, dataset.datasetId, dataset.name, dataset.userId, config);
        rawAnomalies.push(...rollAnoms.slice(0, config.maxAnomaliesPerColumn));
      }
      if (methods.includes('pct_change')) {
        const pctAnoms = detectPercentageChangeAnomalies(series, colName, dataset.datasetId, dataset.name, dataset.userId, config);
        rawAnomalies.push(...pctAnoms.slice(0, config.maxAnomaliesPerColumn));
      }
    }
  }

  // Deduplicate overlapping detections on the same (column, rowIndex) by keeping highest severity/score
  const uniqueKeyMap = new Map<string, Anomaly>();
  for (const anom of rawAnomalies) {
    const key = `${anom.column}__${anom.rowIndex}`;
    const existing = uniqueKeyMap.get(key);
    if (!existing) {
      uniqueKeyMap.set(key, anom);
    } else {
      const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
      if (
        severityRank[anom.severity] > severityRank[existing.severity] ||
        (severityRank[anom.severity] === severityRank[existing.severity] && anom.score > existing.score)
      ) {
        uniqueKeyMap.set(key, anom);
      }
    }
  }

  const deduplicated = Array.from(uniqueKeyMap.values());

  // Rank by Severity, Score, and Magnitude
  const severityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  deduplicated.sort((a, b) => {
    if (severityOrder[b.severity] !== severityOrder[a.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return Math.abs(b.deviationPercentage) - Math.abs(a.deviationPercentage);
  });

  const finalAnomalies = deduplicated.slice(0, config.totalMaxAnomalies);

  const durationMs = Math.round(performance.now() - startTime);

  const summary: AnomalyScanSummary = {
    id: `scan_${dataset.datasetId}_${Date.now()}`,
    datasetId: dataset.datasetId,
    datasetName: dataset.name,
    userId: dataset.userId,
    totalRowsScanned: rowCount,
    columnsScanned: columns.length,
    anomaliesFound: finalAnomalies.length,
    criticalCount: finalAnomalies.filter((a) => a.severity === 'critical').length,
    highCount: finalAnomalies.filter((a) => a.severity === 'high').length,
    mediumCount: finalAnomalies.filter((a) => a.severity === 'medium').length,
    lowCount: finalAnomalies.filter((a) => a.severity === 'low').length,
    config,
    scannedAt: new Date().toISOString(),
    scanDurationMs: durationMs,
    anomalies: finalAnomalies,
  };

  // Save to Firestore and LocalStorage
  await saveAnomalyScan(summary);

  return summary;
}

/**
 * Saves anomaly scan result to Firestore and LocalStorage
 */
export async function saveAnomalyScan(summary: AnomalyScanSummary): Promise<void> {
  if (db && summary.userId && summary.datasetId) {
    try {
      const docRef = doc(db, 'users', summary.userId, 'datasets', summary.datasetId, 'anomalies', 'latest');
      await setDoc(docRef, {
        ...summary,
        scannedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore saveAnomalyScan warning:', e);
    }
  }

  // Local storage backup
  try {
    const key = `${LOCAL_ANOMALIES_KEY_PREFIX}${summary.userId}_${summary.datasetId}`;
    localStorage.setItem(key, JSON.stringify(summary));
  } catch (e) {
    console.warn('LocalStorage saveAnomalyScan warning:', e);
  }
}

/**
 * Retrieves latest anomaly scan summary for a dataset
 */
export async function getLatestAnomalyScan(
  userId: string,
  datasetId: string
): Promise<AnomalyScanSummary | null> {
  if (!userId || !datasetId) return null;

  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'datasets', datasetId, 'anomalies', 'latest');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AnomalyScanSummary;
        return {
          ...data,
          scannedAt: (data.scannedAt as any)?.toDate
            ? (data.scannedAt as any).toDate().toISOString()
            : data.scannedAt || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Firestore getLatestAnomalyScan warning:', e);
    }
  }

  // Local fallback
  try {
    const key = `${LOCAL_ANOMALIES_KEY_PREFIX}${userId}_${datasetId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Updates status of an individual anomaly
 */
export async function updateAnomalyStatus(
  userId: string,
  datasetId: string,
  anomalyId: string,
  newStatus: AnomalyStatus,
  notes?: string
): Promise<void> {
  const scan = await getLatestAnomalyScan(userId, datasetId);
  if (!scan) return;

  const target = scan.anomalies.find((a) => a.id === anomalyId);
  if (target) {
    target.status = newStatus;
    if (newStatus === 'resolved') {
      target.resolvedAt = new Date().toISOString();
    }
    if (notes) {
      target.investigationNotes = notes;
    }
    await saveAnomalyScan(scan);
  }
}

/**
 * Retrieves stored anomalies synchronously from local storage if available
 */
export function getStoredAnomalies(datasetId: string, userId?: string): Anomaly[] {
  try {
    if (userId) {
      const key = `${LOCAL_ANOMALIES_KEY_PREFIX}${userId}_${datasetId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: AnomalyScanSummary = JSON.parse(raw);
        return parsed.anomalies || [];
      }
    }
    // Search any matching key in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LOCAL_ANOMALIES_KEY_PREFIX) && k.endsWith(`_${datasetId}`)) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed: AnomalyScanSummary = JSON.parse(raw);
          return parsed.anomalies || [];
        }
      }
    }
  } catch {
    // ignore
  }
  return [];
}
