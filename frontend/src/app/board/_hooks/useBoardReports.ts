import { toast } from 'sonner';
import { Task } from '@/lib/types';

const REPORT_STATUS_LABEL: Record<string, string> = {
  'Todo': 'Todo ⏳',
  'Working': 'In Progress 🔄',
  'On Review': 'On Review 🕵️',
  'Complete': 'Completed ✅',
};

export function useBoardReports(
  tableTasks: Task[], 
  todaysActivity: Record<string, { working: number; billing: number }>, 
  getDisplayStatus: (t: Task) => string, viewMode: string, currentUser: any, teamMembers: any[], boardFilterMode: string, boardMonth: string, boardDate: string, setShowReportModal: (v: boolean) => void
) {
   const handleCopyTable = () => {
     const reportEl = document.querySelector('#activity-report-content');
     if (!reportEl) {
       toast.error('Report content not found.');
       return;
     }
 
     try {
       const blobHtml = new Blob([reportEl.innerHTML], { type: 'text/html' });
       const blobText = new Blob([reportEl.textContent || ''], { type: 'text/plain' });
       
       const data = [new ClipboardItem({
         'text/html': blobHtml,
         'text/plain': blobText
       })];
 
       navigator.clipboard.write(data).then(() => {
         toast.success('Activity report copied with table formatting!');
       });
     } catch (err) {
       const text = reportEl.textContent || '';
       navigator.clipboard.writeText(text).then(() => {
         toast.success('Copied as plain text (Rich formatting not supported here).');
       });
     }
   };
 
   const buildDailyReport = (): string => {
     const reportName =
       viewMode === 'all'
         ? 'All Members'
         : viewMode === 'mine'
         ? currentUser?.name || ''
         : teamMembers?.find(m => m.id === viewMode)?.name || '';
 
     const reportDate =
       boardFilterMode === 'month'
         ? new Date(boardMonth + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
         : new Date(boardDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
 
     const grouped = tableTasks.reduce((acc, t) => {
       const pName = t.project?.name || 'Unassigned Project';
       if (!acc[pName]) acc[pName] = [];
       acc[pName].push(t);
       return acc;
     }, {} as Record<string, Task[]>);
 
     const lines: string[] = ['*DAILY TASK REPORT*'];
     if (reportName) lines.push(`*${reportName}*`);
     lines.push(`Date: ${reportDate}`);
     lines.push(`Total Tasks: ${tableTasks.length}`);
     lines.push('');
 
     Object.entries(grouped).forEach(([projectName, projectTasks]) => {
       lines.push(`🔵 *${projectName}*`);
       projectTasks.forEach((t, i) => {
         const ds = getDisplayStatus(t);
         const status = REPORT_STATUS_LABEL[ds] || ds || 'Todo';
         const estimate = t.estimated_time != null ? ` - Est. ${t.estimated_time}h` : '';
         lines.push(`${i + 1}. ${t.description}${estimate} ( ${status} )`);
       });
       lines.push('');
     });
 
     return lines.join('\n').trimEnd();
   };
 
   const openReportModal = () => {
     if (tableTasks.length === 0) {
       toast.error('No tasks to report for this date.');
       return;
     }
     setShowReportModal(true);
   };
 
   const handleCopyDailyReport = () => {
     navigator.clipboard.writeText(buildDailyReport()).then(
       () => toast.success('Daily task report copied!'),
       () => toast.error('Failed to copy report.'),
     );
   };
 
   return { openReportModal, buildDailyReport, handleCopyTable, handleCopyDailyReport };
}



