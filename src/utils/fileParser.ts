import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  DatasetFileType,
  DatasetPreview,
  MAX_FILE_SIZE,
  PREVIEW_ROW_LIMIT,
} from '../types/dataset';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: DatasetFileType;
}

/**
 * Validates file format, MIME types, and size constraints
 */
export function validateDatasetFile(file: File | null | undefined): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'Please select a file to upload.' };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'This file is empty. Please upload a dataset containing data.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'This file is too large. Please upload a file smaller than 25 MB.',
    };
  }

  const fileName = file.name.toLowerCase();
  let detectedType: DatasetFileType | null = null;

  if (fileName.endsWith('.csv')) {
    detectedType = 'csv';
  } else if (fileName.endsWith('.xlsx')) {
    detectedType = 'xlsx';
  } else if (fileName.endsWith('.xls')) {
    detectedType = 'xls';
  }

  if (!detectedType) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a .csv, .xlsx, or .xls file.',
    };
  }

  // Check MIME types where available
  const mime = file.type.toLowerCase();
  const validMimes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/csv',
    'text/x-csv',
    'application/x-csv',
    'text/comma-separated-values',
    'text/x-comma-separated-values',
    '', // Some browsers don't provide MIME type
  ];

  if (mime && !validMimes.some((vm) => mime.includes(vm) || vm.includes(mime))) {
    // If MIME is clearly something completely unrelated like image/png or application/pdf
    if (mime.startsWith('image/') || mime.startsWith('video/') || mime === 'application/pdf') {
      return {
        valid: false,
        error: 'Invalid file format. Please upload a tabular CSV or Excel spreadsheet.',
      };
    }
  }

  return {
    valid: true,
    fileType: detectedType,
  };
}

/**
 * Parses a CSV or Excel file to generate a safe 10-row preview and schema metadata
 */
export async function parseDatasetFile(
  file: File,
  chosenSheet?: string
): Promise<DatasetPreview> {
  const validation = validateDatasetFile(file);
  if (!validation.valid || !validation.fileType) {
    throw new Error(validation.error || 'Invalid file.');
  }

  if (validation.fileType === 'csv') {
    return parseCsvFile(file);
  } else {
    return parseExcelFile(file, chosenSheet);
  }
}

/**
 * Parses CSV files using PapaParse
 */
function parseCsvFile(file: File): Promise<DatasetPreview> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: 'greedy',
      preview: 500, // Read only up to 500 lines for fast preview and count estimation
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error("This file doesn't contain any data rows. Please upload a dataset containing data."));
          return;
        }

        const rawRows = results.data.filter((r) => r.length > 0 && r.some((c) => c !== null && c !== ''));

        if (rawRows.length < 2) {
          reject(new Error("This file doesn't contain any data rows. Please upload a dataset containing data."));
          return;
        }

        // First row is headers
        const rawHeaders = rawRows[0];
        const columns = rawHeaders.map((h, i) => (h && h.trim() !== '' ? h.trim() : `Column_${i + 1}`));

        // Data sample (up to 10 rows)
        const dataRows = rawRows.slice(1);
        const sampleRows = dataRows.slice(0, PREVIEW_ROW_LIMIT).map((row) => {
          return columns.map((_, i) => (row[i] !== undefined && row[i] !== null ? row[i] : ''));
        });

        // Approximate row count (Papa.parse preview vs estimated file size calculation)
        const rowCount = Math.max(dataRows.length, Math.round(file.size / Math.max(1, (results.data[0]?.join(',').length || 40))));

        resolve({
          fileName: file.name,
          fileSize: file.size,
          fileType: 'csv',
          rowCount: dataRows.length,
          columnCount: columns.length,
          columns,
          sampleRows,
          selectedSheet: null,
        });
      },
      error: (error) => {
        reject(new Error(`We couldn't read this CSV correctly: ${error.message}. Please check the file encoding and try again.`));
      },
    });
  });
}

/**
 * Parses Excel (.xlsx / .xls) files using SheetJS
 */
async function parseExcelFile(file: File, chosenSheet?: string): Promise<DatasetPreview> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      sheetRows: 200, // Optimize memory by reading top slice for preview
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No usable worksheet was found in this Excel file.');
    }

    const availableSheets = workbook.SheetNames;
    const selectedSheet = (chosenSheet && availableSheets.includes(chosenSheet))
      ? chosenSheet
      : availableSheets[0];

    const worksheet = workbook.Sheets[selectedSheet];
    if (!worksheet) {
      throw new Error(`Worksheet "${selectedSheet}" is empty or cannot be opened.`);
    }

    // Convert sheet to matrix of rows
    const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (!sheetData || sheetData.length < 2) {
      throw new Error(`Worksheet "${selectedSheet}" does not contain any data rows. Please upload a dataset with data.`);
    }

    // Header row
    const headerRow = sheetData[0];
    const columns: string[] = headerRow.map((cell, idx) => {
      const val = String(cell || '').trim();
      return val.length > 0 ? val : `Column_${idx + 1}`;
    });

    const dataRows = sheetData.slice(1);
    const sampleRows = dataRows.slice(0, PREVIEW_ROW_LIMIT).map((row) => {
      return columns.map((_, i) => {
        const val = row[i];
        if (val instanceof Date) {
          return val.toLocaleDateString();
        }
        return val !== undefined && val !== null ? String(val) : '';
      });
    });

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'xls',
      rowCount: dataRows.length,
      columnCount: columns.length,
      columns,
      sampleRows,
      availableSheets,
      selectedSheet,
    };
  } catch (err: any) {
    if (err.message && err.message.includes('Worksheet')) {
      throw err;
    }
    throw new Error(
      "We couldn't read this Excel file. The file may be corrupted or use an unsupported format. Please try opening it in Excel and saving it again."
    );
  }
}
