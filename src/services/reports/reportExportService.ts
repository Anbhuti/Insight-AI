import * as XLSX from 'xlsx';
import { Report } from './reportTypes';

/**
 * Exports full report as a multi-tab structured Excel workbook (.xlsx)
 */
export function exportReportToExcel(report: Report): void {
  const wb = XLSX.utils.book_new();

  // 1. Executive Briefing Sheet
  const briefingRows: (string | number)[][] = [
    ['REPORT TITLE', report.metadata.title],
    ['SUBTITLE', report.metadata.subtitle || ''],
    ['DATASET', report.metadata.datasetName],
    ['AUTHOR', report.metadata.authorName],
    ['GENERATED AT', report.metadata.createdAt],
    ['STATUS', report.metadata.status.toUpperCase()],
    ['GROUNDED IN REAL DATA', report.provenance.groundedInActualData ? 'YES (100% Verified)' : 'NO'],
    [],
  ];

  const execSec = report.sections.find((s) => s.type === 'executive_summary')?.content?.executiveSummary;
  if (execSec) {
    briefingRows.push(['HEADLINE', execSec.headline]);
    briefingRows.push(['OVERVIEW NARRATIVE', execSec.overviewNarrative]);
    briefingRows.push([]);
    briefingRows.push(['KEY TAKEAWAYS']);
    execSec.keyTakeaways.forEach((t, i) => briefingRows.push([`Takeaway ${i + 1}`, t]));
    briefingRows.push([]);
    briefingRows.push(['STRATEGIC IMPLICATIONS']);
    execSec.strategicImplications.forEach((imp, i) => briefingRows.push([`Implication ${i + 1}`, imp]));
  }

  const wsBriefing = XLSX.utils.aoa_to_sheet(briefingRows);
  XLSX.utils.book_append_sheet(wb, wsBriefing, 'Executive Briefing');

  // 2. KPIs Sheet
  const kpiSec = report.sections.find((s) => s.type === 'kpi_overview')?.content?.kpis;
  if (kpiSec && kpiSec.length > 0) {
    const kpiRows = [
      ['KPI Label', 'Metric Column', 'Current Value', 'Formatted Value', 'Aggregation', 'Notes'],
      ...kpiSec.map((k) => [
        k.label,
        k.metricColumn,
        k.currentValue,
        k.formattedValue,
        k.aggregation,
        k.description || '',
      ]),
    ];
    const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'Key Performance Indicators');
  }

  // 3. Trends & Visuals Sheet
  const trendSec = report.sections.find((s) => s.type === 'trend_charts')?.content?.charts;
  if (trendSec && trendSec.length > 0 && trendSec[0].data.length > 0) {
    const chart = trendSec[0];
    const chartHeaders = Object.keys(chart.data[0]);
    const chartRows = [
      chartHeaders,
      ...chart.data.map((row) => chartHeaders.map((h) => row[h])),
    ];
    const wsTrends = XLSX.utils.aoa_to_sheet(chartRows);
    XLSX.utils.book_append_sheet(wb, wsTrends, 'Chronological Trends');
  }

  // 4. Category Breakdown Sheet
  const catSec = report.sections.find((s) => s.type === 'category_breakdown')?.content?.charts;
  if (catSec && catSec.length > 0 && catSec[0].data.length > 0) {
    const chart = catSec[0];
    const chartHeaders = Object.keys(chart.data[0]);
    const chartRows = [
      chartHeaders,
      ...chart.data.map((row) => chartHeaders.map((h) => row[h])),
    ];
    const wsCats = XLSX.utils.aoa_to_sheet(chartRows);
    XLSX.utils.book_append_sheet(wb, wsCats, 'Category Distributions');
  }

  // 5. Anomalies Sheet
  const anomSec = report.sections.find((s) => s.type === 'anomaly_deep_dive')?.content?.anomalies;
  if (anomSec && anomSec.items.length > 0) {
    const anomRows = [
      ['Column', 'Actual Value', 'Expected Baseline', 'Deviation %', 'Method', 'Severity', 'Status', 'Timestamp / Row'],
      ...anomSec.items.map((a) => [
        a.column,
        a.actualValue,
        a.expectedValue,
        `${a.deviationPercentage}%`,
        a.method,
        a.severity,
        a.status,
        a.dateValue || a.rowIdentifier || (a.rowIndex !== undefined ? `Row #${a.rowIndex}` : ''),
      ]),
    ];
    const wsAnom = XLSX.utils.aoa_to_sheet(anomRows);
    XLSX.utils.book_append_sheet(wb, wsAnom, 'Detected Anomalies');
  }

  // 6. Root Cause Drivers Sheet
  const rcaSec = report.sections.find((s) => s.type === 'root_cause_analysis')?.content?.rootCause;
  if (rcaSec) {
    const rcaRows = [
      ['Target Metric', rcaSec.targetMetric],
      ['Headline', rcaSec.headline],
      ['Confidence', rcaSec.overallConfidence],
      [],
      ['TOP DRIVER DIMENSION', 'SEGMENT', 'CONTRIBUTION %', 'DELTA VALUE'],
      ...rcaSec.topDrivers.map((d) => [d.dimension, d.segment, `${d.contributionPct}%`, d.delta]),
      [],
      ['FORMULATED HYPOTHESIS', 'CONFIDENCE', 'CLASSIFICATION'],
      ...rcaSec.hypotheses.map((h) => [h.statement, h.confidence, h.classification]),
    ];
    const wsRCA = XLSX.utils.aoa_to_sheet(rcaRows);
    XLSX.utils.book_append_sheet(wb, wsRCA, 'Root Cause Drivers');
  }

  // 7. Predictive Forecast Sheet
  const fcSec = report.sections.find((s) => s.type === 'forecast_outlook')?.content?.forecast;
  if (fcSec) {
    const fcRows = [
      ['Target Metric', fcSec.targetMetric],
      ['Selected Model', fcSec.selectedModel],
      ['Forecast Horizon', `${fcSec.horizon} periods (${fcSec.frequency})`],
      ['Expected Growth', `${fcSec.expectedGrowthPct}%`],
      [],
      ['DATE / PERIOD', 'ACTUAL VALUE', 'PREDICTION', 'LOWER BOUND (95%)', 'UPPER BOUND (95%)'],
      ...fcSec.summaryPoints.map((p) => [
        p.date,
        p.actual !== undefined ? p.actual : '',
        p.prediction !== undefined ? p.prediction : '',
        p.lowerBound !== undefined ? p.lowerBound : '',
        p.upperBound !== undefined ? p.upperBound : '',
      ]),
    ];
    const wsFC = XLSX.utils.aoa_to_sheet(fcRows);
    XLSX.utils.book_append_sheet(wb, wsFC, 'Predictive Forecast');
  }

  // 8. Quality & Hygiene Sheet
  const qSec = report.sections.find((s) => s.type === 'data_quality_audit')?.content?.quality;
  if (qSec) {
    const qRows = [
      ['Data Quality Score', `${qSec.qualityScore}/100`],
      ['Quality Grade', qSec.grade],
      ['Hygiene Status', qSec.hygieneStatus],
      ['Clean Columns', `${qSec.cleanColumnsCount} of ${qSec.totalColumns}`],
      ['Missing Cells %', `${qSec.missingCellsPct}%`],
      ['Duplicate Rows %', `${qSec.duplicateRowsPct}%`],
      [],
      ['CRITICAL ISSUES', 'SEVERITY', 'RECOMMENDED REMEDIATION'],
      ...qSec.criticalIssues.map((iss) => [iss.description, iss.severity, iss.recommendation]),
    ];
    const wsQ = XLSX.utils.aoa_to_sheet(qRows);
    XLSX.utils.book_append_sheet(wb, wsQ, 'Data Quality Audit');
  }

  // Write file
  const filename = `${report.metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports report metadata, executive brief and KPIs to CSV
 */
export function exportReportToCSV(report: Report): void {
  const lines: string[] = [
    `"REPORT: ${report.metadata.title}"`,
    `"DATASET: ${report.metadata.datasetName}"`,
    `"AUTHOR: ${report.metadata.authorName}"`,
    `"DATE: ${report.metadata.createdAt}"`,
    '',
    '"SECTION","METRIC / ITEM","VALUE","NOTES"',
  ];

  // Executive summary
  const execSec = report.sections.find((s) => s.type === 'executive_summary')?.content?.executiveSummary;
  if (execSec) {
    lines.push(`"Executive Summary","Headline","${execSec.headline.replace(/"/g, '""')}",""`);
    execSec.keyTakeaways.forEach((t, i) => {
      lines.push(`"Executive Summary","Takeaway #${i + 1}","${t.replace(/"/g, '""')}",""`);
    });
  }

  // KPIs
  const kpiSec = report.sections.find((s) => s.type === 'kpi_overview')?.content?.kpis;
  if (kpiSec) {
    kpiSec.forEach((k) => {
      lines.push(`"KPI Overview","${k.label}","${k.formattedValue}","Agg: ${k.aggregation}"`);
    });
  }

  // Anomalies
  const anomSec = report.sections.find((s) => s.type === 'anomaly_deep_dive')?.content?.anomalies;
  if (anomSec) {
    lines.push(`"Anomalies","Total Detected","${anomSec.totalDetected}","High Risk: ${anomSec.highRiskCount}"`);
  }

  // Forecast
  const fcSec = report.sections.find((s) => s.type === 'forecast_outlook')?.content?.forecast;
  if (fcSec) {
    lines.push(`"Forecast","Projected Growth","${fcSec.expectedGrowthPct}%","Model: ${fcSec.selectedModel}"`);
  }

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${report.metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports complete JSON snapshot of report
 */
export function exportReportToJSON(report: Report): void {
  const jsonContent = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${report.metadata.reportId}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers native browser print dialog formatted for print / PDF generation
 */
export function printReportPDF(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
