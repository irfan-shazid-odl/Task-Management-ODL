'use client';

import React from 'react';
import { Skeleton } from '@/components/Skeleton';

export default function BoardKanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          {[1, 2, 3].map((task) => (
            <div key={task} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-2 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
