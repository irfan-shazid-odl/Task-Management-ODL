'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, subscribeToChanges } from '@/lib/api';
import { useUser } from '@/components/UserContext';
import { Project, Task, ProjectCredential, ProjectDocument, TaskStatus, TaskPriority, TeamMember } from '@/lib/types';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DocumentModal from '@/components/project-detail/DocumentModal';
import CredentialModal from '@/components/project-detail/CredentialModal';
import ClaimTaskModal from '@/components/project-detail/ClaimTaskModal';
import ActivityLog from '@/components/project-detail/ActivityLog';
import TaskFormModal from '@/components/project-detail/TaskFormModal';
import TasksTable from '@/components/project-detail/TasksTable';
import CredentialsCard from '@/components/project-detail/CredentialsCard';
import DocumentsCard from '@/components/project-detail/DocumentsCard';
import LoadingSkeleton from '@/components/project-detail/LoadingSkeleton';
import ProjectHeaderCard from '@/components/project-detail/ProjectHeaderCard';
import GenerateReportModal from '@/components/project-detail/GenerateReportModal';
import { generateProjectReport } from '@/lib/generateProjectReport';
import { ArrowLeft, Briefcase, FileDown } from 'lucide-react';

import { useProjectState } from './_hooks/useProjectState';
import { useProjectCreds } from './_hooks/useProjectCreds';
import { useProjectDocs } from './_hooks/useProjectDocs';


export default function ProjectDetailPage() {
  const {
    today,
    todayStr,
    lastMonth,
    lastMonthStr,
    assignTeamMember,
    unassignTeamMember,
    handleTaskSubmit,
    handleSaveHours,
    openEditTask,
    togglePassword,
    copyToClipboard,
    fetchData,
    project,
    tasks,
    credentials,
    documents,
    loading,
    userLoading,
    tasksByStatus,
    isAdmin,
    isProjectLead,
    isAssigned,
    hasProjectAccess,
    docTypeColor,
    statusColor,
    setProject,
    setTasks,
    setCredentials,
    setDocuments,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    activities,
    setActivities,
    setLoading,
    rangeInitialized,
    setRangeInitialized,
    showReportModal,
    setShowReportModal,
    isSubmitting,
    setIsSubmitting,
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    setIsDeleting,
    assigningTask,
    setAssigningTask,
    showTaskModal,
    setShowTaskModal,
    showClaimModal,
    setShowClaimModal,
    claimingTaskId,
    setClaimingTaskId,
    setEditingTaskId,
    taskDescription,
    setTaskDescription,
    taskStatus,
    setTaskStatus,
    taskPriority,
    setTaskPriority,
    taskDeadline,
    setTaskDeadline,
    taskAssignees,
    setTaskAssignees,
    taskRefDocId,
    setTaskRefDocId,
    taskCategory,
    setTaskCategory,
    taskEstimatedTime,
    setTaskEstimatedTime,
    editingHoursTaskId,
    setEditingHoursTaskId,
    editingWorkingHours,
    setEditingWorkingHours,
    editingBillingHours,
    setEditingBillingHours,
    editingHoursDate,
    setEditingHoursDate,
    taskLogDate,
    setTaskLogDate,
    visiblePasswords,
    setVisiblePasswords,
    copiedId,
    setCopiedId,
    currentUser,
    teamMembers,
    router,
    projectId,
    handleDeleteTask,
    editingTaskId,
  } = useProjectState();

  const {
    showCredModal, setShowCredModal,
    isSubmitting: isCredSubmitting,
    editingCredId, setEditingCredId,
    credLabel, setCredLabel,
    credUrl, setCredUrl,
    credUser, setCredUser,
    credPass, setCredPass,
    credNotes, setCredNotes,
    handleCredSubmit,
    isDeleting: isCredDeleting,
    handleDeleteCredential
  } = useProjectCreds(projectId, false, currentUser, credentials, setCredentials);
  
  const {
    showDocModal, setShowDocModal,
    isSubmitting: isDocSubmitting,
    editingDocId, setEditingDocId,
    docTitle, setDocTitle,
    docUrl, setDocUrl,
    docType, setDocType,
    handleDocSubmit,
    isDeleting: isDocDeleting,
    handleDeleteDocument
  } = useProjectDocs(projectId, false, currentUser, documents, setDocuments);
  
  if (loading || !project) {
    return <LoadingSkeleton />;
  }

  // Earliest selectable date = project creation date; latest = today.
  const projectCreatedStr = (project as any).created_at
    ? new Date((project as any).created_at).toLocaleDateString('en-CA')
    : ((project as any).start_date || '');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back + Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Project
        </button>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10 animate-in fade-in slide-in-from-right-4 duration-500">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
            title="Generate a PDF report of this project's tasks"
          >
            <FileDown className="w-4 h-4" />
            Generate Report
          </button>
          <input
            type="date"
            value={startDate}
            min={projectCreatedStr || undefined}
            max={endDate || todayStr}
            onChange={(e) => setStartDate(e.target.value)}
            title="From — earliest is the project creation date"
            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700
              focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
          />
          <span className="text-slate-400 font-medium">to</span>
          <input
            type="date"
            value={endDate}
            min={startDate || projectCreatedStr || undefined}
            max={todayStr}
            onChange={(e) => setEndDate(e.target.value)}
            title="To — latest is today"
            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700
              focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
          />
        </div>
      </div>

      <ProjectHeaderCard
        project={project}
        taskCount={tasks.length}
        workingHours={tasks.reduce((s, t) => s + (t.total_logged_hours || 0), 0)}
        billingHours={tasks.reduce((s, t) => s + (t.total_billing_hours || 0), 0)}
        statusColor={statusColor}
      />

      {/* Brief */}
      {project.brief && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-500" />
            Project Brief
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{project.brief}</p>
        </div>
      )}

      <div className={`grid grid-cols-1 ${hasProjectAccess ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
        {hasProjectAccess && (
          <CredentialsCard
            credentials={credentials}
            visiblePasswords={visiblePasswords}
            copiedId={copiedId}
            onTogglePassword={togglePassword}
            onCopy={copyToClipboard}
            onAdd={() => {
              setEditingCredId(null);
              setCredLabel(''); setCredUrl(''); setCredUser(''); setCredPass(''); setCredNotes('');
              setShowCredModal(true);
            }}
            onEdit={(cred) => {
              setEditingCredId(cred.id);
              setCredLabel(cred.label);
              setCredUrl(cred.url || '');
              setCredUser(cred.username || '');
              setCredPass(cred.password || '');
              setCredNotes(cred.notes || '');
              setShowCredModal(true);
            }}
            onRequestDelete={(id) => setDeleteConfirm({ id, type: 'credential' })}
          />
        )}

        <DocumentsCard
          documents={documents}
          canEdit={!!hasProjectAccess}
          docTypeColor={docTypeColor}
          onAdd={() => {
            setEditingDocId(null);
            setDocTitle(''); setDocUrl(''); setDocType('Link');
            setShowDocModal(true);
          }}
          onEdit={(doc) => {
            setEditingDocId(doc.id);
            setDocTitle(doc.title);
            setDocUrl(doc.url);
            setDocType(doc.doc_type);
            setShowDocModal(true);
          }}
          onRequestDelete={(id) => setDeleteConfirm({ id, type: 'document' })}
        />
      </div>

      <TasksTable
        tasks={tasks}
        currentUser={currentUser}
        teamMembers={teamMembers}
        editingHoursTaskId={editingHoursTaskId}
        setEditingHoursTaskId={setEditingHoursTaskId}
        editingWorkingHours={editingWorkingHours}
        setEditingWorkingHours={setEditingWorkingHours}
        editingBillingHours={editingBillingHours}
        setEditingBillingHours={setEditingBillingHours}
        editingHoursDate={editingHoursDate}
        setEditingHoursDate={setEditingHoursDate}
        assigningTask={assigningTask}
        setAssigningTask={setAssigningTask}
        onSaveHours={handleSaveHours}
        onAssign={assignTeamMember}
        onUnassign={unassignTeamMember}
        onEdit={openEditTask}
        onRequestDelete={(id) => setDeleteConfirm({ id, type: 'task' })}
        onCreate={() => {
          setEditingTaskId(null);
          setTaskDescription(''); setTaskStatus('Todo'); setTaskPriority('Low'); setTaskDeadline(new Date().toLocaleDateString('en-CA'));
          setTaskAssignees([]);
          setTaskRefDocId('');
          setShowTaskModal(true);
        }}
        onOpenClaim={() => setShowClaimModal(true)}
      />
      <GenerateReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        defaultName={currentUser?.name || ''}
        onGenerate={(preparedBy) => {
          generateProjectReport(project, tasks, preparedBy);
          setShowReportModal(false);
        }}
      />

      <DocumentModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        isSubmitting={isSubmitting || isDocSubmitting || isCredSubmitting}
        editingDocId={editingDocId}
        title={docTitle}
        setTitle={setDocTitle}
        url={docUrl}
        setUrl={setDocUrl}
        docType={docType}
        setDocType={setDocType}
        onSubmit={handleDocSubmit}
      />

      <ActivityLog activities={activities} projectId={projectId} />

      <CredentialModal
        isOpen={showCredModal}
        onClose={() => setShowCredModal(false)}
        isSubmitting={isSubmitting || isDocSubmitting || isCredSubmitting}
        editingCredId={editingCredId}
        label={credLabel}
        setLabel={setCredLabel}
        url={credUrl}
        setUrl={setCredUrl}
        username={credUser}
        setUsername={setCredUser}
        password={credPass}
        setPassword={setCredPass}
        notes={credNotes}
        setNotes={setCredNotes}
        onSubmit={handleCredSubmit}
      />

      <TaskFormModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        isSubmitting={isSubmitting || isDocSubmitting || isCredSubmitting}
        editingTaskId={editingTaskId}
        description={taskDescription}
        setDescription={setTaskDescription}
        status={taskStatus}
        setStatus={setTaskStatus}
        priority={taskPriority}
        setPriority={setTaskPriority}
        deadline={taskDeadline}
        setDeadline={setTaskDeadline}
        logDate={taskLogDate}
        setLogDate={setTaskLogDate}
        refDocId={taskRefDocId}
        setRefDocId={setTaskRefDocId}
        category={taskCategory}
        setCategory={setTaskCategory}
        estimatedTime={taskEstimatedTime}
        setEstimatedTime={setTaskEstimatedTime}
        assignees={taskAssignees}
        setAssignees={setTaskAssignees}
        documents={documents}
        teamMembers={teamMembers}
        onSubmit={handleTaskSubmit}
      />

      {/* Standardized Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isDeleting={isDeleting || isDocDeleting || isCredDeleting}
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.type === 'credential') {
            handleDeleteCredential(deleteConfirm.id);
          } else if (deleteConfirm.type === 'document') {
            handleDeleteDocument(deleteConfirm.id);
          } else {
            handleDeleteTask(deleteConfirm.id);
          }
        }}
        title={`Delete ${deleteConfirm?.type === 'credential' ? 'Credential' : deleteConfirm?.type === 'document' ? 'Document' : 'Task'}?`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type || 'item'}? This action cannot be undone.`}
        confirmText="Permanently Delete"
      />

      {currentUser && (
        <ClaimTaskModal
          isOpen={showClaimModal}
          onClose={() => { setShowClaimModal(false); setClaimingTaskId(null); }}
          tasks={tasks}
          currentUserId={currentUser.id}
          claimingTaskId={claimingTaskId}
          onClaim={async (taskId) => {
            setClaimingTaskId(taskId);
            await assignTeamMember(taskId, currentUser.id);
            setClaimingTaskId(null);
          }}
        />
      )}
    </div>
  );
}

