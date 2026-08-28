import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { api } from '@/lib/api';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

interface TaskDescriptionCellProps {
  task: Task;
  onUpdate?: () => void;
}

export default function TaskDescriptionCell({ task, onUpdate }: TaskDescriptionCellProps) {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState(task.description);
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  const handleSaveDesc = async () => {
    if (!descText.trim()) return;
    if (descText.trim() === task.description) {
      setIsEditingDesc(false);
      return;
    }
    setIsSavingDesc(true);
    try {
      await api.tasks.update(task.id, { description: descText.trim() });
      toast.success('Task updated');
      setIsEditingDesc(false);
      onUpdate?.();
    } catch {
      toast.error('Failed to update task');
    }
    setIsSavingDesc(false);
  };

  return (
    <div className="flex-1 min-w-[200px] text-sm text-slate-600 group w-full">
      {isEditingDesc ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={descText}
            onChange={(e) => setDescText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveDesc()}
            className="flex-1 bg-white border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-violet-500 shadow-sm"
          />
          <button onClick={handleSaveDesc} disabled={isSavingDesc} className="p-1.5 text-white bg-emerald-500 hover:bg-emerald-600 rounded">
            {isSavingDesc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => { setIsEditingDesc(false); setDescText(task.description); }} className="p-1.5 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="truncate" title={task.description}>{task.description}</span>
          <button
            onClick={() => setIsEditingDesc(true)}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
            title="Edit Description"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
