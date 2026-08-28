'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api, subscribeToChanges } from '@/lib/api';
import { useUser } from '@/components/UserContext';
import { TaskStatus, TASK_STATUSES } from '@/lib/types';
import { Zap } from 'lucide-react';

const TeamAnalytics = dynamic(() => import('@/components/TeamAnalytics'), { ssr: false });

import DashboardHeader from './_components/DashboardHeader';
import DashboardMetrics from './_components/DashboardMetrics';
import DashboardCharts from './_components/DashboardCharts';
import DashboardActivity from './_components/DashboardActivity';

interface StatusCount {
  status: TaskStatus;
  count: number;
}

export default function DashboardPage() {
  const { currentUser, loading: userLoading, teamMembers } = useUser();
  const router = useRouter();
  const [totalActive, setTotalActive] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>(
    TASK_STATUSES.map(s => ({ status: s, count: 0 }))
  );
  const [hoursToday, setHoursToday] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Array<{ description: string; status: TaskStatus; priority: string; project?: { id: string; name: string } }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    description: string;
    action_type: string;
    created_at: string;
    member: { name: string };
    project_name?: string;
  }>>([]);
  const [projectHours, setProjectHours] = useState<Array<{ id: string; name: string; category: string; hours: number }>>([]);
  const [totalWorkingHours, setTotalWorkingHours] = useState(0);
  const [totalBillingHours, setTotalBillingHours] = useState(0);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startCalendarMonth, setStartCalendarMonth] = useState(new Date());
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(todayStr);
  const [tempEndDate, setTempEndDate] = useState(todayStr);

  // Guards against out-of-order async responses: when the user changes the
  // member filter or date range while a fetch is in flight, the older (stale)
  // response must not overwrite the newer one.
  const fetchSeqRef = useRef(0);

  const fetchDashboardData = useCallback(async (isBackground = false) => {
    const fetchSeq = ++fetchSeqRef.current;
    if (!isBackground) {
      setLoading(true);
    }
    const memberFilter = selectedMemberId !== 'all' ? selectedMemberId : null;

    try {
      let memberTaskIds: string[] | null = null;
      if (memberFilter) {
        const assignments = await api.taskAssignments.list({ memberId: memberFilter });
        // If a newer request started while we waited, abandon this one.
        if (fetchSeqRef.current !== fetchSeq) return;
        memberTaskIds = assignments.map(a => a.task_id);
      }

      const safeTaskIds = memberTaskIds !== null
        ? (memberTaskIds.length > 0 ? memberTaskIds : ['__none__'])
        : null;

      const [
        statsData,
        recentData,
        actAll,
      ] = await Promise.all([
        api.stats.dashboard({
          memberId: memberFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        api.tasks.list({
          include: 'project',
          order_by: 'created_at',
          order: 'desc',
          limit: 5,
          created_from: startDate ? startDate + 'T00:00:00' : undefined,
          created_to: endDate ? endDate + 'T23:59:59' : undefined,
          ids: safeTaskIds ?? undefined,
        }),
        api.activity.list({
          memberId: memberFilter || undefined,
          createdFrom: startDate ? startDate + 'T00:00:00' : undefined,
          createdTo: endDate ? endDate + 'T23:59:59' : undefined,
          limit: 5,
        }),
      ]);

      // A newer request superseded this one — discard these stale results.
      if (fetchSeqRef.current !== fetchSeq) return;

      setTotalActive(statsData.totalActiveTasks);
      setStatusCounts(statsData.statusCounts as any);
      setHoursToday(statsData.totalWorkingHours);
      setTotalWorkingHours(statsData.totalWorkingHours);
      setTotalBillingHours(statsData.totalBillingHours);
      setTotalProjects(statsData.totalProjects);
      setTotalMembers(statsData.totalMembers);
      setProjectHours(statsData.projectHours as any);

      setRecentTasks(recentData ? recentData.map(t => ({
        description: t.description,
        status: t.status as TaskStatus,
        priority: t.priority,
        project: t.project as unknown as { id: string; name: string }
      })) : []);

      setRecentActivity(actAll ? actAll.map((a: Record<string, any>) => ({
        description: a.description,
        action_type: a.action_type,
        created_at: a.created_at,
        member: { name: a.member?.name || 'Unknown' },
        project_name: a.project?.name
      })) : []);

    } catch {
      // Backend not reachable
    }
    // Only the latest request may clear loading, so an older response can't
    // hide the spinner for a newer in-flight request.
    if (fetchSeqRef.current === fetchSeq) setLoading(false);
  }, [startDate, endDate, selectedMemberId]);

  useEffect(() => {
    if (userLoading) return;
    fetchDashboardData();

    let realtimeTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (realtimeTimeout) clearTimeout(realtimeTimeout);
      realtimeTimeout = setTimeout(() => fetchDashboardData(true), 500);
    };
    const unsub = subscribeToChanges(debouncedFetch);

      return () => {
      if (realtimeTimeout) clearTimeout(realtimeTimeout);
      unsub();
    };
  }, [userLoading, fetchDashboardData]);

  useEffect(() => {
    if (!userLoading && (currentUser?.role === 'Member' || currentUser?.role === 'Lead')) {
      router.replace('/board');
    }
  }, [currentUser, userLoading, router]);

  if (currentUser && (currentUser.role === 'Member' || currentUser.role === 'Lead')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center animate-pulse">
          <Zap className="w-12 h-12 text-violet-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Redirecting...</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Dashboard is restricted for Members and Leads.</p>
        </div>
      </div>
    );
  }

  const maxStatusCount = Math.max(...statusCounts.map(s => s.count), 1);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <DashboardHeader
        currentUser={currentUser}
        teamMembers={teamMembers}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        showStartCalendar={showStartCalendar}
        setShowStartCalendar={setShowStartCalendar}
        showEndCalendar={showEndCalendar}
        setShowEndCalendar={setShowEndCalendar}
        startCalendarMonth={startCalendarMonth}
        setStartCalendarMonth={setStartCalendarMonth}
        endCalendarMonth={endCalendarMonth}
        setEndCalendarMonth={setEndCalendarMonth}
        tempStartDate={tempStartDate}
        setTempStartDate={setTempStartDate}
        tempEndDate={tempEndDate}
        setTempEndDate={setTempEndDate}
      />

      {loading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded"></div>
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
                </div>
                <div className="h-8 w-16 bg-slate-300 dark:bg-slate-600 rounded mb-2"></div>
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm">
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-600 rounded mb-8"></div>
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex gap-4 items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded"></div>
                        <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <DashboardMetrics
            totalActive={totalActive}
            totalWorkingHours={totalWorkingHours}
            totalBillingHours={totalBillingHours}
            totalProjects={totalProjects}
            statusCounts={statusCounts}
            startDate={startDate}
            endDate={endDate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DashboardCharts
              statusCounts={statusCounts}
              maxStatusCount={maxStatusCount}
              projectHours={projectHours}
            />

            <DashboardActivity
              recentTasks={recentTasks}
              recentActivity={recentActivity}
            />
          </div>

          {currentUser && ['super-admin', 'Admin'].includes(currentUser.role) && (
            <TeamAnalytics />
          )}
        </>
      )}
    </div>
  );
}
