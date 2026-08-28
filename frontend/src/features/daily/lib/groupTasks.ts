import type { TaskWithProject } from '../constants';

export interface GroupedTasks {
  overdue: TaskWithProject[];
  today: TaskWithProject[];
  tomorrow: TaskWithProject[];
  upcoming: TaskWithProject[];
  noDeadline: TaskWithProject[];
}

// Buckets active tasks by deadline relative to today. Completed tasks are excluded.
export function groupTasksByDeadline(tasks: TaskWithProject[]): GroupedTasks {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const overdue: TaskWithProject[] = [];
  const today: TaskWithProject[] = [];
  const tomorrow: TaskWithProject[] = [];
  const upcoming: TaskWithProject[] = [];
  const noDeadline: TaskWithProject[] = [];

  tasks.forEach((task) => {
    if (task.status === 'Complete') return;
    if (!task.deadline) {
      noDeadline.push(task);
      return;
    }
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    if (taskDate < todayDate) overdue.push(task);
    else if (taskDate.getTime() === todayDate.getTime()) today.push(task);
    else if (taskDate.getTime() === tomorrowDate.getTime()) tomorrow.push(task);
    else upcoming.push(task);
  });

  return { overdue, today, tomorrow, upcoming, noDeadline };
}
