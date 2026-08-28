import React, { memo } from 'react';
import { Building2, Calendar, ClipboardList, Clock, FolderOpen, Users, Wallet } from 'lucide-react';
import { Project, TeamMember } from '@/lib/types';

type Props = {
  project: Project;
  taskCount: number;
  workingHours: number;
  billingHours: number;
  statusColor: (status: string) => string;
};

const ProjectHeaderCard = memo(function ProjectHeaderCard({ project, taskCount, workingHours, billingHours, statusColor }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
            <FolderOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor(project.status || 'Active')}`}>
                {project.status || 'Active'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {project.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Building2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Client</p>
            <p className="text-sm text-slate-900 font-medium">{project.client_name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Users className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Lead</p>
            <p className="text-sm text-slate-900 font-medium">{(project.project_lead as TeamMember)?.name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Started</p>
            <p className="text-sm text-slate-900 font-medium">
              {project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <ClipboardList className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tasks</p>
            <p className="text-sm text-slate-900 font-medium">{taskCount} total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Clock className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Working</p>
            <p className="text-sm text-slate-900 font-medium">{workingHours.toFixed(1)}h</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Wallet className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Logged Time</p>
            <p className="text-sm text-slate-900 font-medium">{billingHours.toFixed(1)}h</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProjectHeaderCard;
