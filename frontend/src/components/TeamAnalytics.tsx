'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api, subscribeToChanges } from '@/lib/api';
import AnalyticsHeader from './_teamAnalyticsComponents/AnalyticsHeader';
import TeamSpotlights from './_teamAnalyticsComponents/TeamSpotlights';
import TeamLeaderboard from './_teamAnalyticsComponents/TeamLeaderboard';
import ProjectLeadRankings from './_teamAnalyticsComponents/ProjectLeadRankings';
import { MemberStats, LeadStats, Period, getDateRange } from './_teamAnalyticsComponents/types';

// ?????? Component ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
export default function TeamAnalytics() {
  const [period, setPeriod] = useState<Period>('day');
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Guards against out-of-order async responses: switching the period / date
  // range while a fetch is in flight must not let an older response overwrite
  // the newer period's stats.
  const fetchSeqRef = useRef(0);

  const fetchAnalytics = useCallback(async () => {
    const fetchSeq = ++fetchSeqRef.current;
    setLoading(true);
    const { from, to } = useCustomRange
      ? { from: selectedDate, to: today }
      : getDateRange(period);

    try {
      // 1. Fetch all team members
      const members = await api.users.list();

      // If a newer fetch took over, abandon this one.
      if (fetchSeqRef.current !== fetchSeq) return;

      // 2. Fetch time_logs in date range
      const timeLogs = await api.timeLogs.list({ logDateGte: from, logDateLte: to });

      if (fetchSeqRef.current !== fetchSeq) return;

      // 3. Fetch all tasks
      const tasks = await api.tasks.list();

      if (fetchSeqRef.current !== fetchSeq) return;

      // 4. Fetch task_assignments
      const assignments = await api.taskAssignments.list();

      if (fetchSeqRef.current !== fetchSeq) return;

      // 5. Fetch projects with leads
      const projects = await api.projects.list();

      if (fetchSeqRef.current !== fetchSeq) return;

      // ?????? Build member stats ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      const taskProjectMap: Record<string, string> = {};
      const taskStatusMap: Record<string, string> = {};
      (tasks || []).forEach((t: any) => {
        taskProjectMap[t.id] = t.project_id;
        taskStatusMap[t.id] = t.status;
      });

      // Completion can be signaled two ways that each can lag the other:
      //   ??? task_assignments.status ??? set when completing from "mine"/a
      //     specific member's board view.
      //   ??? tasks.status ??? set when completing from "All members" view,
      //     which never touches each assignee's task_assignments.status
      //     (it stays at whatever it was, often the 'Todo' default).
      // A member's task counts as done if EITHER says Complete.
      const memberTasks: Record<string, Set<string>> = {};
      const memberTaskStatus: Record<string, Map<string, string>> = {};
      const memberProjects: Record<string, Set<string>> = {};
      (assignments || []).forEach((a: any) => {
        if (!memberTasks[a.member_id]) memberTasks[a.member_id] = new Set();
        memberTasks[a.member_id].add(a.task_id);
        if (!memberTaskStatus[a.member_id]) memberTaskStatus[a.member_id] = new Map();
        memberTaskStatus[a.member_id].set(a.task_id, a.status);
        const projId = taskProjectMap[a.task_id];
        if (projId) {
          if (!memberProjects[a.member_id]) memberProjects[a.member_id] = new Set();
          memberProjects[a.member_id].add(projId);
        }
      });
      const isDoneForMember = (memberId: string, taskId: string): boolean =>
        memberTaskStatus[memberId]?.get(taskId) === 'Complete' || taskStatusMap[taskId] === 'Complete';

      // Hours per member (in date range)
      const memberHours: Record<string, number> = {};
      const memberBilling: Record<string, number> = {};
      // Pre-build task ??? hours map to avoid O(n??) in lead stats calculation
      const taskHoursMap: Record<string, number> = {};
      (timeLogs || []).forEach((log: any) => {
        memberHours[log.member_id] = (memberHours[log.member_id] || 0) + (log.hours_logged || 0);
        memberBilling[log.member_id] = (memberBilling[log.member_id] || 0) + (log.billing_hours || 0);
        taskHoursMap[log.task_id] = (taskHoursMap[log.task_id] || 0) + (log.hours_logged || 0);
      });

      // Pre-compute maxes once outside the map to avoid recalculating per member
      const maxHours = Math.max(...Object.values(memberHours), 1);
      const maxTasks = Math.max(...Object.entries(memberTasks).map(([memberId, s]) => [...s].filter(tid => isDoneForMember(memberId, tid)).length), 1);
      const maxProjects = Math.max(...Object.values(memberProjects).map(s => s.size), 1);
      const maxBilling = Math.max(...Object.values(memberBilling), 1);

      const stats: MemberStats[] = (members || []).map((m: any) => {
        const assigned = memberTasks[m.id]?.size || 0;
        const completed = [...(memberTasks[m.id] || [])].filter(tid => isDoneForMember(m.id, tid)).length;
        const hours = memberHours[m.id] || 0;
        const billing = memberBilling[m.id] || 0;
        const projects = memberProjects[m.id]?.size || 0;
        const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0;
        const avgHours = assigned > 0 ? hours / assigned : 0;

        // Score: Hours (40%) + Tasks completed (25%) + Projects (15%) + Billing (10%) + Completion rate (10%)
        const score =
          (hours / maxHours) * 40 +
          (completed / maxTasks) * 25 +
          (projects / maxProjects) * 15 +
          (billing / maxBilling) * 10 +
          (completionRate / 100) * 10;

        return {
          id: m.id,
          name: m.name,
          role: m.role,
          totalHours: hours,
          totalBillingHours: billing,
          tasksCompleted: completed,
          tasksAssigned: assigned,
          projectsInvolved: projects,
          avgHoursPerTask: avgHours,
          completionRate,
          score: isNaN(score) ? 0 : score,
        };
      });

      stats.sort((a, b) => b.score - a.score);
      if (fetchSeqRef.current !== fetchSeq) return;
      setMemberStats(stats);

      // ?????? Build lead stats ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      const leadProjects: Record<string, string[]> = {};
      (projects || []).forEach((p: any) => {
        if (p.project_lead_id) {
          if (!leadProjects[p.project_lead_id]) leadProjects[p.project_lead_id] = [];
          leadProjects[p.project_lead_id].push(p.id);
        }
      });

      // Pre-build project ??? tasks map to avoid O(n) filter per project
      const tasksByProjectId: Record<string, any[]> = {};
      (tasks || []).forEach((t: any) => {
        if (!tasksByProjectId[t.project_id]) tasksByProjectId[t.project_id] = [];
        tasksByProjectId[t.project_id].push(t);
      });

      // For each lead: aggregate tasks, hours, unique team members across their projects
      const leads: LeadStats[] = Object.entries(leadProjects).map(([leadId, projIds]) => {
        const member = (members || []).find((m: any) => m.id === leadId);
        if (!member) return null;

        let totalTasks = 0;
        let completedTasks = 0;
        let totalProjectHours = 0;
        const teamMemberIds = new Set<string>();

        projIds.forEach(projId => {
          const projectTasks = tasksByProjectId[projId] || [];
          totalTasks += projectTasks.length;
          completedTasks += projectTasks.filter((t: any) => t.status === 'Complete').length;

          // Use pre-built taskHoursMap instead of nested O(n??) loop
          projectTasks.forEach((t: any) => {
            totalProjectHours += taskHoursMap[t.id] || 0;
          });

          (assignments || []).forEach((a: any) => {
            if (taskProjectMap[a.task_id] === projId) {
              teamMemberIds.add(a.member_id);
            }
          });
        });

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Lead score: projects managed (30%) + completion rate (25%) + team coordination (20%) + hours delivered (25%)
        const score =
          projIds.length * 30 +
          completionRate * 0.25 +
          teamMemberIds.size * 20 +
          totalProjectHours * 0.25;

        return {
          id: leadId,
          name: (member as any).name,
          role: (member as any).role,
          projectsManaged: projIds.length,
          totalProjectHours,
          totalTasks,
          completedTasks,
          completionRate,
          teamSize: teamMemberIds.size,
          score,
        };
      }).filter(Boolean) as LeadStats[];

      leads.sort((a, b) => b.score - a.score);
      if (fetchSeqRef.current !== fetchSeq) return;
      setLeadStats(leads);

    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      // Only the latest request clears the spinner so an older one can't hide it
      // for a newer in-flight fetch.
      if (fetchSeqRef.current === fetchSeq) setLoading(false);
    }
  }, [period, useCustomRange, selectedDate, today]);

  // eslint-disable react-hooks/set-state-in-effect -- async data fetching is the correct pattern here
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  // eslint-enable react-hooks/set-state-in-effect

  // Real-time with debounce to prevent rapid-fire refetches
  useEffect(() => {
    let realtimeTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (realtimeTimeout) clearTimeout(realtimeTimeout);
      realtimeTimeout = setTimeout(fetchAnalytics, 500);
    };
    const unsub = subscribeToChanges(debouncedFetch);
    return () => {
      if (realtimeTimeout) clearTimeout(realtimeTimeout);
      unsub();
    };
  }, [fetchAnalytics]);

  const topEmployee = memberStats[0];
  const topLead = leadStats[0];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
        </div>
        <div className="h-96 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        period={period} setPeriod={setPeriod}
        showCustomRange={showCustomRange} setShowCustomRange={setShowCustomRange}
        useCustomRange={useCustomRange} setUseCustomRange={setUseCustomRange}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        tempSelectedDate={tempSelectedDate} setTempSelectedDate={setTempSelectedDate}
        calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth}
        today={today}
      />
      
      <TeamSpotlights topEmployee={topEmployee} topLead={topLead} period={period} />
      
      <TeamLeaderboard memberStats={memberStats} period={period} expanded={expanded} setExpanded={setExpanded} />
      
      <ProjectLeadRankings leadStats={leadStats} period={period} />
    </div>
  );
}
