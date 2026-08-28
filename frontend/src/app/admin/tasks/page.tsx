'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { Zap, Plus } from 'lucide-react';
import ProjectModal from '@/components/ProjectModal';
import { useAdminTasksState } from './_hooks/useAdminTasksState';
import AdminTaskForm from './_components/AdminTaskForm';
import AdminTaskTable from './_components/AdminTaskTable';
import AdminTaskTableSkeleton from './_components/AdminTaskTableSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setShowTaskForm, resetForm } from '@/store/slices/adminTaskFormSlice';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

export default function AdminTasksPage() {
  const { currentUser, loading: userLoading } = useUser();
  const router = useRouter();
  const dispatch = useDispatch();
  const showTaskForm = useSelector((state: RootState) => state.adminTaskForm.showTaskForm);

  useEffect(() => {
    if (!userLoading && currentUser?.role === 'Member') {
      router.replace('/board');
    }
  }, [currentUser, userLoading, router]);

  if (currentUser && currentUser.role === 'Member') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center animate-pulse">
          <Zap className="w-12 h-12 text-violet-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Redirecting...</h2>
          <p className="text-slate-500 text-sm">Task Manager is restricted for Members.</p>
        </div>
      </div>
    );
  }

  const state = useAdminTasksState();
  const {
    teamMembers,
    projects,
    tasks,
    loading,
    page,
    setPage,
    totalTasks,
    totalPages,
    showModal,
    setShowModal,
    editingProject,
    editingWorkingHoursTaskId,
    editingWorkingHoursValue,
    editingBillingHoursTaskId,
    editingBillingHoursValue,
    editingHoursDate,
    setEditingHoursDate,
    taskWorkingHours,
    taskBillingHours,
    canEditHours,
    setEditingWorkingHoursTaskId,
    setEditingWorkingHoursValue,
    setEditingBillingHoursTaskId,
    setEditingBillingHoursValue,
    saveWorkingHours,
    saveBillingHours,
    fetchData,
    submitTask,
    PAGE_SIZE,
  } = state;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <svg className="w-7 h-7 text-violet-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
            Task <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage all tasks across projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (showTaskForm) { 
                dispatch(setShowTaskForm(false)); 
              } else {
                dispatch(resetForm());
                dispatch(setShowTaskForm(true));
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm text-white font-medium
              hover:from-violet-500 hover:to-cyan-500 transition-all duration-200 shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      <ProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchData}
        editingProject={editingProject}
      />

      <AdminTaskForm
        onSubmit={submitTask}
        projects={projects}
        teamMembers={teamMembers}
      />

      {loading ? (
        <AdminTaskTableSkeleton />
      ) : (
        <AdminTaskTable
          tasks={tasks}
          teamMembers={teamMembers}
          canEditHours={!!canEditHours}
          totalTasks={totalTasks}
          page={page}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={loading}
          editingWorkingHoursTaskId={editingWorkingHoursTaskId}
          editingWorkingHoursValue={editingWorkingHoursValue}
          onEditWorkingHoursStart={(taskId, val) => { setEditingWorkingHoursTaskId(taskId); setEditingWorkingHoursValue(String(val)); setEditingHoursDate(todayIsoDate()); }}
          onEditWorkingHoursValueChange={setEditingWorkingHoursValue}
          onSaveWorkingHours={async (taskId) => {
            const h = parseFloat(editingWorkingHoursValue);
            if (!isNaN(h) && h >= 0) await saveWorkingHours(taskId, h, editingHoursDate);
            setEditingWorkingHoursTaskId(null);
          }}
          onCancelEditWorkingHours={() => setEditingWorkingHoursTaskId(null)}
          editingBillingHoursTaskId={editingBillingHoursTaskId}
          editingBillingHoursValue={editingBillingHoursValue}
          onEditBillingHoursStart={(taskId, val) => { setEditingBillingHoursTaskId(taskId); setEditingBillingHoursValue(String(val)); setEditingHoursDate(todayIsoDate()); }}
          onEditBillingHoursValueChange={setEditingBillingHoursValue}
          onSaveBillingHours={async (taskId) => {
            const h = parseFloat(editingBillingHoursValue);
            if (!isNaN(h) && h >= 0) await saveBillingHours(taskId, h, editingHoursDate);
            setEditingBillingHoursTaskId(null);
          }}
          onCancelEditBillingHours={() => setEditingBillingHoursTaskId(null)}
          editingHoursDate={editingHoursDate}
          onEditingHoursDateChange={setEditingHoursDate}
          taskWorkingHours={taskWorkingHours}
          taskBillingHours={taskBillingHours}
        />
      )}
    </div>
  );
}

