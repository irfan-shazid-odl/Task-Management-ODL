import { Project, Task } from '@/lib/types';

// Escape user-supplied text so it can't break the generated HTML markup.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value?: string | number | null): string {
  if (value === null || value === undefined) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function monthYear(value: number): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Earliest activity date: the min of all task dates and the project's start/creation date.
function getStartMs(tasks: Task[], project: Project): number | null {
  const dates = tasks
    .map(t => t.log_date || t.created_at)
    .filter(Boolean)
    .map(v => new Date(v as string).getTime())
    .filter(n => !isNaN(n));

  const startCandidate = project.start_date || project.created_at;
  if (startCandidate) {
    const s = new Date(startCandidate).getTime();
    if (!isNaN(s)) dates.push(s);
  }
  return dates.length ? Math.min(...dates) : null;
}

// Human-friendly span from the project's first activity to the report date.
function formatDuration(startMs: number | null, endMs: number): string {
  if (startMs === null) return '—';
  const days = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
  if (days < 14) return `~${days} Day${days === 1 ? '' : 's'}`;
  if (days < 60) {
    const weeks = Math.round(days / 7);
    return `~${weeks} Week${weeks === 1 ? '' : 's'}`;
  }
  const months = Math.round(days / 30);
  return `~${months} Month${months === 1 ? '' : 's'}`;
}

/**
 * Builds a printable progress report for a project and opens the browser print
 * dialog, letting the user save it as a PDF. No external dependency required.
 */
export function generateProjectReport(project: Project, tasks: Task[], preparedByName?: string): void {
  const totalBilling = tasks.reduce((sum, t) => sum + (t.total_billing_hours || 0), 0);
  const completedCount = tasks.filter(t => t.status === 'Complete').length;
  const inProgressCount = tasks.filter(t => t.status === 'Working').length;
  const onReviewCount = tasks.filter(t => t.status === 'On Review').length;

  const now = Date.now();
  const startMs = getStartMs(tasks, project);
  const duration = formatDuration(startMs, now);
  const preparedBy = (preparedByName && preparedByName.trim())
    || project.project_lead?.name || project.client_name || '—';

  const rangeStr = startMs === null
    ? monthYear(now)
    : (monthYear(startMs) === monthYear(now) ? monthYear(now) : `${monthYear(startMs)} – ${monthYear(now)}`);

  const reportDateLong = new Date(now).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportDateShort = formatDate(now);
  const startDateShort = formatDate(startMs);

  // Order newest → oldest by task date (falls back to creation date).
  const sortKey = (t: Task) => new Date(t.log_date || t.created_at || 0).getTime();
  const orderedTasks = [...tasks].sort((a, b) => sortKey(b) - sortKey(a));

  const rows = orderedTasks
    .map(task => {
      const date = formatDate(task.log_date || task.created_at);
      const desc = escapeHtml(task.description || '—');
      const status = escapeHtml(task.status || '—');
      const billing = (task.total_billing_hours || 0).toFixed(1);
      return `
        <tr>
          <td class="date">${date}</td>
          <td class="desc">${desc}</td>
          <td class="status">${status}</td>
          <td class="hours">${billing}h</td>
        </tr>`;
    })
    .join('');

  const emptyRow = `
    <tr>
      <td colspan="4" class="empty">No tasks for this project</td>
    </tr>`;

  const stat = (label: string, value: string) => `
    <div class="cell">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(project.name)} — Progress Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 40px;
    }

    h1.report-title {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -1px;
      margin: 0 0 4px;
      text-transform: uppercase;
    }
    h2.project-name { font-size: 19px; font-weight: 700; margin: 0 0 6px; }
    .report-meta {
      color: #64748b;
      font-size: 12px;
      padding-bottom: 14px;
      border-bottom: 1px solid #cbd5e1;
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #0f172a;
      padding-bottom: 8px;
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 18px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 36px;
    }
    .summary-grid .cell {
      background: #f8fafc;
      border: 1px solid #eef2f7;
      padding: 16px 20px;
    }
    .summary-grid .cell .label { color: #64748b; font-size: 12px; margin-bottom: 6px; }
    .summary-grid .cell .value { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 10px;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
      padding: 10px 12px;
    }
    th.hours, td.hours { text-align: right; }
    tbody td { padding: 11px 12px; vertical-align: top; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td.date { white-space: nowrap; color: #475569; }
    td.desc { width: 55%; }
    td.status { white-space: nowrap; color: #64748b; }
    td.hours { white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 500; }
    td.empty { text-align: center; color: #94a3b8; padding: 32px; }
    tfoot td {
      padding: 12px;
      font-weight: 700;
      border-top: 2px solid #cbd5e1;
    }
    tfoot .label { text-align: right; }
    tfoot .total { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }

    .page-footer {
      margin-top: 32px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }

    @media print {
      body { margin: 0; }
      @page { margin: 18mm; }
      tbody tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1 class="report-title">Project Progress Report</h1>
  <h2 class="project-name">${escapeHtml(project.name)}</h2>
  <div class="report-meta">
    ${escapeHtml(rangeStr)} &nbsp;|&nbsp; Prepared by: ${escapeHtml(preparedBy)} &nbsp;|&nbsp; Report Date: ${reportDateLong}
  </div>

  <div class="section-title">Project Summary</div>
  <div class="summary-grid">
    ${stat('Total Tasks', String(tasks.length))}
    ${stat('Completed', String(completedCount))}
    ${stat('In Progress', String(inProgressCount))}
    ${stat('On Review', String(onReviewCount))}
    ${stat('Total Logged Time', `${totalBilling.toFixed(1)}h`)}
    ${stat('Project Duration', duration)}
    ${stat('Start Date', startDateShort)}
    ${stat('Report Date', reportDateShort)}
  </div>

  <div class="section-title">Detailed Task Log</div>
  <table>
    <thead>
      <tr>
        <th class="date">Date</th>
        <th class="desc">Task Description</th>
        <th class="status">Status</th>
        <th class="hours">Logged Time</th>
      </tr>
    </thead>
    <tbody>
      ${tasks.length === 0 ? emptyRow : rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="label">Total Hours</td>
        <td class="total">${totalBilling.toFixed(1)}h</td>
      </tr>
    </tfoot>
  </table>

  <div class="page-footer">${escapeHtml(preparedBy)} &nbsp;|&nbsp; ${escapeHtml(project.name)}</div>

  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
