'use client';

import React from 'react';
import { Skeleton } from '@/components/Skeleton';

export default function AdminTaskTableSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 flex-[2]" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
