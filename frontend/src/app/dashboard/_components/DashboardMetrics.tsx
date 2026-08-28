'use client';

import React, { memo } from 'react';
import MetricCard from '@/components/MetricCard';
import { Activity, Clock, FolderOpen, Zap } from 'lucide-react';
import { TaskStatus } from '@/lib/types';

interface DashboardMetricsProps {
  totalActive: number;
  totalWorkingHours: number;
  totalBillingHours: number;
  totalProjects: number;
  statusCounts: Array<{ status: TaskStatus; count: number }>;
  startDate: string;
  endDate: string;
}

const DashboardMetrics = memo(function DashboardMetrics({
  totalActive, totalWorkingHours, totalBillingHours, totalProjects, statusCounts, startDate, endDate
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <MetricCard
        title="Active Tasks"
        value={totalActive}
        subtitle="Excluding completed"
        icon={Activity}
        color="violet"
      />
      <MetricCard
        title="Working Hours"
        value={totalWorkingHours.toFixed(1)}
        subtitle={startDate === endDate ? `Logged today` : `Logged in filter range`}
        icon={Clock}
        color="cyan"
      />
      <MetricCard
        title="Logged Time"
        value={totalBillingHours.toFixed(1)}
        subtitle={startDate === endDate ? `Recorded today` : `Recorded in filter range`}
        icon={Clock}
        color="emerald"
      />
      <MetricCard
        title="Projects"
        value={totalProjects}
        subtitle="All categories"
        icon={FolderOpen}
        color="amber"
      />
      <MetricCard
        title="Ongoing Tasks"
        value={statusCounts.find(s => s.status === 'Working')?.count || 0}
        subtitle="Status: Working"
        icon={Zap}
        color="emerald"
      />
    </div>
  );
});

export default DashboardMetrics;
