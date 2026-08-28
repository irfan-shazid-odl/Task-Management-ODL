'use client';

import React, { useState } from 'react';
import { History, Search, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { useActivity } from '@/hooks/queries/useActivity';
import { useProjects } from '@/hooks/queries/useProjects';
import ActivityTable from '@/features/admin-activity/components/ActivityTable';

const ITEMS_PER_PAGE = 20;

export default function ActivityHistoryPage() {
  const { currentUser, loading: userLoading } = useUser();
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project');

  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState(initialProject || '');
  const [page, setPage] = useState(1);

  const { data: allActivities = [], isLoading } = useActivity(
    projectId ? { projectId } : {},
    !userLoading,
  );
  const { data: projects = [] } = useProjects({ orderBy: 'name', order: 'asc' }, !userLoading);

  // Filter BEFORE paginating: the API returns every row, so searching across
  // only the current page slice would never surface matches on later pages.
  const allFiltered = allActivities.filter((a) =>
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    (a.member?.name || '').toLowerCase().includes(search.toLowerCase()),
  );

  const totalFiltered = allFiltered.length;

  // The API returns all rows (newest first); there is no server-side range, so
  // paginate/slice client-side to preserve the original page size and count.
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageSlice = allFiltered.slice(start, start + ITEMS_PER_PAGE);
  const nextDisabled = start + ITEMS_PER_PAGE >= totalFiltered;

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProjectId(e.target.value);
    setPage(1); // a different project has a different total: jump back to page 1
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // searching shrinks the result set: start from page 1
  };

  // Role guard
  if (!userLoading && currentUser?.role === 'Member') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500">Only Admins and leads can view activity logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/tasks" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-500" />
              Full Activity History
            </h1>
            <p className="text-sm text-slate-500">Comprehensive audit trail of all project actions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 w-full md:w-64 transition-all"
            />
          </div>
          <select
            value={projectId}
            onChange={handleProjectChange}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 shadow-sm"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <ActivityTable
        rows={pageSlice}
        loading={userLoading || isLoading}
        page={page}
        nextDisabled={nextDisabled}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}
