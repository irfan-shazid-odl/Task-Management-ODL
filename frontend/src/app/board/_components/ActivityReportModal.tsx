'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { X, Copy } from 'lucide-react';

interface ActivityReportModalProps {
  show: boolean;
  onClose: () => void;
  onCopyTable: () => void;
  tasks: Task[];
  todaysActivity: Record<string, { working: number; billing: number }>;
  getDisplayStatus: (t: Task) => string;
}

export default function ActivityReportModal({
  show,
  onClose,
  onCopyTable,
  tasks,
  todaysActivity,
  getDisplayStatus,
}: ActivityReportModalProps) {
  if (!show) return null;

  const formatReportHours = (h: number) => {
    if (h === 0) return '0 Minutes';
    if (h < 1) return `${Math.round(h * 60)} Minutes`;
    return `${h % 1 === 0 ? h : h.toFixed(1)} ${h === 1 ? 'Hour' : 'Hours'}`;
  };

  const reportTasks = tasks.filter(t => (todaysActivity[t.id]?.working || 0) > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
           <div>
             <h3 className="text-lg font-bold text-slate-900">Download Activity</h3>
             <p className="text-xs text-slate-500 font-medium">Daily Task Summary Report</p>
           </div>
           <div className="flex items-center gap-2">
             <button
               onClick={onCopyTable}
               className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-200 active:scale-[0.98]"
             >
               <Copy className="w-4 h-4" /> Copy Activity
             </button>
             <button
               onClick={onClose}
               className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-white selection:bg-violet-100 selection:text-violet-900" id="activity-report-content">
          {/* Report Document Style */}
          <div className="max-w-3xl mx-auto space-y-8 print:p-0">
            
            {/* Greeting Section */}
            <div className="space-y-4">
              <p className="text-[17px] text-slate-800 font-medium">Dear Sir,</p>
              <p className="text-[17px] text-slate-800 font-medium">Good Day to you.</p>
              <div className="h-2" />
              <p className="text-[17px] text-slate-800 leading-relaxed">
                Please find below a summary of my daily tasks for your review and records. 
                The report is structured by task priority and progress status for clarity.
              </p>
            </div>

            {/* Report Table */}
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-[#2B3B6D] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold border-r border-slate-400/30 text-sm uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left font-bold border-r border-slate-400/30 text-sm uppercase tracking-wider">Project name</th>
                    <th className="px-4 py-3 text-left font-bold border-r border-slate-400/30 text-sm uppercase tracking-wider">Task Description</th>
                    <th className="px-4 py-3 text-left font-bold border-r border-slate-400/30 text-sm uppercase tracking-wider">Real Hour Today</th>
                    <th className="px-4 py-3 text-left font-bold text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {reportTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">No activity recorded for the selected date.</td>
                    </tr>
                  ) : (
                    reportTasks.map((t, i) => {
                      const hours = todaysActivity[t.id]?.working || 0;
                      const reportStatus = getDisplayStatus(t);
                      const mappedStatus = 
                        reportStatus === 'Working' ? 'In_Progress' :
                        reportStatus === 'On Review' ? 'In review' :
                        reportStatus === 'Todo' ? 'In Progress' :
                        reportStatus === 'Complete' ? 'Completed' : reportStatus;

                      return (
                        <tr key={t.id} className="text-[15px] hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 border-r border-slate-300 text-center font-bold text-slate-900">{i + 1}</td>
                          <td className="px-4 py-3.5 border-r border-slate-300 font-bold text-slate-900 truncate max-w-[150px]">{t.project?.name || 'N/A'}</td>
                          <td className="px-4 py-3.5 border-r border-slate-300 text-slate-700 leading-snug">{t.description}</td>
                          <td className="px-4 py-3.5 border-r border-slate-300 font-medium text-slate-900">{formatReportHours(hours)}</td>
                          <td className="px-4 py-3.5 font-medium text-slate-700">{mappedStatus}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Section */}
            <div className="pt-4 space-y-4">
              <p className="text-[17px] text-slate-800 font-medium">Thank you for your continued support.</p>
              <p className="text-[17px] text-slate-800 font-medium mt-4">Kind Regards,</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
           <button
             onClick={onClose}
             className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-200"
           >
             Close Report
           </button>
        </div>
      </div>
    </div>
  );
}
