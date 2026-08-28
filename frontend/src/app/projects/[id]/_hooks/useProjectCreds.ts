'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import { ProjectCredential } from '@/lib/types';

export function useProjectCreds(
  projectId: string,
  _isDemo: boolean,
  currentUser: any,
  credentials: ProjectCredential[],
  setCredentials: React.Dispatch<React.SetStateAction<ProjectCredential[]>>
) {
  const [showCredModal, setShowCredModal] = useState(false);
  const [editingCredId, setEditingCredId] = useState<string | null>(null);
  const [credLabel, setCredLabel] = useState('');
  const [credUrl, setCredUrl] = useState('');
  const [credUser, setCredUser] = useState('');
  const [credPass, setCredPass] = useState('');
  const [credNotes, setCredNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'task' | 'document' | 'credential' } | null>(null);

  const handleCredSubmit = async () => {
    if (!credLabel) return;
    setIsSubmitting(true);
    
    const credData = {
      project_id: projectId,
      label: credLabel,
      url: credUrl || null,
      username: credUser || null,
      password: credPass || null,
      notes: credNotes || null
    };

    if (editingCredId) {
      try {
        const data = await api.credentials.update(editingCredId, credData);
        setCredentials(prev => prev.map(c => c.id === editingCredId ? data : c));
        toast.success('Credential updated successfully');
        logActivity(projectId, currentUser?.id, 'Update Credential', `Updated credentials for "${data.label}"`);
      } catch (error: any) {
        toast.error(`Update failed: ${error.message}`);
      }
    } else {
      try {
        const data = await api.credentials.create(credData);
        setCredentials(prev => [data, ...prev]);
        toast.success('Credential created successfully');
        logActivity(projectId, currentUser?.id, 'Add Credential', `Added credentials for "${data.label}"`);
      } catch (error: any) {
        toast.error(`Creation failed: ${error.message}`);
      }
    }
    
    setCredLabel(''); setCredUrl(''); setCredUser(''); setCredPass(''); setCredNotes('');
    setEditingCredId(null);
    setShowCredModal(false);
    setIsSubmitting(false);
  };

  const handleDeleteCredential = async (id: string) => {
    const credToDelete = credentials.find(c => c.id === id);
    setIsDeleting(true);
    try {
      await api.credentials.remove(id);
      setCredentials(prev => prev.filter(c => c.id !== id));
      toast.success('Credential deleted successfully');
      if (credToDelete) {
        logActivity(projectId, currentUser?.id, 'Delete Credential', `Removed credentials for "${credToDelete.label}"`);
      }
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const openNewCredModal = () => {
    setCredLabel(''); setCredUrl(''); setCredUser(''); setCredPass(''); setCredNotes('');
    setEditingCredId(null);
    setShowCredModal(true);
  };

  const openEditCredModal = (cred: ProjectCredential) => {
    setEditingCredId(cred.id);
    setCredLabel(cred.label);
    setCredUrl(cred.url || '');
    setCredUser(cred.username || '');
    setCredPass(cred.password || '');
    setCredNotes(cred.notes || '');
    setShowCredModal(true);
  };

  return {
    showCredModal, setShowCredModal,
    editingCredId, setEditingCredId,
    credLabel, setCredLabel,
    credUrl, setCredUrl,
    credUser, setCredUser,
    credPass, setCredPass,
    credNotes, setCredNotes,
    isSubmitting, isDeleting,
    deleteConfirm, setDeleteConfirm,
    handleCredSubmit, handleDeleteCredential,
    openNewCredModal, openEditCredModal
  };
}
