'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, subscribeToChanges } from '@/lib/api';
import { useUser } from '@/components/UserContext';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Project } from '@/lib/types';
import ProjectModal from '@/components/ProjectModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { Skeleton } from '@/components/Skeleton';

import ProjectsToolbar from './_components/ProjectsToolbar';
import ProjectTable from './_components/ProjectTable';

export default function ProjectsPage() {
  const { loading: userLoading, currentUser } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'custom' | 'name' | 'date'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Total hours per project
  const [projectHours, setProjectHours] = useState<Record<string, { working: number; billing: number }>>({});
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [editingMetric, setEditingMetric] = useState<'working' | 'billing' | null>(null);
  const [editingHoursValue, setEditingHoursValue] = useState('');
  const canEditHours = currentUser && ['super-admin', 'Admin', 'Lead'].includes(currentUser.role);

  // Status editing (admins / managers only)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const canEditStatus = currentUser?.role !== 'Member';

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [projData, statsData] = await Promise.all([
        api.projects.list({ include: 'lead,client', orderBy: 'sort_order', order: 'asc' }),
        api.stats.projects(),
      ]);

      let filteredProjects = projData || [];
      if (currentUser?.role === 'Member') {
        const myAssignments = await api.taskAssignments.list({ memberId: currentUser.id });
        if (myAssignments && myAssignments.length > 0) {
          const myTaskIds = myAssignments.map((a: any) => a.task_id);
          const myTasks = await api.tasks.list({ ids: myTaskIds });
          const myProjectIds = new Set((myTasks || []).map((t: any) => t.project_id));
          filteredProjects = filteredProjects.filter((p: any) => myProjectIds.has(p.id));
        } else {
          filteredProjects = [];
        }
      }
      setProjects(filteredProjects as any);
      setProjectHours(statsData);
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!userLoading) fetchData();
  }, [userLoading, fetchData]);

  useEffect(() => {
    if (userLoading) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fetchData(true), 500);
    };
    const unsub = subscribeToChanges(debouncedFetch);
    return () => { if (t) clearTimeout(t); unsub(); };
  }, [userLoading, fetchData]);

  // ── Save hours ─────────────────────────────────────────────────────────────
  const saveProjectMetric = async (projectId: string, newValue: number, type: 'working' | 'billing') => {
    if (newValue < 0 || !currentUser) return;
    const currentWorking = projectHours[projectId]?.working || 0;
    const currentBilling = projectHours[projectId]?.billing || 0;
    const finalWorking = type === 'working' ? newValue : currentWorking;
    const finalBilling = type === 'billing' ? newValue : currentBilling;

    if (finalBilling > finalWorking) {
      toast.error('Logged time cannot be more than working hours.');
      return;
    }

    try {
      await api.projects.overrideHours(projectId, {
        hours_logged: finalWorking,
        billing_hours: finalBilling,
        log_date: new Date().toISOString().slice(0, 10),
      });
    } catch (err: any) {
      toast.error('Failed to save hours: ' + err.message);
      return;
    }

    setProjectHours(prev => ({ ...prev, [projectId]: { working: finalWorking, billing: finalBilling } }));
    toast.success(`${type === 'billing' ? 'Logged time' : 'Working hours'} updated successfully`);
    setEditingHoursId(null);
    setEditingMetric(null);
  };

  // ── Change status ──────────────────────────────────────────────────────────
  const saveProjectStatus = async (projectId: string, newStatus: 'Active' | 'Paused' | 'Completed') => {
    setEditingStatusId(null);
    const previous = projects;
    setProjects(ps => ps.map(p => (p.id === projectId ? ({ ...p, status: newStatus } as Project) : p)));
    try {
      await api.projects.update(projectId, { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
      setProjects(previous);
    }
  };

  // ── Drag & Drop Reordering ───────────────────────────────────────────────
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (search || sortBy !== 'custom' || sortDir !== 'asc') return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return; }

    const draggedIndex = projects.findIndex(p => p.id === draggedId);
    const targetIndex = projects.findIndex(p => p.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newProjects = [...projects];
    const [draggedProject] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, draggedProject);

    const projectsWithNewOrder = newProjects.map((p, idx) => ({ ...p, sort_order: idx + 1 }));
    setProjects(projectsWithNewOrder);
    setDraggedId(null);

    try {
      const updates = projectsWithNewOrder.map(p => ({ id: p.id, sort_order: p.sort_order }));
      await api.projects.reorder(updates);
      toast.success('Project order saved');
    } catch (err: any) {
      toast.error('Failed to save order: ' + err.message);
      fetchData();
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openAdd = () => { setEditingProject(null); setShowModal(true); };
  const openEdit = (p: Project) => { setEditingProject(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingProject(null); };

  const openDeleteModal = (p: Project) => { setProjectToDelete(p); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await api.projects.remove(projectToDelete.id);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      toast.success('Project deleted successfully.');
      setDeleteModalOpen(false);
    } catch (error: any) {
      toast.error('Delete failed: ' + error.message);
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const filteredProjects = projects
    .filter(p =>
      (statusFilter === 'All' || p.status === statusFilter) &&
      (categoryFilter === 'All' || p.category === categoryFilter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p as any).client?.name?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'custom') comparison = (a.sort_order || 0) - (b.sort_order || 0);
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'date') comparison = (a.start_date || '').localeCompare(b.start_date || '');
      return sortDir === 'asc' ? comparison : -comparison;
    });

  const isSuperAdminOrLead = currentUser?.role !== 'Member';
  const colSpan = isSuperAdminOrLead ? 10 : 8;

  if (loading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div><Skeleton className="h-9 w-48 mb-2" /><Skeleton className="h-4 w-96" /></div>
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Skeleton className="h-10 w-full sm:max-w-md rounded-xl" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {[...Array(colSpan)].map((_, i) => (<th key={i} className="px-6 py-4"><Skeleton className="h-3 w-16" /></th>))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(colSpan)].map((__, j) => (<td key={j} className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor and manage all active client projects and internal initiatives</p>
        </div>
        {isSuperAdminOrLead && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-violet-200 active:scale-95 shrink-0">
            <Plus className="w-5 h-5" /> New Project
          </button>
        )}
      </div>

      <ProjectsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        statusFilterOpen={statusFilterOpen}
        onStatusFilterToggle={() => { setStatusFilterOpen(!statusFilterOpen); setCategoryFilterOpen(false); }}
        onStatusFilterSelect={(val) => { setStatusFilter(val); setStatusFilterOpen(false); }}
        categoryFilter={categoryFilter}
        categoryFilterOpen={categoryFilterOpen}
        onCategoryFilterToggle={() => { setCategoryFilterOpen(!categoryFilterOpen); setStatusFilterOpen(false); }}
        onCategoryFilterSelect={(val) => { setCategoryFilter(val); setCategoryFilterOpen(false); }}
        sortBy={sortBy}
        onSortByChange={(val) => { setSortBy(val); if (val === 'custom') setSortDir('asc'); }}
        sortDir={sortDir}
        onSortDirToggle={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
      />

      <ProjectTable
        projects={filteredProjects}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
        isSuperAdminOrLead={isSuperAdminOrLead}
        projectHours={projectHours}
        draggedId={draggedId}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        canEditStatus={canEditStatus}
        editingStatusId={editingStatusId}
        setEditingStatusId={setEditingStatusId}
        onSaveProjectStatus={saveProjectStatus}
        canEditHours={!!canEditHours}
        editingHoursId={editingHoursId}
        editingMetric={editingMetric}
        editingHoursValue={editingHoursValue}
        onEditHoursStart={(id, metric, val) => { setEditingHoursId(id); setEditingMetric(metric); setEditingHoursValue(val); }}
        onEditHoursValueChange={setEditingHoursValue}
        onSaveHours={saveProjectMetric}
        onCancelEditHours={() => { setEditingHoursId(null); setEditingMetric(null); }}
        onOpenEdit={openEdit}
        onOpenDelete={openDeleteModal}
      />

      <ProjectModal
        isOpen={showModal}
        onClose={closeModal}
        onSuccess={fetchData}
        editingProject={editingProject}
        nextSortOrder={projects.length + 1}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Project?"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? All associated task data will be permanently removed. This action cannot be undone.`}
        confirmText="Permanently Delete"
      />
    </div>
  );
}
