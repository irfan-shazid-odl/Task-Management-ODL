import type { TaskReportRow } from '../types';

// Builds the "All Projects Summary" workbook: a top summary table of every
// project's total billing, then one detail block per project listing its
// tasks by date.
//
// "Billing Hours" here is the report's Logged Time — the same number the
// Reports table shows in its Logged Time column (TaskReportRow.loggedTime,
// which reportData.ts sums from time_logs.billing_hours). Nothing is
// recomputed from a different source, so the workbook and the on-screen
// table can never disagree.
//
// exceljs is imported dynamically by the caller so its ~1MB never lands in
// the main bundle — only someone who actually clicks the button downloads it.

const NAVY = 'FF1F3864';
const GREEN = 'FF00E000';
const GREY = 'FFEDEDED';
const LIGHT_BLUE = 'FFDDE5F5';

export interface ProjectSummaryInput {
  rows: TaskReportRow[];
  dateFrom: string;
  dateTo: string;
}

/**
 * Group rows by project, preserving first-seen order.
 *
 * No fallback label of its own: buildTaskReportRows already substitutes
 * '— No Project —' for a task with no project, so the workbook shows exactly
 * the same project name the table does rather than inventing a second wording
 * for the same case.
 */
function groupByProject(rows: TaskReportRow[]) {
  const groups = new Map<string, TaskReportRow[]>();
  for (const r of rows) {
    const bucket = groups.get(r.projectName);
    if (bucket) bucket.push(r);
    else groups.set(r.projectName, [r]);
  }
  return groups;
}

/** "Aug 17, 2026" from a YYYY-MM-DD / ISO date, matching the sample sheet. */
function formatDate(logDate: string | null): string {
  if (!logDate) return '';
  const d = new Date(logDate.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fileDateLabel(dateFrom: string, dateTo: string) {
  return dateFrom === dateTo ? dateFrom : `${dateFrom}_to_${dateTo}`;
}

export function projectSummaryFileName(dateFrom: string, dateTo: string) {
  return `project-summary-${fileDateLabel(dateFrom, dateTo)}.xlsx`;
}

export async function buildProjectSummaryWorkbook({ rows, dateFrom, dateTo }: ProjectSummaryInput) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  const ws = wb.addWorksheet('Project Summary');

  ws.columns = [
    { width: 22 },
    { width: 62 },
    { width: 18 },
  ];

  const groups = groupByProject(rows);
  const totalsByProject = new Map<string, number>();
  for (const [name, list] of groups) {
    totalsByProject.set(name, list.reduce((sum, r) => sum + (r.loggedTime || 0), 0));
  }

  const fill = (cell: import('exceljs').Cell, argb: string) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
  };
  const bordered = (cell: import('exceljs').Cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
      left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
      right: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    };
  };

  // ── Title ────────────────────────────────────────────────────────────────
  const title = ws.addRow(['All Projects Summary']);
  title.getCell(1).font = { bold: true, size: 12 };
  ws.mergeCells(title.number, 1, title.number, 3);

  // Date range the figures cover, so a saved file is self-describing.
  const range = ws.addRow([
    dateFrom === dateTo ? `Report Date: ${dateFrom}` : `Report Range: ${dateFrom} to ${dateTo}`,
  ]);
  range.getCell(1).font = { italic: true, size: 10, color: { argb: 'FF666666' } };
  ws.mergeCells(range.number, 1, range.number, 3);

  // ── Summary table ────────────────────────────────────────────────────────
  const head = ws.addRow(['SL No.', 'Project', 'Total Billing']);
  head.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    fill(cell, NAVY);
    bordered(cell);
  });
  head.getCell(3).alignment = { horizontal: 'right' };

  let sl = 0;
  let grandTotal = 0;
  for (const [name, total] of totalsByProject) {
    sl += 1;
    grandTotal += total;
    const row = ws.addRow([sl, name, total]);
    row.getCell(3).numFmt = '0.00';
    row.eachCell(bordered);
  }

  const grand = ws.addRow(['Grand Total', '', grandTotal]);
  grand.eachCell((cell) => {
    cell.font = { bold: true };
    fill(cell, GREY);
    bordered(cell);
  });
  grand.getCell(3).numFmt = '0.00';
  ws.mergeCells(grand.number, 1, grand.number, 2);

  // ── One detail block per project ─────────────────────────────────────────
  for (const [name, list] of groups) {
    ws.addRow([]);

    const banner = ws.addRow([name]);
    banner.getCell(1).font = { bold: true };
    ws.mergeCells(banner.number, 1, banner.number, 3);
    for (let c = 1; c <= 3; c += 1) fill(banner.getCell(c), GREEN);

    const detailHead = ws.addRow(['Date', 'Task Description', 'Billing Hours']);
    detailHead.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      fill(cell, NAVY);
      bordered(cell);
    });
    detailHead.getCell(3).alignment = { horizontal: 'right' };

    // Oldest first, matching the sample sheet's chronological detail blocks.
    const sorted = [...list].sort((a, b) => (a.logDate || '').localeCompare(b.logDate || ''));
    for (const r of sorted) {
      const row = ws.addRow([formatDate(r.logDate), r.description, r.loggedTime || 0]);
      row.getCell(3).numFmt = '0.00';
      row.getCell(2).alignment = { wrapText: true };
      row.eachCell(bordered);
    }

    const totalRow = ws.addRow(['Total Hours', '', totalsByProject.get(name) ?? 0]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      fill(cell, LIGHT_BLUE);
      bordered(cell);
    });
    totalRow.getCell(3).numFmt = '0.00';
    ws.mergeCells(totalRow.number, 1, totalRow.number, 2);
  }

  return wb;
}

/** Build the workbook and hand it to the browser as a download. */
export async function downloadProjectSummary(input: ProjectSummaryInput) {
  const wb = await buildProjectSummaryWorkbook(input);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = projectSummaryFileName(input.dateFrom, input.dateTo);
  link.click();
  // Revoke on the next tick so the click has already been dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
