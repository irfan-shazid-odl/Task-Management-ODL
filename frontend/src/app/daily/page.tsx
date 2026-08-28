'use client';

import React, { useCallback, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { useUser } from '@/components/UserContext';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateTaskGraph } from '@/hooks/queries/useTasks';
import { useDailyTasks } from '@/features/daily/lib/useDailyTasks';
import DailyAgenda from '@/features/daily/components/DailyAgenda';
import NewTaskModal from '@/features/daily/components/NewTaskModal';

export default function DailyPlannerPage() {
  const { currentUser, teamMembers } = useUser();
  const qc = useQueryClient();
  const { tasks, isLoading } = useDailyTasks();

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // TaskCard status/hour edits should re-pull the whole task graph, matching the
  // old subscribeToChanges refresh.
  const refresh = useCallback(() => invalidateTaskGraph(qc), [qc]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          Loading agenda...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-violet-600" />
            Daily Planner
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Your active tasks, organized by deadline. Focus on what is due today.
          </p>
        </div>
        {currentUser && currentUser.role !== 'Member' && (
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-md shadow-violet-200 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        )}
      </div>

      {/* Task sections */}
      <DailyAgenda tasks={tasks} onRefresh={refresh} />

      {/* New Task Modal */}
      <NewTaskModal
        open={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        currentUser={currentUser}
        teamMembers={teamMembers}
      />
    </div>
  );
}
