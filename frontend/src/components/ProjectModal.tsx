'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Loader2, Users, Building2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Client, PROJECT_CATEGORIES, TASK_PRIORITIES } from '@/lib/types';
import { useUser } from '@/components/UserContext';

const EMPTY_FORM: Partial<Project> = {
  name: '',
  client_id: '',
  category: 'Internal',
  project_lead_id: '',
  status: 'Active',
  priority: 'Low',
  project_type: '',
  start_date: new Date().toISOString().split('T')[0],
  brief: '',
};

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject: Project | null;
  nextSortOrder?: number;
}

export default function ProjectModal({ isOpen, onClose, onSuccess, editingProject, nextSortOrder }: ProjectModalProps) {
  const { teamMembers } = useUser();
  const [form, setForm] = useState<Partial<Project>>(EMPTY_FORM);
  const [clients, setClients] = useState<Client[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // eslint-disable react-hooks/set-state-in-effect -- resetting form state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setForm({
          name: editingProject.name || '',
          client_id: editingProject.client_id || '',
          category: editingProject.category || 'Internal',
          project_lead_id: editingProject.project_lead_id || '',
          status: editingProject.status || 'Active',
          priority: editingProject.priority || 'Low',
          project_type: editingProject.project_type || '',
          start_date: editingProject.start_date || '',
          brief: editingProject.brief || '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setNewClientName('');
      setErrors({});

      // Fetch clients for dropdown
      const fetchClients = async () => {
        try {
          const data = await api.clients.list();
          // API returns created_at desc; original ordered by name, so sort client-side.
          setClients([...data].sort((a, b) => a.name.localeCompare(b.name)));
        } catch {
          // Match original: on error, leave clients unchanged.
        }
      };
      fetchClients();
    }
  }, [isOpen, editingProject]);
  // eslint-enable react-hooks/set-state-in-effect

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.name?.trim()) newErrors.name = 'Project name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    
    try {
      let finalClientId = form.client_id || null;
      if (newClientName.trim()) {
        const newClient = await api.clients.create({ name: newClientName.trim() });
        finalClientId = newClient.id;
      }

      const payload = {
        name: form.name!.trim(),
        client_id: finalClientId,
        category: form.category || 'Internal',
        project_lead_id: form.project_lead_id || null,
        status: form.status,
        priority: form.priority,
        project_type: form.project_type || null,
        start_date: form.start_date || null,
        brief: form.brief || null,
      };

      if (editingProject) {
        await api.projects.update(editingProject.id, payload);
        toast.success('Project updated!');
      } else {
        await api.projects.create({
          ...payload,
          sort_order: nextSortOrder || 0
        });
        toast.success('Project added!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Save failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-xl border border-slate-200 my-8 flex flex-col"
          >
            {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h3 className="text-xl font-bold text-slate-900">
            {editingProject ? 'Edit Project' : 'New Project'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto w-full">
          {/* Name */}
          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-800 tracking-tight">Project Name <span className="text-red-500">*</span></label>
            <input
              type="text" 
              value={form.name} 
              onChange={e => {
                setForm({...form, name: e.target.value});
                if (errors.name) setErrors({...errors, name: ''});
              }}
              placeholder="e.g. AI Content Platform Development"
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 transition-all font-medium ${
                errors.name 
                  ? 'border-red-300 focus:ring-red-500/10 focus:border-red-500' 
                  : 'border-slate-200 focus:ring-violet-500/10 focus:border-violet-500'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs font-medium pl-1 mt-1">{errors.name}</p>}
          </div>

          {/* Client & Lead */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-1.5 w-full">
              <label className="text-sm font-semibold text-slate-800 tracking-tight">Client</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={form.client_id || ''} onChange={e => { setForm({...form, client_id: e.target.value}); setNewClientName(''); }}
                  disabled={!!newClientName}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium whitespace-nowrap overflow-ellipsis disabled:opacity-50"
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <input
                type="text"
                placeholder="Or create new client..."
                value={newClientName}
                onChange={(e) => {
                  setNewClientName(e.target.value);
                  if (e.target.value) setForm({ ...form, client_id: '' });
                }}
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>
            <div className="space-y-1.5 w-full">
              <label className="text-sm font-semibold text-slate-800 tracking-tight">Project Lead</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={form.project_lead_id || ''} onChange={e => setForm({...form, project_lead_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium"
                >
                  <option value="">Assing a lead...</option>
                  {teamMembers.filter(m => !m.is_paused).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category, Status, Priority */}
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 tracking-tight">Category</label>
              <div className="relative">
                <select
                  value={form.category || 'Internal'} onChange={e => setForm({...form, category: e.target.value as any})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium"
                >
                  {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 tracking-tight">Priority</label>
              <div className="relative">
                <select
                  value={form.priority || 'Low'} onChange={e => setForm({...form, priority: e.target.value as any})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium"
                >
                  {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 tracking-tight">Start Date</label>
              <input
                type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 tracking-tight">Project Type</label>
              <div className="relative">
                <select
                  value={form.project_type || ''} onChange={e => setForm({...form, project_type: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium"
                >
                  <option value="">Select a type...</option>
                  <option value="CRM">CRM</option>
                  <option value="Website">Website</option>
                  <option value="Vibe">Vibe</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 tracking-tight">Status</label>
              <div className="relative">
                <select
                  value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value as any})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Brief */}
          <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-800 tracking-tight">Brief / Notes</label>
            <textarea
              value={form.brief || ''} onChange={e => setForm({...form, brief: e.target.value})}
              rows={3}
              placeholder="Short description of the project goals..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-200 active:scale-[0.98] transition-all"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
